const { SlashCommandBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('threads')
        .setDescription('Displays a list of current threads in the server.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('all')
				.setDescription('Displays a list of all threads in the server.')
		)
        .addSubcommand(subcommand =>
            subcommand
                .setName('active')
                .setDescription('Displays a list of active threads in the server.')
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('archived')
				.setDescription('Displays a list of archived threads in the server.')
		),
		async execute(interaction) {
			let channels = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
		  
			let threads = await Promise.all(channels.map(async (channel) => {
			  let archivedThreads = await channel.threads.fetchArchived();  
			  let activeThreads = await channel.threads.fetch();
			  return { archivedThreads, activeThreads };
			}));
		  
			let combinedThreads = threads.reduce((acc, curr) => {
			  acc.archivedThreads.threads = acc.archivedThreads.threads.concat(curr.archivedThreads.threads);
			  acc.activeThreads.threads = acc.activeThreads.threads.concat(curr.activeThreads.threads);
			  return acc;
			});
		  
			const subcommand = interaction.options.getSubcommand();
			// If the subcommand is active, set activeOnly to true.
			switch (subcommand) {
			  case 'active':
				threads = combinedThreads.activeThreads.threads;
				break;
			  case 'archived':
				threads = combinedThreads.archivedThreads.threads;
				break;
			  case 'all':
			  case 'default':
				threads = combinedThreads.activeThreads.threads.concat(combinedThreads.archivedThreads.threads);
				break;
			}
		  
			if (!threads.size) {
			  await interaction.reply(`No threads to pull!`);
			  return;
			}
		  
			// Update thread names to include parent name
			await Promise.all(threads.map(async (thread) => {
			  if (!thread.name) {
				const fetchedThread = await thread.fetch();
				thread.name = fetchedThread.name;
			  }
			  //console.log(thread.name);
			}));
		  
			const threadsByParent = {};
			threads.forEach(t => {
			  if ( ! threadsByParent[ t.parent.name ] ) threadsByParent[ t.parent.name ] = [];
			  threadsByParent[t.parent.name].push(t);
			});
			const threadList = Object.entries(threadsByParent).map(([parentName, threadList]) => {
			  const threadListStr = threadList.map(t => `[${t.name}](https://discord.com/channels/${interaction.guild.id}/${t.id})`).join('\n');
			  return `**${parentName}**\n${threadListStr}`;
			}).join('\n\n');
		  
			let message = subcommand.charAt(0).toUpperCase() + subcommand.slice(1);
			if (subcommand === 'all') {
			  message = 'Active and archived';
			}
		  
			await interaction.reply({
			  content: `${message} threads in ${interaction.guild.name}:\n\n${threadList}`,
			  ephemeral: true
			});
		  }
};
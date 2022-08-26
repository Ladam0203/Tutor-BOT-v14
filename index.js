// Require the necessary discord.js classes
const { Client, GatewayIntentBits, ChannelType, PermissionsBitField, InteractionCollector } = require('discord.js');
const { token } = require('./config.json');

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Login to Discord with your client's token
client.login(token);

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!');
});


client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const { commandName} = interaction;

	if (commandName === 'ticket') {
		if (interaction.options.getSubcommand() === 'open') {
			if (interaction.channel.name !== "open-a-ticket")
			{
				await interaction.reply({ content: "This command cannot be used here!", ephemeral: true });
				return;
			}

			let ticketChannelName = "ticket-" + makeTicketId();

			const openTicketCategory = interaction.guild.channels.cache.find(c => c.name === "Open Tickets");

			await interaction.guild.channels.create({
				name: ticketChannelName,
				type: 0,
				parent: openTicketCategory.id,
				permissionOverwrites : [
					{
						id: interaction.user.id,
						allow: [PermissionsBitField.Flags.ViewChannel],
					},
					{
						id: interaction.channel.guild.roles.everyone.id,
						deny: [PermissionsBitField.Flags.ViewChannel],
					}
				],
			});

			let ticketChannel = client.channels.cache.find(c => c.name === ticketChannelName)

			await interaction.reply({ content: "Your ticket has been created in: <#" + ticketChannel.id + ">.", ephemeral: true });

			//change message if tutor or tutors are picked
			await ticketChannel.send({ content: "Hey, <@" + interaction.user.id + ">! Please elaborate on your question while we find a tutor to assist you!", ephemeral: true });

			const tutorRole = interaction.guild.roles.cache.find(r => r.name === 'Tutor');
			const ticketOpenedPingChannel = client.channels.cache.find(c => c.name === "ticket-opened-ping");

			await ticketOpenedPingChannel.send("<@&" + tutorRole.id+">s! <@" + interaction.user.id + "> needs assistance in <#" + ticketChannel.id + ">!");
		}

		if (interaction.options.getSubcommand() === 'take') {
			//check permission (Tutor role)
			if (!interaction.member.roles.cache.some(role => role.name === "Tutor"))
			{
				await interaction.reply({ content: "Insufficient permissions!", ephemeral: true });
				return;
			}
			//check channel
			if ((!interaction.channel.name.includes("ticket") || interaction.channel.name === "ticket-opened-ping") || interaction.channel.parent.name !== "Open Tickets") { //TODO: write a regex 
				await interaction.reply({ content: "This command cannot be used here!", ephemeral: true });
				return;
			}
			//move ticket to ongoing
			let ongoingTicketsCategory = client.channels.cache.find(c => c.name === "Ongoing Tickets")
			interaction.channel.setParent(ongoingTicketsCategory)
			//announce who came to help
			await interaction.reply("<@" + interaction.user.id + "> is here to help!");
		}

		if (interaction.options.getSubcommand() === 'close') {
			//check channel
			if ((!interaction.channel.name.includes("ticket") || interaction.channel.name === "ticket-opened-ping") || interaction.channel.parent.name !== "Ongoing Tickets") { //TODO: write a regex 
				await interaction.reply({ content: "This command cannot be used here!", ephemeral: true });
				return;
			}
			//move ticket to closed
			let closedTicketsCategory = client.channels.cache.find(c => c.name === "Closed Tickets")
			interaction.channel.setParent(closedTicketsCategory)
			//make it read only
			interaction.channel.permissionOverwrites.create(interaction.channel.guild.roles.everyone, { SendMessages: false });

			//announce who came to help
			await interaction.reply("Ticket has been closed and it can be found under closed tickets, WARNING: closed tickets will be deleted after a set amount of time!");
		}
	}

	if (commandName === 'ping') {
		await interaction.reply('Pong!');
	} else if (commandName === 'server') {
		await interaction.reply('Server info.');
	} else if (commandName === 'user') {
		await interaction.reply('User info.');
	}
});

//UTILITY
function makeTicketId() {
    var length = 5;
    var result           = '';
    var characters       = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}
// Require the necessary discord.js classes
const { Client, GatewayIntentBits, ChannelType, PermissionsBitField } = require('discord.js');
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

	const { commandName, member } = interaction;

	if (commandName === 'ticket') {
		if (interaction.options.getSubcommand() === 'open') {
			if (interaction.channel.name !== "open-a-ticket")
			{
				await interaction.reply({ content: "This command cannot be used here!", ephemeral: true });
				return;
			}

			let ticketChannelName = "ticket-" + makeTicketId();

			const openTicketCategory = interaction.guild.channels.cache.find(c => c.name === "Open Tickets");
			const everyoneRole = interaction.guild.roles.cache.find(r => r.name === '@everyone');

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
						id: everyoneRole.id,
						deny: [PermissionsBitField.Flags.ViewChannel],
					}
				],
			});

			await interaction.reply({ content: "Your ticket has been created under the " + openTicketCategory.name + " category, with the name " + ticketChannelName + "!", ephemeral: true });

			let ticketChannel = client.channels.cache.find(c => c.name === ticketChannelName)
			await ticketChannel.send({ content: "Please elaborate on your question while we find a tutor to assist you!", ephemeral: true });

			const tutorRole = interaction.guild.roles.cache.find(r => r.name === 'Tutor');
			const ticketOpenedPingChannel = client.channels.cache.find(c => c.name === "ticket-opened-ping");
			await ticketOpenedPingChannel.send("<@&" + tutorRole.id+">s! " + interaction.user.tag + " needs assistance in " + ticketChannelName + "!");
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
			await interaction.reply(interaction.user.tag + " is here to help!");
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
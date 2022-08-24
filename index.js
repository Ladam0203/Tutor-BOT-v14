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

	const { commandName } = interaction;

	if (commandName === 'ticket') {
		if (interaction.options.getSubcommand() === 'open') {
			if (interaction.channel.name !== "open-a-ticket")
			{
				await interaction.reply({ content: "This command is prohibited on this channel!", ephemeral: true });
				return;
			}

			let ticketId = makeTicketId();

			var openTicketCategory = interaction.guild.channels.cache.find(c => c.name === "Open Tickets" && c.type === 4);
			var studentsRole = interaction.guild.roles.cache.find(r => r.name === 'Student');

			interaction.guild.channels.create({
				name: ticketId,
				type: 0,
				parent: openTicketCategory.id,
				permissionOverwrites : [
					{
						id: studentsRole.id,
						deny: [PermissionsBitField.Flags.ViewChannel],
					},
					{
						id: interaction.user.id,
						allow: [PermissionsBitField.Flags.ViewChannel],
					}
				],
			});

			await interaction.reply({ content: "Your ticket has been created under the " + openTicketCategory.name + " category, with the name " + ticketId + "!", ephemeral: true });
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
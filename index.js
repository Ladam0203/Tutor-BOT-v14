/*
IDEAS: 
Specify 0...N tutors in the ticket open command
Use embeds to send messages
Use buttons to take and close tickets

Channel names design
Emojis to channels

REFACTORING!!!
*/

// Require the necessary discord.js classes
const { Client, GatewayIntentBits, ChannelType, PermissionsBitField, InteractionCollector, EmbedBuilder } = require('discord.js');
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
			//add error message if there are too many open tickets

			if (interaction.channel.name !== "open-a-ticket")
			{
				await interaction.reply(asEmbed("You cannot use this command here!", true));
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

			await interaction.reply(asEmbed("Your ticket has been created in: <#" + ticketChannel.id + ">.", true));

			//change message if tutor or tutors are picked
			await ticketChannel.send(asEmbed("Hey, <@" + interaction.user.id + ">! Please elaborate on your question while we find a tutor to assist you!", false));

			const tutorRole = interaction.guild.roles.cache.find(r => r.name === 'Tutor');
			const ticketOpenedPingChannel = client.channels.cache.find(c => c.name === "ticket-opened-ping");

			await ticketOpenedPingChannel.send(asEmbed("<@&" + tutorRole.id+">s! <@" + interaction.user.id + "> needs assistance in <#" + ticketChannel.id + ">!"), false);
		}

		if (interaction.options.getSubcommand() === 'claim') {
			//add error message if there are too many ongoing tickets

			//check permission (Tutor role)
			if (!interaction.member.roles.cache.some(role => role.name === "Tutor"))
			{
				await interaction.reply(asEmbed("Insufficient permissions!", true));
				return;
			}
			//check channel
			if (!interaction.channel.name.match("^ticket-[a-z0-9]{4}") || interaction.channel.parent.name !== "Open Tickets") { //TODO: write a regex 
				await interaction.reply(asEmbed("You cannot use this command here!", true));
				return;
			}
			//move ticket to ongoing
			let ongoingTicketsCategory = client.channels.cache.find(c => c.name === "Ongoing Tickets")
			interaction.channel.setParent(ongoingTicketsCategory)
			//announce who came to help
			await interaction.reply(asEmbed("<@" + interaction.user.id + "> is here to help!", false));
		}

		if (interaction.options.getSubcommand() === 'close') {
			//check channel
			if ((!interaction.channel.name.includes("ticket") || interaction.channel.name === "ticket-opened-ping") || interaction.channel.parent.name !== "Ongoing Tickets") { //TODO: write a regex 
				await interaction.reply(asEmbed("You cannot use this command here!", true));
				return;
			}

			let closedTicketsCategory = findChannel(client, "Closed Tickets", 4);
			if (isCategoryFull(client, closedTicketsCategory)) {
				deleteChannelsInCategory(client, closedTicketsCategory);
			}

			//move ticket to closed
			interaction.channel.setParent(closedTicketsCategory)
			//make it read only
			interaction.channel.permissionOverwrites.create(interaction.channel.guild.roles.everyone, { SendMessages: false });

			//announce who came to help
			await interaction.reply(asEmbed("Ticket has been closed and it can be found under closed tickets, WARNING: closed tickets will be deleted after a set amount of time!", false));
		}
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

function isCategoryFull(client, category) {
	return client.channels.cache.filter(channel => channel.parent === category && channel.type === 0).size >= 50; //CHANGE 1 to 50 AFTER TEST
}

function deleteChannelsInCategory(client, category) {
	client.channels.cache.filter(channel => channel.parent === category && channel.type === 0).forEach(
		channel => channel.delete());
}

function findChannel(client, channelName, type) {
	return client.channels.cache.find(channel => channel.name === channelName && channel.type === type);
}

function asEmbed(message, isEphemeral) {
	let embed = new EmbedBuilder()
	.setColor(0x00CED1)
	.setDescription(message);

	return {embeds: [embed], ephemeral: isEphemeral };
}
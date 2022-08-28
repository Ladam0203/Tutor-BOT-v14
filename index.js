/*
IDEAS: 
Specify 0...N tutors in the ticket open banner... dropdown?
Use buttons to take and close tickets
Ticket transcript in private message from bot

Channel names design
Emojis to channels
Channel icon: wombat with diploma cap, tutor bot icon: wombat

Claim/close buttons should be disabled after they were clicked
Claim should change to a Release button if a tutor cannot help

REFACTORING!!!
*/

// Require the necessary discord.js classes
const { Client, GatewayIntentBits, ChannelType, PermissionsBitField, InteractionCollector, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SelectMenuBuilder } = require('discord.js');
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
	if (!interaction.isChatInputCommand() && !interaction.isButton()) return;

	//BUTTONS
	if (interaction.isButton()) {
		if (interaction.customId === "openTicket")
		{
			//add error message if there are too many open tickets

			let ticketChannelName = "ticket-" + makeTicketId();

			const openTicketCategory = interaction.guild.channels.cache.find(c => c.name === "📫 Open Tickets");

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
			let embed = new EmbedBuilder()
			.setColor(0x00CED1)
			.setTitle("Your ticket has been opened!")
			.setDescription("Here you should elaborate on your question until a tutor arrives to help you!")
			.setFooter({ text: "Don't worry about the buttons below, they are for our tutors to manage your ticket."});
		
			const row = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setCustomId('claimTicket')
							.setLabel('Claim')
							.setStyle(ButtonStyle.Secondary),
					).addComponents(
						new ButtonBuilder()
							.setCustomId('closeTicket')
							.setLabel('Close')
							.setStyle(ButtonStyle.Danger),
					);
			let msg = await ticketChannel.send({embeds: [embed], components: [row]});
			msg.pin();

			//await ticketChannel.send(asEmbed("Hey, <@" + interaction.user.id + ">! Please elaborate on your question while we find a tutor to assist you!", false));

			const tutorRole = interaction.guild.roles.cache.find(r => r.name === 'Tutor');
			const ticketOpenedPingChannel = client.channels.cache.find(c => c.name === "ticket-opened-ping");

			await ticketOpenedPingChannel.send(asEmbed("<@&" + tutorRole.id+">s! <@" + interaction.user.id + "> needs assistance in <#" + ticketChannel.id + ">!"), false);
		}
		if (interaction.customId === "claimTicket")
		{
			//add error message if there are too many ongoing tickets

			//send ping about claimed ticket?

			//check permission (Tutor role)
			if (!isTutor(interaction))
			{
				await interaction.reply(asEmbed("Insufficient permissions!", true));
				return;
			}

			//move ticket to ongoing
			let ongoingTicketsCategory = client.channels.cache.find(c => c.name === "📬 Ongoing Tickets")
			interaction.channel.setParent(ongoingTicketsCategory)
			//announce who came to help
			await interaction.reply(asEmbed("<@" + interaction.user.id + "> is here to help!", false));
		}
		if (interaction.customId === "closeTicket")
		{
			if (!isTutor(interaction))
			{
				await interaction.reply(asEmbed("Insufficient permissions!", true));
				return;
			}

			let closedTicketsCategory = findChannel(client, "📭 Closed Tickets", 4);
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

	//SLASH COMMANDS

	const { commandName} = interaction;

	if (commandName === 'ticketopenbanner') {
		if (!isTutor(interaction)) {
			await interaction.reply(asEmbed("Insufficient permissions!", true));
			return;
		}

		let embed = new EmbedBuilder()
		.setColor(0x00CED1)
		.setTitle("Need help?")
		.setDescription("Press the button below to open a ticket!")
		.setFooter({ text: "Don't worry, only you and the tutors can see your ticket!"})
	
		const open = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('openTicket')
						.setLabel('Open')
						.setStyle(ButtonStyle.Primary),
				)
		interaction.channel.send({embeds: [embed], components: [open]})
		interaction.reply(asEmbed('"Open a Ticekt" banner has been succesfully sent to the channel!', true))
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

function isTutor(interaction) {
	return interaction.member.roles.cache.some(role => role.name === "Tutor");
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
	.setDescription(message)
	.setTimestamp();

	/* //A way to choose multiple tutors?
	const row2 = new ActionRowBuilder()
			.addComponents(
				new SelectMenuBuilder()
					.setCustomId('select')
					.setPlaceholder('Nothing selected')
					.setMinValues(2)
					.setMaxValues(3)
					.addOptions([
						{
							label: 'Select me',
							description: 'This is a description',
							value: 'first_option',
						},
						{
							label: 'You can select me too',
							description: 'This is also a description',
							value: 'second_option',
						},
						{
							label: 'I am also an option',
							description: 'This is a description as well',
							value: 'third_option',
						},
					]),
			);*/

	return {embeds: [embed], ephemeral: isEphemeral};
}
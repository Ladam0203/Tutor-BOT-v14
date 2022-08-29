/*
IDEAS: 
Ticket transcript in private message from bot AFTER merge tickets to be under one channel
Claim/close buttons should be disabled after they were clicked
Claim should change to a Release button if a tutor cannot help
No tutor appeared? change visibility for this ticket only FOLLOW UP, if there is no answer in 5 mins
Add tutor to ticket

Channel names design
Emojis to channels

REFACTORING!!!
*/

// Require the necessary discord.js classes
const { Client, GatewayIntentBits, ChannelType, PermissionsBitField, InteractionCollector, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SelectMenuBuilder } = require('discord.js');
const { token } = require('./config.json');
const fs = require('fs')

const userPreferencesPath = './user_preferences.json';
const userPreferences = JSON.parse(fs.readFileSync(userPreferencesPath));

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Login to Discord with your client's token
client.login(token);

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!');
});


client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand() && !interaction.isButton() && !interaction.isSelectMenu()) return;

	//BUTTONS
	if (interaction.isButton()) {
		if (interaction.customId === "openTicket")
		{
			//add error message if there are too many open tickets

			//TODO: take into account preferences

			let ticketChannelName = "ticket-" + makeTicketId();

			const openTicketCategory = interaction.guild.channels.cache.find(c => c.name === "📫 • Open Tickets");

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

			//Set up permissions and send pings accordingly
			let hasPreferences = userPreferences[interaction.user.id] && userPreferences[interaction.user.id].tutors.split(', ').length !== 2; //TODO: Rewrite 1 to 5 if other tutors added
			let preferredTutorIds;
			if (hasPreferences) { 
				preferredTutorIds = userPreferences[interaction.user.id].tutors.split(", ");
				preferredTutorIds.forEach(tutorId =>
					ticketChannel.permissionOverwrites.create(tutorId, { ViewChannel: true }));
				
			} else {
				ticketChannel.permissionOverwrites.create(interaction.guild.roles.cache.find(r => r.name === 'Tutor').id, { ViewChannel: true })
			}
			
			await interaction.reply(asEmbed("Your ticket has been created in <#" + ticketChannel.id + ">!", true));

			//change message if tutor or tutors are picked
			let embed = new EmbedBuilder()
			.setColor(0x00CED1)
			.setTitle("Ticket has been opened!")
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

			const tutorRole = interaction.guild.roles.cache.find(r => r.name === 'Tutor');
			const ticketOpenedPingChannel = client.channels.cache.find(c => c.name === "ticket-opened-ping");

			if (hasPreferences) {
				await ticketOpenedPingChannel.send(
					asEmbed(preferredTutorIds.map(id => "<@" + id + ">").join(', ') + "! <@" + interaction.user.id + "> needs assistance in <#" + ticketChannel.id + ">!"), false);
			} else {
				await ticketOpenedPingChannel.send(asEmbed("<@&" + tutorRole.id+ ">s! <@" + interaction.user.id + "> needs assistance in <#" + ticketChannel.id + ">!"), false);
			}
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
			let ongoingTicketsCategory = client.channels.cache.find(c => c.name === "📬 • Ongoing Tickets")
			interaction.channel.setParent(ongoingTicketsCategory)
			//announce who came to help
			let embed = new EmbedBuilder()
			.setColor(0x00CED1)
			.setTitle('Ticket has been marked as "ongoing"!')
			.setDescription("<@" + interaction.user.id + "> is here to help!")
			await interaction.reply({embeds: [embed]});
		}
		if (interaction.customId === "closeTicket")
		{
			if (!isTutor(interaction))
			{
				await interaction.reply(asEmbed("Insufficient permissions!", true));
				return;
			}

			let closedTicketsCategory = findChannel(client, "📭 • Closed Tickets", 4);
			if (isCategoryFull(client, closedTicketsCategory)) {
				deleteChannelsInCategory(client, closedTicketsCategory);
			}

			//move ticket to closed
			interaction.channel.setParent(closedTicketsCategory)
			//make it read only
			interaction.channel.permissionOverwrites.create(interaction.channel.guild.roles.everyone, { SendMessages: false });

			//announce who came to help
			let embed = new EmbedBuilder()
			.setColor(0x00CED1)
			.setTitle('Ticket has been closed')
			.setDescription("Hope this helped!")
			.setFooter({ text: "WARNING: Closed tickets will be deleted after a set amount of time!"})
			await interaction.reply({embeds : [embed]});
		}
	}

	//SELECT MENUS
	if (interaction.isSelectMenu()) {
		if (interaction.customId === "selectTutors") {
			userPreferences[interaction.user.id] = {tutors: interaction.values.join(', ')}; //if not, create it
			fs.writeFileSync(userPreferencesPath, JSON.stringify(userPreferences, null, 2));
			await interaction.reply(asEmbed("Preferences saved!", true)); //TODO: actually list the tutors chosen
		}
	}

	//SLASH COMMANDS

	const { commandName} = interaction;

	if (commandName === 'openticketbanner') {
		if (!isTutor(interaction)) {
			await interaction.reply(asEmbed("Insufficient permissions!", true));
			return;
		}

		let embed = new EmbedBuilder()
		.setColor(0x00CED1)
		.setTitle("Need help?")
		.setDescription("Press the button below to open a ticket!")
		.setFooter({ text: "Don't worry, only you and the chosen tutors can see your ticket!"})
	
		const open = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('openTicket')
						.setLabel('Open')
						.setStyle(ButtonStyle.Primary),
				);
		await interaction.channel.send({embeds: [embed], components: [open]})
		interaction.reply(asEmbed('"Open a Ticket" banner has been succesfully sent to the channel!', true))
	}

	if (commandName === "selecttutorsbanner")
	{
		if (!isTutor(interaction)) {
			await interaction.reply(asEmbed("Insufficient permissions!", true));
			return;
		}

		let embed = new EmbedBuilder()
		.setColor(0x00CED1)
		.setTitle("Who do you prefer?")
		.setDescription("By default, all tutors can you your tickets. Below, you can change this!")
		.setFooter({ text: "NOTE: This only applies to your future tickets: it won't change the visibility of your already created ones.\nNOTE: If you have chosen tutors before, but cannot see them below: don't worry, they are saved."})
	
		//TODO: fill these out with valid values
		const select = new ActionRowBuilder()
				.addComponents(
					new SelectMenuBuilder()
						.setCustomId('selectTutors')
						.setPlaceholder('All the tutors can see your tickets.')
						.setMinValues(1)
						//.setMaxValues(5) //TODO: Uncomment this when other tutors added
						.addOptions([ //TODO: Extend with the other tutors
							{
								label: 'L. Ádám',
								description: 'Languages: English, Hungarian',
								value: '270592043473043480',
							},
							{
								label: 'Tutor 2',
								description: 'Languages: English, Hungarian',
								value: 'tutor2',
							}
						]),
				);
		await interaction.channel.send({embeds: [embed], components: [select]})
		interaction.reply(asEmbed('"Choose Tutors" banner has been succesfully sent to the channel!', true))
		//TODO
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
	return client.channels.cache.filter(channel => channel.parent === category && channel.type === 0).size >= 50;
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

	return {embeds: [embed], ephemeral: isEphemeral};
}
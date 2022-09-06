/*
BUGS:

ClOSED BUGS:
Ticket opener doesn't show up as member of the channel until they send a message (MAYBE OKAY)
Ticket closed says null on channel.delete (REMOVED UNTIL THERE IS TIME TO REPRODUCE)

RECOMMENDATIONS:
Close button should be used by the Students as well?
Do you wanna set the closed ticket public for improving the tutoring service/Closed tickets: all tutors should see

IDEAS: 
merge tickets to be under one channel
Claim/close buttons should be disabled after they were clicked
Claim should change to a Release button if a tutor cannot help
No tutor appeared? change visibility for this ticket only FOLLOW UP, if there is no answer in 5 mins
Add tutor to ticket command
See preferences command
Suggestion vote incorporation based on BotHub

Channel names design
Emojis to channels

REFACTORING!!!
*/

// Require the necessary discord.js classes
const { Client, GatewayIntentBits, ChannelType, PermissionsBitField, InteractionCollector, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SelectMenuBuilder } = require('discord.js');
const { token, openTicketsCategoryName, ongoingTicketsCategoryName, closedTicketsCategoryName, serverBotCategoryName } = require('./config.json');
const fs = require('fs')

const discordTranscripts = require('discord-html-transcripts');
const { config } = require('process');

const userPreferencesPath = './user_preferences.json';
const userPreferences = JSON.parse(fs.readFileSync(userPreferencesPath));

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages] });

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
			//TODO: add error message if there are too many open tickets

			let ticketChannelName = "ticket-" + makeTicketId();

			const openTicketCategory = interaction.guild.channels.cache.find(c => c.name === openTicketsCategoryName);

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

			//Set up permissions and send pings according to preferences
			let hasPreferences = userPreferences[interaction.user.id] && userPreferences[interaction.user.id].tutors.split(', ').length !== 5;
			let preferredTutorIds;
			if (hasPreferences) { 
				preferredTutorIds = userPreferences[interaction.user.id].tutors.split(", ");
				for (let i = 0; i < preferredTutorIds.length; i++) {
					let tutor = await client.users.fetch(preferredTutorIds[i])
					if (preferredTutorIds[i] !== interaction.user.id) { //this avoids the error that tutors include them in their prefs and open a ticket
						ticketChannel.permissionOverwrites.create(tutor.id, { ViewChannel: true });
					}
				}
			} else {
				ticketChannel.permissionOverwrites.create(interaction.guild.roles.cache.find(r => r.name === 'Tutor').id, { ViewChannel: true })
			}
			
			await interaction.reply(asEmbed("Your ticket has been created in <#" + ticketChannel.id + ">!", true));

			//TODO: change message if tutor or tutors are picked
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

			if (interaction.channel.parent === client.channels.cache.find(c => c.name === ongoingTicketsCategoryName)) {
				await interaction.reply(asEmbed("Someone had already claimed this ticket!", true));
				return;
			}

			
			if (interaction.channel.parent === client.channels.cache.find(c => c.name === closedTicketsCategoryName)) {
				await interaction.reply(asEmbed("This ticket is already closed, thus cannot be claimed!", true));
				return;
			}

			//move ticket to ongoing
			let ongoingTicketsCategory = client.channels.cache.find(c => c.name === ongoingTicketsCategoryName)
			interaction.channel.setParent(ongoingTicketsCategory, {lockPermissions: false})
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

			if (interaction.channel.parent === client.channels.cache.find(c => c.name === openTicketsCategoryName)) {
				await interaction.reply(asEmbed("The ticket has to be claimed first!", true));
				return;
			}

			if (interaction.channel.parent === client.channels.cache.find(c => c.name === closedTicketsCategoryName)) {
				await interaction.reply(asEmbed("This ticket is already closed!", true));
				return;
			}

			//If there are too many closed tickets, delete them all
			let closedTicketsCategory = findChannel(client, closedTicketsCategoryName, 4);
			if (isCategoryFull(client, closedTicketsCategory)) {
				deleteChannelsInCategory(client, closedTicketsCategory);
			}

			//move ticket to closed
			interaction.channel.setParent(closedTicketsCategory, {lockPermissions: false});
			//make it read only (and also back to private bc lock permission is being mean with me)
			interaction.channel.permissionOverwrites.create(interaction.channel.guild.roles.everyone, { SendMessages: false, ViewChannel: false });

			//Send ticket closed message and transcipt button
			let embed = new EmbedBuilder()
			.setColor(0x00CED1)
			.setTitle('Ticket has been closed') //TODO: write who closed the ticket
			.setDescription('Hope this helped! If you would like to get a copy of this conversation, press the "Get transcript" button below!')
			.setFooter({ text: "WARNING: Ticket channels will be deleted no later than 24hrs after closing !"})

			let transcript = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('transcript')
						.setLabel('Get transcript')
						.setStyle(ButtonStyle.Primary),
				);

			await interaction.reply({embeds : [embed], components :[transcript]});

			let followUpEmbed = new EmbedBuilder()
			.setColor(0x00CED1)
			.setTitle('Your opinion matters!')
			.setDescription('If you have any remarks about the server, do not hesitate to write to us in the appropritae channels under the ' + serverBotCategoryName + ' category!')
			await interaction.followUp({embeds: followUpEmbed})
		}
		if (interaction.customId === "transcript") {
			//Send DM with transcript
			const attachment = await discordTranscripts.createTranscript(interaction.channel, {fileName: interaction.channel.name + ".html"});

			//TODO: Format private message
			let transcriptEmbed = new EmbedBuilder()
			.setColor(0x00CED1)
			.setTitle("Transcript")
			.setDescription("You can find the transcript of your ticket in HTML format above.")
			.setTimestamp();

			interaction.reply(asEmbed("A transcript of this channel was sent to your DMs!", true));

			interaction.user.send({
				embeds: [transcriptEmbed], files: [attachment]
			});
		}
		if (interaction.customId === "selfrolestudent") {
			//Landing zone's self role button 
			let studentRole = interaction.guild.roles.cache.find(r => r.name === 'Student');
			interaction.member.roles.add(studentRole);

			interaction.reply(asEmbed('You have been given the "Student" role!', true));
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

	//SLASH COMMANDS, mostly for tutors to resend banners
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
						.setLabel('Open a ticket')
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
		.setDescription("By default, all tutors can view your tickets. Below, you can change this!")
		.setFooter({ text: "NOTE: This only applies to your future tickets: it won't change the visibility of your already created ones.\nNOTE: If you have chosen tutors before, but cannot see them below: they are saved."})
	
		//TODO: fill these out with valid values
		const select = new ActionRowBuilder()
				.addComponents(
					new SelectMenuBuilder()
						.setCustomId('selectTutors')
						.setPlaceholder('All the tutors can see your tickets.')
						.setMinValues(1)
						.setMaxValues(5) 
						.addOptions([ 
							{
								label: 'Victor',
								description: 'Languages: Danish, English',
								value: '188226637941309440', 
							},
							{
								label: 'Rasmus',
								description: 'Languages: Danish, English',
								value: '176779465857302528',
							},
							{
								label: 'Tawfik',
								description: 'Languages: English, French',
								value: '885619143691370557',
							},
							{
								label: 'Christian',
								description: 'Languages: English',
								value: '557965521795022906',
							},
							{
								label: 'L. Ádám',
								description: 'Languages: English, Hungarian',
								value: '270592043473043480',
							}
						]),
				);
		await interaction.channel.send({embeds: [embed], components: [select]})
		interaction.reply(asEmbed('"Choose Tutors" banner has been succesfully sent to the channel!', true))
	}

	if (commandName === "selfrolestudentbanner") {
		if (!isTutor(interaction)) {
			await interaction.reply(asEmbed("Insufficient permissions!", true));
			return;
		}

		let embed = new EmbedBuilder()
		.setColor(0x00CED1)
		.setTitle("Welcome!")
		.setDescription('Press the button below to grant yourself the "Student" role to access more channels!')
	
		let selfrolestudent = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('selfrolestudent')
						.setLabel("Let's go!")
						.setStyle(ButtonStyle.Success),
				);
		await interaction.channel.send({embeds: [embed], components: [selfrolestudent]})
		interaction.reply(asEmbed('"Self role Student" banner has been succesfully sent to the channel!', true))
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
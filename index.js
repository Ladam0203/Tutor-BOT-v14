/*
BUGS:

ClOSED BUGS:
Ticket closed says null on channel.delete (REMOVED UNTIL THERE IS TIME TO REPRODUCE)

RECOMMENDATIONS:
Do you wanna set the closed ticket public for improving the tutoring service/Closed tickets: all tutors should see

IDEAS: 
merge tickets to be under one channel
Claim/close buttons should be disabled after they were clicked
Claim should change to a Release button if a tutor cannot help
No tutor appeared? change visibility for this ticket only FOLLOW UP, if there is no answer in 5 mins
Add tutor to ticket command
See preferences command
Suggestion vote incorporation based on BotHub
End of ticket: How we are doing?

Channel names design
Emojis to channels

REFACTORING!!!
*/

// Require the necessary discord.js classes
const { Client, GatewayIntentBits, ChannelType, PermissionsBitField, InteractionCollector, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SelectMenuBuilder, Collection } = require('discord.js');
const { token, openTicketsCategoryName, ongoingTicketsCategoryName, closedTicketsCategoryName, serverBotCategoryName } = require('./config.json');

const discordTranscripts = require('discord-html-transcripts');
const { config } = require('process');

const fs = require('node:fs')
const path = require('node:path')

const userPreferencesPath = './user_preferences.json';
const userPreferences = JSON.parse(fs.readFileSync(userPreferencesPath));

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages] });

client.commands = new Collection();

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}

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
			.setDescription("Hey <@" + interaction.user.id + ">! Here you should elaborate on your question until a tutor arrives to help you!")
		
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
			.setDescription("<@" + interaction.user.id + "> is here to assist you!")
			await interaction.reply({embeds: [embed]});
		}
		if (interaction.customId === "closeTicket")
		{
			/* Removed, due to popular demand. Should be stil safe since the only students that should be able to see the ticket is themselves
			if (!isTutor(interaction))
			{
				await interaction.reply(asEmbed("Insufficient permissions!", true));
				return;
			}
			*/
			if (interaction.channel.parent === client.channels.cache.find(c => c.name === openTicketsCategoryName) && isTutor(interaction)) {
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
			.setTitle('Ticket has been closed!') //TODO: write who closed the ticket
			.setDescription('<@' + interaction.user.id + '> closed the ticket. If you would like to get a copy of this conversation, press the "Get transcript" button below!')
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
			await interaction.followUp({embeds: [followUpEmbed]})
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

	//SLASH COMMANDS
	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
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
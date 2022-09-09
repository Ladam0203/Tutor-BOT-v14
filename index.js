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
const { Client, GatewayIntentBits, ChannelType, PermissionsBitField, InteractionCollector, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SelectMenuBuilder, Collection } = require('discord.js');
const { token, openTicketsCategoryName, ongoingTicketsCategoryName, closedTicketsCategoryName, serverBotCategoryName } = require('./config.json');

const discordTranscripts = require('discord-html-transcripts');

const fs = require('node:fs')
const path = require('node:path')

const userPreferencesPath = './user_preferences.json';
const userPreferences = JSON.parse(fs.readFileSync(userPreferencesPath));

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages] });

//READING
//SLASH COMMANDS
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

//BUTTONS
client.buttons = new Collection();
const buttonsPath = path.join(__dirname, 'buttons');
const buttonFiles = fs.readdirSync(buttonsPath).filter(file => file.endsWith('.js'));

for (const file of buttonFiles) {
	const filePath = path.join(buttonsPath, file);
	const button = require(filePath);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.buttons.set(button.customId, button);
}

//SELECT MENUS
client.selectMenus = new Collection();
const selectMenusPath = path.join(__dirname, 'selectmenus');
const selectMenuFiles = fs.readdirSync(selectMenusPath).filter(file => file.endsWith('.js'));

for (const file of selectMenuFiles) {
	const filePath = path.join(selectMenusPath, file);
	const selectMenu = require(filePath);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.selectMenus.set(selectMenu.customId, selectMenu);
}

// Login to Discord with your client's token
client.login(token);

module.exports = client;

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!');
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand() && !interaction.isButton() && !interaction.isSelectMenu()) return;

	//SLASH COMMANDS
	const command = interaction.client.commands.get(interaction.commandName);

	if (command) {
		try {
			await command.handleCommand(interaction);
		} catch (error) {
			console.error(error);
			await interaction.reply({ content: 'There was an error while handling this slash command!', ephemeral: true });
		}
	}

	//BUTTONS
	const button = interaction.client.buttons.get(interaction.customId);

	if (button)  {
		try {
			await button.handleButton(interaction);
		} catch (error) {
			console.error(error);
			await interaction.reply({ content: 'There was an error while handling this button interaction!', ephemeral: true });
		}
	}

	//SELECT MENUS
	const selectMenu = interaction.client.selectMenus.get(interaction.customId);

	if (selectMenu) {
		try {
			await selectMenu.handleSelectMenu(interaction)
		} catch (error) {
			console.error(error);
			await interaction.reply({ content: 'There was an error while handling this select menu interaction', ephemeral: true });
		}
	}
});

//UTILITY
/*
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
*/

function asEmbed(message, isEphemeral) {
	let embed = new EmbedBuilder()
	.setColor(0x00CED1)
	.setDescription(message)
	.setTimestamp();

	return {embeds: [embed], ephemeral: isEphemeral};
}
const { SlashCommandBuilder, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { clientId, guildId, token } = require('./config.json');

const rest = new REST({ version: '10' }).setToken(token);

//Deleting all commands from guild
rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] })
	.then(() => console.log('Successfully deleted all guild commands.'))
	.catch(console.error);

//Recreating new commands
const commands = [
	new SlashCommandBuilder().setName('ping')
        .setDescription('Replies with pong!'),
	new SlashCommandBuilder().setName('server')
        .setDescription('Replies with server info!'),
    new SlashCommandBuilder().setName('user')
        .setDescription('Replies with user info!'),
    new SlashCommandBuilder().setName('ticket')
        .setDescription('Manage your tickets!')
        .addSubcommand(subcommand =>
            subcommand
            .setName('open')
            .setDescription('Open a ticket')) //TODO: add so a tutor or tutors can be specified
        .addSubcommand(subcommand =>
            subcommand
            .setName('take')
            .setDescription('Marks a ticket as "ongoing" and announces who came to assist'))
        /*.addSubcommand(subcommand =>
            subcommand
            .setName('publish')
            .setDescription('Publish a ticket')*/
]
	.map(command => command.toJSON());

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);
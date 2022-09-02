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
    new SlashCommandBuilder().setName('openticketbanner') //TODO: group these banner commands into subcommands
            .setDescription('Sends the "Open a Ticket" banner into the channel!'),
    new SlashCommandBuilder().setName('selecttutorsbanner')
            .setDescription('Sends the "Select Tutors" banner into the channel!'),
	new SlashCommandBuilder().setName('selfrolestudentbanner')
            .setDescription('Sends the "Self role Student" banner into the channel!')
]
	.map(command => command.toJSON());

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);
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
    new SlashCommandBuilder().setName('ticket')
        .setDescription('Manage your tickets!')
        .addSubcommand(subcommand =>
            subcommand
            .setName('claim')
            .setDescription('Marks an open ticket as ongoing and announces who came to assist.'))
        .addSubcommand(subcommand =>
            subcommand
            .setName('close')
            .setDescription('Closes an ongoing ticket.')),
    new SlashCommandBuilder().setName('ticketopenbanner')
            .setDescription('Send the "Open a Ticket banner into the channel!" ')
]
	.map(command => command.toJSON());

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);
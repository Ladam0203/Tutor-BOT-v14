/*
CHANNEL CHECKING
Can be only done on an open/ongoing ticket... in closed tickets they cannot send a message so we don't have to check. So we have to check if channel name contains ticket only
PARAMTER CHECKING
The idea is that tutors can be added one by one, or all at the same time (5+1 options for the subcommand)
Check if tutor can already see the ticket

ACTIONS
Add permission to Tutor or all Tutors to ViewMessages in channel
Rename ticket-opened-ping to ticket-ping, as it will accomodate the invite messagesa as well
Send message in ticket-ping (if all, then ping everyone, but the ones that had access to the channel prior to that)
*/

const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField} = require('discord.js');
const {asEmbed, isTutor, isFromTicketChannel} = require("../util.js");
const {ticketPingsChannelName} = require("../config.json")
const ticketLogger = require("../ticket-logger.js")

module.exports = {
    data: new SlashCommandBuilder().setName('ticket')
    .setDescription("Manage tickets!")
    .addSubcommand(subcommand => 
        subcommand
        .setName('invite')
        .setDescription("Invite tutors to your ticket!")
        .addStringOption(option =>
            option.setName('tutor')
                .setDescription('The tutor you would like to add, or "all" to invite all tutors')
                .setRequired(true)
                .addChoices(
                    { name: 'Victor',       value: '188226637941309440' },
                    { name: 'Rasmus',       value: '176779465857302528' },
                    { name: 'Tawfik',       value: '885619143691370557' },
                    { name: 'Christian',    value: '557965521795022906' },
                    { name: 'L. Ádám',      value: '270592043473043480' },
                    { name: 'All',          value: '1011593669586976789' }, //value is the id of the Tutor role
                ))),

    async handleCommand(interaction) {
        if (interaction.options.getSubcommand() == "invite")
        {
            //CHEKS
            //Check if this is coming from a ticket channel
            if (!isFromTicketChannel(interaction)) {
                interaction.reply(asEmbed("This command can only be used in a ticket channel!", true))
                return;
            }
            let tutorRole = await interaction.guild.roles.cache.find(r => r.name === 'Tutor');
            //Check if tutor or tutor(s) is already part of the ticket
            if (interaction.channel.permissionsFor(tutorRole).has([PermissionsBitField.Flags.ViewChannel]))
            {
                interaction.reply(asEmbed("The ticket is already visible to all tutors!", true))
                return;
            }
            //https://stackoverflow.com/questions/53249290/how-to-check-channel-permissions
            //ACTIONS

            let id = interaction.options.getString("tutor");
            let ticketPingsChannel = await interaction.guild.channels.cache.find(c => c.name === ticketPingsChannelName);//add ticket pings channel to config, get the string from config in openticket

            if (id === tutorRole.id) { //Tutor ROLE
                //Tutors added, only those should be mentioned, who cannot see the ticket. Would this include administrators?
                let tutors = await interaction.guild.members.fetch()
                    .then(members=>
                        members.filter(member=>member.roles.cache.some(role => role.id === tutorRole.id)));
                //TODO: Please include mods as well somehow pls :C
                let ticketLog = ticketLogger.get(ticketLogger.IdFromChannelName(interaction.channel.name))
                let newTutors = tutors.filter(tutor => !ticketLog.visibleTo.includes(tutor.id));
                /*
                //Old way
                for (let i = 0; i < tutors.size; i++) {
                    let permissions = interaction.channel.permissionsFor(tutors.at(i));
                    console.log(permissions);
                    
                    if (!permissions.has([PermissionsBitField.Flags.ViewChannel])) {
                        newTutors.push(tutors.at(i))
                    }
                }
                */

                //Update log with new visibleTo
            ticketLog.visibleTo = tutorRole.id
            ticketLogger.update(ticketLog);

                //Set the new visibility
                interaction.channel.permissionOverwrites.create(tutorRole, { ViewChannel: true }); //I really hoped that this accepts only id's, nope
                //TODO: Update log

                await ticketPingsChannel.send(
                    asEmbed(newTutors.map(tutor => tutor.toString()).join(', ') + "! " + interaction.user.toString() + " invited you to " + interaction.channel.toString() + "!")
                    );
            }
            else { //Tutor
                let tutor = await interaction.client.users.fetch(id);
                if (interaction.channel.permissionsFor(tutor).has([PermissionsBitField.Flags.ViewChannel]))
                {
                    interaction.reply(asEmbed("The ticket is already visible to " + tutor.toString() + "!", true))
                    return;
                }

                interaction.channel.permissionOverwrites.create(tutor, { ViewChannel: true }); //I really hoped that this accepts only id's, nope
                //Update log
                let ticketLog = ticketLogger.get(ticketLogger.IdFromChannelName(interaction.channel.name))
                ticketLog.visibleTo.push(id)
                ticketLogger.update(ticketLog);
                //1 tutor added, simple invite message
                await ticketPingsChannel.send(asEmbed(tutor.toString() + "! " + interaction.user.toString() + " invited you to " + interaction.channel.toString() + "!"));
            }

            interaction.reply(asEmbed("Succesfully invited to the ticket!", true));
        }
    }
}

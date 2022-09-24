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

const { SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const {asEmbed, isTutor, isFromTicketChannel} = require("../util.js");

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
        //CHEKS
        //Check if this is coming from a ticket channel
        if (!isFromTicketChannel(interaction)) {
            interaction.reply(asEmbed("This command can only be used in a ticket channel!", true))
            return;
        }
        //Check if tutor or tutor(s) is already part of the ticket
        //ACTIONS

        //Main thing: make the tutor(s) be able to see the ticket
        let id = interaction.options.getString("tutor");
        
        let tutorOrTutors;
        if (id != 1011593669586976789) {
            tutorOrTutors = await interaction.client.users.fetch(id);
        }
        else {
            tutorOrTutors = await interaction.guild.roles.cache.find(r => r.id === id);
        }
        
        interaction.channel.permissionOverwrites.create(tutorOrTutors, { ViewChannel: true }); //I really hoped that this accepts only id's, nope
        
        //Send invite message, in a way that the ones are not mentioned that can already see the ticket
    }
}

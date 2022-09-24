const { PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { openTicketsCategoryName, ticketPingsChannelName } = require('../config.json');

const fs = require('node:fs')

const userPreferencesPath = "./user_preferences.json";

const {makeTicketId, asEmbed} = require("../util.js")

module.exports = {
    customId: "openTicket",
    async handleButton(interaction) {
        //has to be re-read each time the comment is executed
        const userPreferences = JSON.parse(fs.readFileSync(userPreferencesPath)); 

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

        let ticketChannel = interaction.client.channels.cache.find(c => c.name === ticketChannelName)

        //Set up permissions and send pings according to preferences
        let hasPreferences = userPreferences[interaction.user.id] && userPreferences[interaction.user.id].tutors.split(', ').length !== 5;
        let preferredTutorIds;
        if (hasPreferences) { 
            preferredTutorIds = userPreferences[interaction.user.id].tutors.split(", ");
            for (let i = 0; i < preferredTutorIds.length; i++) {
                let tutor = await interaction.client.users.fetch(preferredTutorIds[i])
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
        const ticketOpenedPingChannel = interaction.guild.channels.cache.find(c => c.name === ticketPingsChannelName);

        if (hasPreferences) {
            await ticketOpenedPingChannel.send(
                asEmbed(preferredTutorIds.map(id => "<@" + id + ">").join(', ') + "! <@" + interaction.user.id + "> needs assistance in <#" + ticketChannel.id + ">!"), false);
        } else {
            await ticketOpenedPingChannel.send(asEmbed("<@&" + tutorRole.id+ ">s! <@" + interaction.user.id + "> needs assistance in <#" + ticketChannel.id + ">!"), false);
        }
    },
}
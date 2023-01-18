const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SelectMenuBuilder} = require('discord.js');
const {isTutor, asEmbed, findRole} = require("../util.js");
const ticketLogger = require("../ticket-logger.js")


module.exports = {
    data: new SlashCommandBuilder().setName('stats')
    .setDescription('Display statistics about the tickets!'),
        
    async handleCommand(interaction) {
        const ticketLogs = ticketLogger.getAll();
        
        let statsString = "";

        let noOfTickets = Object.keys(ticketLogs).length;
        statsString += "Number of tickets opened: " + noOfTickets + "\n";

        //calculate average time to from openedAt to claimedAt
        let averageTimeToClaimInMs = Object.values(ticketLogs).reduce((acc, ticket) => {
            if (ticket.claimedAt) {
                let timeToClaim = new Date(ticket.claimedAt) - new Date(ticket.openedAt);
                return acc + timeToClaim;
            } else {
                return acc;
            }
        }, 0) / noOfTickets;

        //average time to close
        let averageTimeToClaim = Math.round(averageTimeToClaimInMs / 1000 / 60 / 60 * 100) / 100;
        statsString += "Average time (Open -> Claim): " + averageTimeToClaim + "h\n";

        //calculate average time to from openedAt to claimedAt
        let avgTimeToCloseInMs = Object.values(ticketLogs).reduce((acc, ticket) => {
            if (ticket.closedAt) {
                let timeToClose = new Date(ticket.closedAt) - new Date(ticket.openedAt);
                return acc + timeToClose;
            } else {
                return acc;
            }
        }, 0) / noOfTickets;
        let avgTimeToClose = Math.round(avgTimeToCloseInMs / 1000 / 60 / 60 * 100) / 100;
        statsString += "Average time (Open -> Close): " + avgTimeToClose + "h\n";

        //Most tickets claimed by
        let noOfTicketClaimedPerTutor = Object.values(ticketLogs).reduce((acc, ticket) => {
            if (ticket.claimedBy) {
                if (acc[ticket.claimedBy]) {
                    acc[ticket.claimedBy] += 1;
                } else {
                    acc[ticket.claimedBy] = 1;
                }
            }
            return acc;
        }, {});

        let noOfTicketClaimedPerTutorString = "";
        for (let [key, value] of Object.entries(noOfTicketClaimedPerTutor)) {
            let tutor = await interaction.client.users.fetch(key);
            noOfTicketClaimedPerTutorString += tutor.toString() + ": " + value + "\n";
        }
        statsString += "Most tickets claimed by:\n" + noOfTicketClaimedPerTutorString;

        await interaction.reply(asEmbed(statsString, true));
    },
};
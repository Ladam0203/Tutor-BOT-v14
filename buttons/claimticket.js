const { EmbedBuilder } = require('discord.js');
const { ongoingTicketsCategoryName, closedTicketsCategoryName } = require('../config.json');
const ticketLogger = require("../ticket-logger.js")

const {isTutor, asEmbed} = require("../util.js")

module.exports = {
    customId: "claimTicket",
    async handleButton(interaction) {
        //add error message if there are too many ongoing tickets
		//TODO: turn off claim button/change to release (requires introducing the CRM system)

		//send ping about claimed ticket?

		//check permission (Tutor role)
		if (!isTutor(interaction))
		{
			await interaction.reply(asEmbed("Insufficient permissions!", true));
			return;
		}

		if (interaction.channel.parent === interaction.client.channels.cache.find(c => c.name === ongoingTicketsCategoryName)) {
			await interaction.reply(asEmbed("Someone had already claimed this ticket!", true));
			return;
		}

		
		if (interaction.channel.parent === interaction.client.channels.cache.find(c => c.name === closedTicketsCategoryName)) {
			await interaction.reply(asEmbed("This ticket is already closed, thus cannot be claimed!", true));
			return;
		}

		//move ticket to ongoing
		let ongoingTicketsCategory = interaction.client.channels.cache.find(c => c.name === ongoingTicketsCategoryName)
		interaction.channel.setParent(ongoingTicketsCategory, {lockPermissions: false})
		
		//Update log
		let ticketLog = ticketLogger.get(ticketLogger.IdFromChannelName(interaction.channel.name));
		ticketLog.claimedBy = interaction.user.id;
		ticketLog.claimedAt = new Date();
		ticketLogger.update(ticketLog);

		//announce who came to help
		let embed = new EmbedBuilder()
		.setColor(0x00CED1)
		.setTitle('Ticket has been marked as "ongoing"!')
		.setDescription("<@" + interaction.user.id + "> is here to assist you!")
		await interaction.reply({embeds: [embed]});
    },
}
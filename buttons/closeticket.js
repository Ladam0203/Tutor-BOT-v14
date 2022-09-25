const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const { token, openTicketsCategoryName, closedTicketsCategoryName, serverBotCategoryName } = require('../config.json');
const ticketLogger = require("../ticket-logger.js")

const {isTutor, isCategoryFull, deleteChannelsInCategory, findChannel, asEmbed} = require("../util.js")

module.exports = {
    customId: "closeTicket",
    async handleButton(interaction) {
        /* Removed, due to popular demand. Should be stil safe since the only students that should be able to see the ticket is themselves
		if (!isTutor(interaction))
		{
			await interaction.reply(asEmbed("Insufficient permissions!", true));
			return;
		}
		*/
		if (interaction.channel.parent === interaction.client.channels.cache.find(c => c.name === openTicketsCategoryName) && isTutor(interaction)) {
			await interaction.reply(asEmbed("The ticket has to be claimed first!", true));
			return;
		}

		if (interaction.channel.parent === interaction.client.channels.cache.find(c => c.name === closedTicketsCategoryName)) {
			await interaction.reply(asEmbed("This ticket is already closed!", true));
			return;
		}

		//If there are too many closed tickets, delete them all
		let closedTicketsCategory = findChannel(interaction.client, closedTicketsCategoryName, 4);
		if (isCategoryFull(interaction.client, closedTicketsCategory)) {
			deleteChannelsInCategory(interaction.client, closedTicketsCategory);
		}

		//move ticket to closed
		interaction.channel.setParent(closedTicketsCategory, {lockPermissions: false});
		//make it read only (and also back to private bc lock permission is being mean with me)
		interaction.channel.permissionOverwrites.create(interaction.channel.guild.roles.everyone, { SendMessages: false, ViewChannel: false });

		//Update log
		let ticketLog = ticketLogger.get(ticketLogger.IdFromChannelName(interaction.channel.name));
		ticketLog.closedBy = interaction.user.id;
		ticketLog.closedAt = new Date();
		ticketLogger.update(ticketLog);

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
}
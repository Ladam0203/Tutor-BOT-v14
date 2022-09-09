const { EmbedBuilder } = require('discord.js');
const { ongoingTicketsCategoryName, closedTicketsCategoryName } = require('../config.json');

module.exports = {
    customId: "claimTicket",
    async handleButton(interaction) {
        //add error message if there are too many ongoing tickets

		//send ping about claimed ticket?

		//check permission (Tutor role)
		if (!isTutor(interaction))
		{
			await interaction.reply(asEmbed("Insufficient permissions!", true));
			return;
		}

		if (interaction.channel.parent === client.channels.cache.find(c => c.name === ongoingTicketsCategoryName)) {
			await interaction.reply(asEmbed("Someone had already claimed this ticket!", true));
			return;
		}

		
		if (interaction.channel.parent === client.channels.cache.find(c => c.name === closedTicketsCategoryName)) {
			await interaction.reply(asEmbed("This ticket is already closed, thus cannot be claimed!", true));
			return;
		}

		//move ticket to ongoing
		let ongoingTicketsCategory = client.channels.cache.find(c => c.name === ongoingTicketsCategoryName)
		interaction.channel.setParent(ongoingTicketsCategory, {lockPermissions: false})
		//announce who came to help
		let embed = new EmbedBuilder()
		.setColor(0x00CED1)
		.setTitle('Ticket has been marked as "ongoing"!')
		.setDescription("<@" + interaction.user.id + "> is here to assist you!")
		await interaction.reply({embeds: [embed]});
    },
}

//TODO: Separate into util

function isTutor(interaction) {
	return interaction.member.roles.cache.some(role => role.name === "Tutor");
}

function asEmbed(message, isEphemeral) {
	let embed = new EmbedBuilder()
	.setColor(0x00CED1)
	.setDescription(message)
	.setTimestamp();

	return {embeds: [embed], ephemeral: isEphemeral};
}
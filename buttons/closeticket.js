const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const { token, openTicketsCategoryName, closedTicketsCategoryName, serverBotCategoryName } = require('../config.json');

module.exports = {
    customId: "closeTicket",
    async handleButton(interaction) {
        //to avoid circular reference:
        const client = require("../index.js");
        
        /* Removed, due to popular demand. Should be stil safe since the only students that should be able to see the ticket is themselves
		if (!isTutor(interaction))
		{
			await interaction.reply(asEmbed("Insufficient permissions!", true));
			return;
		}
		*/
		if (interaction.channel.parent === client.channels.cache.find(c => c.name === openTicketsCategoryName) && isTutor(interaction)) {
			await interaction.reply(asEmbed("The ticket has to be claimed first!", true));
			return;
		}

		if (interaction.channel.parent === client.channels.cache.find(c => c.name === closedTicketsCategoryName)) {
			await interaction.reply(asEmbed("This ticket is already closed!", true));
			return;
		}

		//If there are too many closed tickets, delete them all
		let closedTicketsCategory = findChannel(client, closedTicketsCategoryName, 4);
		if (isCategoryFull(client, closedTicketsCategory)) {
			deleteChannelsInCategory(client, closedTicketsCategory);
		}

		//move ticket to closed
		interaction.channel.setParent(closedTicketsCategory, {lockPermissions: false});
		//make it read only (and also back to private bc lock permission is being mean with me)
		interaction.channel.permissionOverwrites.create(interaction.channel.guild.roles.everyone, { SendMessages: false, ViewChannel: false });

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

//TODO: Separate into util

function isTutor(interaction) {
	return interaction.member.roles.cache.some(role => role.name === "Tutor");
}

function isCategoryFull(client, category) {
	return client.channels.cache.filter(channel => channel.parent === category && channel.type === 0).size >= 50;
}

function deleteChannelsInCategory(client, category) {
	client.channels.cache.filter(channel => channel.parent === category && channel.type === 0).forEach(
		channel => channel.delete());
}

function findChannel(client, channelName, type) {
	return client.channels.cache.find(channel => channel.name === channelName && channel.type === type);
}

function asEmbed(message, isEphemeral) {
	let embed = new EmbedBuilder()
	.setColor(0x00CED1)
	.setDescription(message)
	.setTimestamp();

	return {embeds: [embed], ephemeral: isEphemeral};
}
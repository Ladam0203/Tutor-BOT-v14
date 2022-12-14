const { EmbedBuilder} = require('discord.js');

const discordTranscripts = require('discord-html-transcripts');

const {asEmbed} = require("../util.js")

module.exports = {
    customId: "transcript",
    async handleButton(interaction) {
        //Send DM with transcript
		const attachment = await discordTranscripts.createTranscript(interaction.channel, {fileName: interaction.channel.name + ".html"});

		//TODO: Format private message
		let transcriptEmbed = new EmbedBuilder()
		.setColor(0x00CED1)
		.setTitle("Transcript")
		.setDescription("You can find the transcript of your ticket in HTML format above.")
		.setTimestamp();

		interaction.reply(asEmbed("A transcript of this channel was sent to your DMs!", true));

		interaction.user.send({
			embeds: [transcriptEmbed], files: [attachment]
		});
    }
}
//TODO:
//limit to suggestions channel
//send as an embed
//pin suggestion
//add upvote and downvote by default
//only allow the up and downvote emojis

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SelectMenuBuilder} = require('discord.js');
const { suggestionsChannelName } = require('../config.json');
const {asEmbed} = require("../util.js");

module.exports = {
    data: new SlashCommandBuilder().setName('suggest')
    .setDescription("Suggest a feature for voting!")
    .addStringOption(option => 
        option.setName('suggestion')
        .setDescription("Your suggestion.")
        .setRequired(true)),

    async handleCommand(interaction) {

        let suggestionsChannel = interaction.client.channels.cache.find(c => c.name === suggestionsChannelName);
        if (interaction.channel !== suggestionsChannel) {
			await interaction.reply(asEmbed(`You can only make suggestions in the ${suggestionsChannel} !`, true));
			return;
		}

        let embed = new EmbedBuilder()
            .setColor(0x00CED1)
            .setTitle(`${interaction.user}'s suggestion:`)
            .setDescription(interaction.options.getString("suggestion"))

        let msg = interaction.channel.send({embeds: [embed]})
        msg.react('👍').then(() => msg.react('👎'));
        msg.pin();

        /*
        //only allow the up and downvote emojis
        //collector az emojikhoz???

        const filter = (reaction, user) => {
            return ['👍', '👎'].includes(reaction.emoji.name) && user.id === interaction.user.id;
        };
        
        message.awaitReactions({ filter, max: 1, time: 60000, errors: ['time'] })
            .then(collected => {
                const reaction = collected.first();
        
                if (reaction.emoji.name === '👍') {
                    message.reply('You reacted with a thumbs up.');
                } else {
                    message.reply('You reacted with a thumbs down.');
                }
            })
            .catch(collected => {
                message.reply('You reacted with neither a thumbs up, nor a thumbs down.');
            });
        */

        interaction.reply(asEmbed("Thank you for your suggestion!", true))
    }
}

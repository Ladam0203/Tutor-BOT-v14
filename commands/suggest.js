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
            .setTitle(`Suggestion:`)
            .setDescription(`${interaction.user}: ` + interaction.options.getString("suggestion"))
            //TODO: Include time until closing the vote

        let msg = await interaction.channel.send({embeds: [embed]})
        await msg.react('👍').then(() => msg.react('👎'));
        await msg.pin();

        /*
        //TODO Probs all the emojis should be listened for, so the wrong ones can be removed
        const filter = (reaction, user) => {
            return ['👍', '👎'].includes(reaction.emoji.name);
        };        
        const collector = msg.createReactionCollector({ filter, time: 15000 });

        collector.on('collect', m => {
            //TODO: remove non 👍/👎 emois
            console.log(`Collected ${m.content}`);
        });

        collector.on('end', collected => {
            //Write vote finished, count the result and write foreseable action, tag me also! Introduce a command for announcing the action taken using the message's id! Also unpin the message
        });
        */

        interaction.reply(asEmbed("Thank you for your suggestion!", true))
    }
}

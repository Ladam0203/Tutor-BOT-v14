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

        let message = await interaction.channel.send({embeds: [embed]})
        await message.react('✅').then(() => message.react('❌'));
        await message.pin();

        /*
        //TODO: Probs all the emojis should be listened for, so the wrong ones can be removed
        const filter = (reaction) => {
            return ['✅', '❌'].includes(reaction.emoji.name)
        };
        
        //3 days time: 259200000
        const collector = message.createReactionCollector({ filter, time: 259200000});
        
        collector.on('collect', (reaction, user) => {
            //TODO: Wrong emois should be removed... removing custom emojis is throwing an exceoption tho...
        });

        collector.on('end', collected => {
            //Write vote finished, count the result and write foreseable action, tag me also! Introduce a command for announcing the action taken using the message's id! Also unpin the message
            
            //Tbh all this will be probs skipped with a separate /action MessageId commmand that will unpin the said vote - signalling it's end
        });
        */

        interaction.reply(asEmbed("Thank you for your suggestion!", true))
    }
}

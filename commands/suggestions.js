//TODO:
//limit to suggestions channel
//send as an embed
//pin suggestion
//add upvote and downvote by default
//only allow the up and downvote emojis

const { SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const { suggestionsChannelName } = require('../config.json');
const {asEmbed, isTutor} = require("../util.js");

module.exports = {
    data: new SlashCommandBuilder().setName('suggestions')
    .setDescription("Manage suggestions!")
    .addSubcommand(subcommand => 
        subcommand
        .setName('add')
        .setDescription("Suggest and idea!")
        .addStringOption(option => 
            option.setName('suggestion')
            .setDescription("Your suggestion.")
            .setRequired(true)))
    .addSubcommand(subcommand => 
        subcommand
        .setName("close")
        .setDescription("Close a suggestion!")
        .addStringOption(option => 
            option.setName('messageid')
            .setDescription("The suggestion to close. (Message ID)")
            .setRequired(true))
        .addStringOption(option => 
            option.setName('action')
            .setDescription("What will be done with the suggested idea.")
            .setRequired(true)))
    ,

    async handleCommand(interaction) {

        if (interaction.options.getSubcommand() === 'add')
        {
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

        if (interaction.options.getSubcommand() === 'close') {

            if (!isTutor(interaction)) {
                await interaction.reply(asEmbed('Insufficient permissions!', true));
                return;
            }
            let suggestionsChannel = interaction.client.channels.cache.find(c => c.name === suggestionsChannelName);
            if (interaction.channel !== suggestionsChannel) {
                await interaction.reply(asEmbed(`You can only close a suggestion in the ${suggestionsChannel} !`, true));
                return;
            }

            //TODO: Check if message is pinned: if it is not, that means that the vote is already closed
            //TODO: Check if message is actually a vote: maybe check embed?
            //TODO: Check if message exists with the id

            let message = await interaction.channel.messages.fetch(interaction.options.getString("messageid"));

            /*
            let pinnedMessages = await interaction.channel.messages.fetchPinned();
            if (!pinnedMessages.some(message)) {
                await interaction.reply(asEmbed(`This suggestion is already closed!`, true));
                return;
            }
            */

            message.unpin();

            //TODO: Include original suggestion, maybe result of the vote
            let embed = new EmbedBuilder()
            .setColor(0x00CED1)
            .setTitle(`Vote ended!`)
            .setDescription(`${interaction.user}: ` + interaction.options.getString("action"))

            message.reply({embeds: [embed]});

            interaction.reply(asEmbed("Suggestion closed succesfully!", true));
        }
    }
}

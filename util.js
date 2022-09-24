const { EmbedBuilder } = require('discord.js');

module.exports = {
    makeTicketId() {
        var length = 5;
        var result           = '';
        var characters       = 'abcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
          result += characters.charAt(Math.floor(Math.random() * 
     charactersLength));
       }
       return result;
    },
    
    isCategoryFull(client, category) {
        return client.channels.cache.filter(channel => channel.parent === category && channel.type === 0).size >= 50; //CHANGE 1 to 50 AFTER TEST
    },
    
    deleteChannelsInCategory(client, category) {
        client.channels.cache.filter(channel => channel.parent === category && channel.type === 0).forEach(
            channel => channel.delete());
    },
    
    findChannel(client, channelName, type) {
        return client.channels.cache.find(channel => channel.name === channelName && channel.type === type);
    },

    findRole(interaction, roleName) {
        return interaction.guild.roles.cache.find(r => r.name === roleName);
    },
    
    asEmbed(message, isEphemeral) {
        let embed = new EmbedBuilder()
        .setColor(0x00CED1)
        .setDescription(message)
        .setTimestamp();
    
        return {embeds: [embed], ephemeral: isEphemeral};
    },

    isTutor(interaction) {
        return interaction.member.roles.cache.some(role => role.name === "Tutor");
    },

    isFromTicketChannel(interaction) {
        return interaction.channel.name.match("^ticket-[a-z0-9]{5}$")
    }
}
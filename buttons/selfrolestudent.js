const { EmbedBuilder} = require('discord.js');

module.exports = {
    customId: "selfrolestudent",
    async handleButton(interaction) {
		//Landing zone's self role button 
		let studentRole = interaction.guild.roles.cache.find(r => r.name === 'Student');
		interaction.member.roles.add(studentRole);

		interaction.reply(asEmbed('You have been given the "Student" role!', true));
    }
}


function asEmbed(message, isEphemeral) {
	let embed = new EmbedBuilder()
	.setColor(0x00CED1)
	.setDescription(message)
	.setTimestamp();

	return {embeds: [embed], ephemeral: isEphemeral};
}
const {asEmbed} = require("../util.js")

module.exports = {
    customId: "selfrolestudent",
    async handleButton(interaction) {
		//Landing zone's self role button 
		let studentRole = interaction.guild.roles.cache.find(r => r.name === 'Student');
		interaction.member.roles.add(studentRole);

		interaction.reply(asEmbed(`You have been given the ${studentRole} role!`, true));
    }
}
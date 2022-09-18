const {asEmbed, findRole} = require("../util.js")

module.exports = {
    customId: "selfrolestudent",
    async handleButton(interaction) {
		//Landing zone's self role button 
		let studentRole = findRole(interaction, "Student");
		interaction.member.roles.add(studentRole);

		interaction.reply(asEmbed(`You have been given the ${studentRole} role!`, true));
    }
}
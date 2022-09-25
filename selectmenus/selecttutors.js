const fs = require('node:fs')

const userPreferencesPath = "./user_preferences.json";

const {asEmbed} = require("../util.js")

module.exports = {
    customId: "selectTutors",
    async handleSelectMenu(interaction) {
        const userPreferences = JSON.parse(fs.readFileSync(userPreferencesPath));
        userPreferences[interaction.user.id] = {tutors: interaction.values.join(', ')}; //if not, create it
        fs.writeFileSync(userPreferencesPath, JSON.stringify(userPreferences, null, 2));
        await interaction.reply(asEmbed("Preferences saved!", true)); //TODO: actually list the tutors chosen
    }
}
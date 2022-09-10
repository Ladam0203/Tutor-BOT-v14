const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SelectMenuBuilder} = require('discord.js');
const {isTutor, asEmbed} = require("../util.js");

module.exports = {
    data: new SlashCommandBuilder().setName('banner') //TODO: group these banner commands into subcommands
    .setDescription('Send a banner into the channel!')
    .addSubcommand(subcommand => 
        subcommand
        .setName('openticket')
        .setDescription('Sends the "Open a Ticket" banner into the channel!'))
    .addSubcommand(subcommand => 
        subcommand
        .setName('selecttutors')
        .setDescription('Sends the "Select Tutors" banner into the channel!'))
    .addSubcommand(subcommand => 
        subcommand
        .setName('selfrolestudent')
        .setDescription('Sends the "Self role Student" banner into the channel!')),
        
    async handleCommand(interaction) {
        if (interaction.options.getSubcommand() === 'openticket') {
            if (!isTutor(interaction)) {
                await interaction.reply(asEmbed("Insufficient permissions!", true));
                return;
            }
    
            let embed = new EmbedBuilder()
            .setColor(0x00CED1)
            .setTitle("Need help?")
            .setDescription("Press the button below to open a ticket!")
            .setFooter({ text: "Don't worry, only you and the chosen tutors can see your ticket!"})
        
            const open = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('openTicket')
                            .setLabel('Open a ticket')
                            .setStyle(ButtonStyle.Primary),
                    );
            await interaction.channel.send({embeds: [embed], components: [open]})
            interaction.reply(asEmbed('"Open a Ticket" banner has been succesfully sent to the channel!', true))
        }
    
        if (interaction.options.getSubcommand() === "selecttutors")
        {
            if (!isTutor(interaction)) {
                await interaction.reply(asEmbed("Insufficient permissions!", true));
                return;
            }
    
            let embed = new EmbedBuilder()
            .setColor(0x00CED1)
            .setTitle("Who do you prefer?")
            .setDescription("By default, all tutors can view your tickets. Below, you can change this!")
            .setFooter({ text: "NOTE: This only applies to your future tickets: it won't change the visibility of your already created ones.\nNOTE: If you have chosen tutors before, but cannot see them below: they are saved."})
        
            //TODO: fill these out with valid values
            const select = new ActionRowBuilder()
                    .addComponents(
                        new SelectMenuBuilder()
                            .setCustomId('selectTutors')
                            .setPlaceholder('All the tutors can see your tickets.')
                            .setMinValues(1)
                            .setMaxValues(5) 
                            .addOptions([ 
                                {
                                    label: 'Victor',
                                    description: 'Languages: Danish, English',
                                    value: '188226637941309440', 
                                },
                                {
                                    label: 'Rasmus',
                                    description: 'Languages: Danish, English',
                                    value: '176779465857302528',
                                },
                                {
                                    label: 'Tawfik',
                                    description: 'Languages: English, French',
                                    value: '885619143691370557',
                                },
                                {
                                    label: 'Christian',
                                    description: 'Languages: English',
                                    value: '557965521795022906',
                                },
                                {
                                    label: 'L. Ádám',
                                    description: 'Languages: English, Hungarian',
                                    value: '270592043473043480',
                                }
                            ]),
                    );
            await interaction.channel.send({embeds: [embed], components: [select]})
            interaction.reply(asEmbed('"Select Tutors" banner has been succesfully sent to the channel!', true))
        }
    
        if (interaction.options.getSubcommand() === "selfrolestudent") {
            if (!isTutor(interaction)) {
                await interaction.reply(asEmbed("Insufficient permissions!", true));
                return;
            }
    
            let embed = new EmbedBuilder()
            .setColor(0x00CED1)
            .setTitle("Welcome!")
            .setDescription('Press the button below to grant yourself the "Student" role to access more channels!')
        
            let selfrolestudent = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('selfrolestudent')
                            .setLabel("Let's go!")
                            .setStyle(ButtonStyle.Success),
                    );
            await interaction.channel.send({embeds: [embed], components: [selfrolestudent]})
            interaction.reply(asEmbed('"Self-role Student" banner has been succesfully sent to the channel!', true))
        }
    },
};

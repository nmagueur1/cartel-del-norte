const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../utils/config');
const { hasAccess, denyAccess } = require('../../utils/permissions');
const { initVote } = require('../../utils/votes');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vote')
    .setDescription('🗳️ Lance un vote avec boutons Oui / Non / Abstention')
    .addStringOption((o) =>
      o.setName('question').setDescription('Question à soumettre au vote').setRequired(true)
    )
    .addStringOption((o) =>
      o.setName('description').setDescription('Contexte / description (optionnel)').setRequired(false)
    ),

  async execute(interaction) {
    if (!hasAccess(interaction.member)) return denyAccess(interaction);

    const question    = interaction.options.getString('question');
    const description = interaction.options.getString('description');
    const voteId      = Date.now().toString();

    const baseDescription =
      (description ? `${description}\n\n` : '') +
      '> Clique sur un bouton pour voter. Tu peux changer ton vote à tout moment.\n\n';

    const embed = new EmbedBuilder()
      .setColor(config.colors.info)
      .setTitle(`🗳️ ${question}`)
      .setDescription(
        baseDescription +
        '**✅ Oui :** `0`\n' +
        '**❌ Non :** `0`\n' +
        '**🤷 Abstention :** `0`'
      )
      .setImage(config.bannerUrl)
      .setFooter({ text: `Vote lancé par ${interaction.user.tag} • ${config.footerText}` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`vote_yes_${voteId}`)
        .setLabel('Oui')
        .setEmoji('✅')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`vote_no_${voteId}`)
        .setLabel('Non')
        .setEmoji('❌')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`vote_abstain_${voteId}`)
        .setLabel('Abstention')
        .setEmoji('🤷')
        .setStyle(ButtonStyle.Secondary),
    );

    const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    initVote(voteId, question, baseDescription, msg.id, interaction.channel.id);
  },
};

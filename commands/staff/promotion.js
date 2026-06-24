const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../utils/config');
const { sendLog } = require('../../utils/logger');
const { isAdmin, denyAccess } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('promotion')
    .setDescription('⭐ Promeut un membre à un nouveau grade')
    .addUserOption((o) =>
      o.setName('membre').setDescription('Membre à promouvoir').setRequired(true)
    )
    .addStringOption((o) =>
      o.setName('grade').setDescription('Nouveau grade').setRequired(true)
    )
    .addStringOption((o) =>
      o.setName('ancien-grade').setDescription('Ancien grade (optionnel)').setRequired(false)
    )
    .addStringOption((o) =>
      o.setName('raison').setDescription('Raison de la promotion').setRequired(false)
    ),

  async execute(interaction, client) {
    if (!isAdmin(interaction.member)) return denyAccess(interaction);

    const target     = interaction.options.getMember('membre');
    const grade      = interaction.options.getString('grade');
    const ancienGrade = interaction.options.getString('ancien-grade');
    const raison     = interaction.options.getString('raison') || 'Aucune raison précisée';

    if (!target) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
    if (target.user.bot) return interaction.reply({ content: '❌ Tu ne peux pas promouvoir un bot.', ephemeral: true });

    // ── DM au membre ───────────────────────────
    const dmFields = [];
    if (ancienGrade) dmFields.push({ name: '📋 Ancien grade', value: ancienGrade, inline: true });
    dmFields.push({ name: '🏅 Nouveau grade', value: grade, inline: true });
    dmFields.push({ name: '📝 Raison', value: raison, inline: false });

    const dmEmbed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('⭐ Félicitations — Promotion !')
      .setDescription(
        `Tu viens d'être promu au grade **${grade}** au sein de **Del Norte - Famille Kyee**.\n\n` +
        `Continue sur cette lancée. 💪`
      )
      .addFields(...dmFields)
      .setImage(config.bannerUrl)
      .setFooter({ text: config.footerText })
      .setTimestamp();

    let dmOk = true;
    await target.user.send({ embeds: [dmEmbed] }).catch(() => { dmOk = false; });

    // ── Réponse au staff ───────────────────────
    const replyFields = [
      { name: '👤 Membre',     value: `<@${target.id}>`, inline: true },
      { name: '🏅 Nouveau grade', value: grade,           inline: true },
    ];
    if (ancienGrade) replyFields.push({ name: '📋 Ancien grade', value: ancienGrade, inline: true });
    replyFields.push({ name: '📝 Raison',    value: raison,              inline: false });
    replyFields.push({ name: '📩 DM envoyé', value: dmOk ? '✅ Oui' : '❌ Non (MP fermés)', inline: true });

    const replyEmbed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('⭐ Promotion effectuée')
      .addFields(...replyFields)
      .setImage(config.bannerUrl)
      .setFooter({ text: config.footerText })
      .setTimestamp();

    await interaction.reply({ embeds: [replyEmbed], ephemeral: true });

    await sendLog(client, {
      action: 'Promotion',
      user:   interaction.user,
      target: target.user,
      details: `Grade : ${ancienGrade ? `${ancienGrade} → ` : ''}${grade} | Raison : ${raison}`,
      color: config.colors.primary,
    });
  },
};

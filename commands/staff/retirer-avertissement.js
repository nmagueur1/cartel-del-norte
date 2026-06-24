const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../utils/config');
const { sendLog } = require('../../utils/logger');
const { isAdmin, denyAccess } = require('../../utils/permissions');
const {
  getRoleIdForLevel,
  hasWarnRole,
  removeWarnByLevel,
} = require('../../utils/avertissements');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('retirer-avertissement')
    .setDescription('✅ Retire un avertissement d\'un membre')
    .addUserOption((o) =>
      o.setName('membre').setDescription('Membre concerné').setRequired(true)
    )
    .addIntegerOption((o) =>
      o.setName('niveau')
        .setDescription('Niveau d\'avertissement à retirer')
        .setRequired(true)
        .addChoices(
          { name: 'Avertissement 1', value: 1 },
          { name: 'Avertissement 2', value: 2 },
          { name: 'Avertissement 3', value: 3 },
        )
    )
    .addStringOption((o) =>
      o.setName('raison').setDescription('Raison du retrait (optionnel)').setRequired(false)
    ),

  async execute(interaction, client) {
    if (!isAdmin(interaction.member)) return denyAccess(interaction);

    const target = interaction.options.getMember('membre');
    const niveau = interaction.options.getInteger('niveau');
    const raison = interaction.options.getString('raison') || 'Aucune raison précisée';

    if (!target) {
      return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
    }

    const roleId = getRoleIdForLevel(niveau);
    if (!roleId) {
      return interaction.reply({ content: '❌ Niveau invalide.', ephemeral: true });
    }

    if (!hasWarnRole(target, niveau)) {
      return interaction.reply({
        content: `❌ **${target.user.tag}** ne possède pas l'**Avertissement ${niveau}**.`,
        ephemeral: true,
      });
    }

    try {
      // ── Retrait du rôle ──────────────────
      await target.roles.remove(roleId, `Retrait avert ${niveau} par ${interaction.user.tag} — ${raison}`);

      // ── Mise à jour de l'historique JSON ─
      const removedWarn = removeWarnByLevel(target.id, niveau);

      // ── DM au membre (silencieux si fermé)
      const dmEmbed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle(`✅ Avertissement ${niveau} retiré`)
        .setDescription(
          `Ton **Avertissement ${niveau}** sur **Del Norte - Famille Kyee** vient d'être retiré.\n\n` +
          `**Raison :** ${raison}`
        )
        .setImage(config.bannerUrl)
        .setFooter({ text: config.footerText })
        .setTimestamp();

      await target.user.send({ embeds: [dmEmbed] }).catch(() => {});

      // ── Réponse au mod ───────────────────
      const replyEmbed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle(`✅ Avertissement ${niveau} retiré`)
        .addFields(
          { name: '👤 Membre', value: `<@${target.id}>`, inline: true },
          { name: '🎚️ Niveau', value: `Avertissement ${niveau}`, inline: true },
          { name: '👮 Retiré par', value: `<@${interaction.user.id}>`, inline: true },
          { name: '📝 Raison', value: raison, inline: false },
        )
        .setImage(config.bannerUrl)
        .setFooter({ text: config.footerText })
        .setTimestamp();

      if (removedWarn) {
        const dateOriginale = new Date(removedWarn.date || removedWarn.id).toLocaleString('fr-FR');
        replyEmbed.addFields({
          name: '🗂️ Avertissement original',
          value: `Donné le ${dateOriginale} — Raison : ${removedWarn.raison || '—'}`,
          inline: false,
        });
      }

      await interaction.reply({ embeds: [replyEmbed], ephemeral: true });

      // ── Log ──────────────────────────────
      await sendLog(client, {
        action: `Avertissement ${niveau} retiré`,
        user: interaction.user,
        target: target.user,
        details: `Raison du retrait : ${raison}`,
        color: config.colors.success,
      });
    } catch (err) {
      await interaction.reply({ content: `❌ Erreur : ${err.message}`, ephemeral: true });
    }
  },
};

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../utils/config');
const { isAdmin, denyAccess } = require('../../utils/permissions');
const { getMemberWarns, hasWarnRole } = require('../../utils/avertissements');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avertissements')
    .setDescription('📋 Consulte l\'historique des avertissements d\'un membre')
    .addUserOption((o) =>
      o.setName('membre').setDescription('Membre à consulter').setRequired(true)
    ),

  async execute(interaction, client) {
    if (!isAdmin(interaction.member)) return denyAccess(interaction);

    const target = interaction.options.getMember('membre');
    if (!target) {
      return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
    }

    // ── Rôles actifs ───────────────────────
    const actifs = [1, 2, 3].filter((n) => hasWarnRole(target, n));
    const actifsLine = actifs.length
      ? actifs.map((n) => `\`Avert ${n}\``).join(' • ')
      : '*Aucun rôle d\'avertissement actif*';

    // ── Historique ─────────────────────────
    const historique = getMemberWarns(target.id).sort((a, b) => b.id - a.id);

    const embed = new EmbedBuilder()
      .setColor(actifs.length ? config.colors.warning : config.colors.success)
      .setTitle(`📋 Avertissements — ${target.user.tag}`)
      .setThumbnail(target.user.displayAvatarURL())
      .addFields(
        { name: '👤 Membre',          value: `<@${target.id}>`,             inline: true },
        { name: '🎚️ Niveaux actifs',   value: actifsLine,                    inline: true },
        { name: '📊 Total historique', value: `\`${historique.length}\``,    inline: true },
      )
      .setImage(config.bannerUrl)
      .setFooter({ text: config.footerText })
      .setTimestamp();

    if (historique.length === 0) {
      embed.setDescription('Ce membre n\'a **aucun avertissement** enregistré dans l\'historique. ✅');
    } else {
      // Limite à 10 entrées pour rester lisible (limite Discord 1024 char/field)
      const lines = historique.slice(0, 10).map((w) => {
        const date = new Date(w.date || w.id).toLocaleString('fr-FR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        });
        const raisonShort = (w.raison || '—').length > 80
          ? (w.raison || '').slice(0, 77) + '...'
          : (w.raison || '—');
        return `**Avert ${w.niveau}** — \`${date}\`\n› ${raisonShort}\n› Par <@${w.modId}>`;
      });

      embed.addFields({
        name: '🗂️ Historique (10 plus récents)',
        value: lines.join('\n\n').slice(0, 1024),
        inline: false,
      });

      if (historique.length > 10) {
        embed.addFields({
          name: '➕',
          value: `*${historique.length - 10} avertissement(s) plus ancien(s) non affiché(s).*`,
          inline: false,
        });
      }
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

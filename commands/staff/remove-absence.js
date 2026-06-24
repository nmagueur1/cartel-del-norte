const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');
const { isAdmin, denyAccess }            = require('../../utils/permissions');
const { sendLog }                        = require('../../utils/logger');
const config                             = require('../../utils/config');
const { getAbsencesData, saveAbsencesData, updatePanel } = require('../../utils/absences');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove-absence')
    .setDescription('🗑️ Supprimer une absence déclarée (Staff uniquement)'),

  async execute(interaction, client) {
    if (!isAdmin(interaction.member)) return denyAccess(interaction);

    const data = getAbsencesData();

    if (!data.absences || data.absences.length === 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(config.colors.info)
            .setTitle('📋 Aucune absence')
            .setDescription('Il n\'y a aucune absence déclarée à supprimer.')
            .setImage(config.bannerUrl)
            .setFooter({ text: config.footerText }),
        ],
        ephemeral: true,
      });
    }

    // Construire le menu de sélection
    const options = data.absences.map((a) => ({
      label: `${a.prenom} ${a.nom}`,
      description: `🛫 ${a.depart}  →  🛬 ${a.retour}`,
      value: String(a.id),
    }));

    const select = new StringSelectMenuBuilder()
      .setCustomId('remove_absence_select')
      .setPlaceholder('Choisir une absence à supprimer...')
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(select);

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(config.colors.danger)
          .setTitle('🗑️ Supprimer une Absence')
          .setDescription('Sélectionne l\'absence à retirer de la liste ci-dessous.\nCette action est **irréversible**.')
          .setImage(config.bannerUrl)
          .setFooter({ text: config.footerText }),
      ],
      components: [row],
      ephemeral: true,
    });
  },
};

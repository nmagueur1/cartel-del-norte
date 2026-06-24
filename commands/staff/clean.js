const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../utils/config');
const { sendLog } = require('../../utils/logger');
const { isAdmin, denyAccess } = require('../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clean')
    .setDescription('🧹 Supprime un nombre défini de messages dans le salon')
    .addIntegerOption((o) =>
      o
        .setName('nombre')
        .setDescription('Nombre de messages à supprimer (entre 1 et 100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    ),

  async execute(interaction, client) {
    if (!isAdmin(interaction.member)) return denyAccess(interaction);

    const nombre = interaction.options.getInteger('nombre');

    try {
      // Réponse différée éphémère pour éviter les soucis pendant la suppression
      await interaction.deferReply({ ephemeral: true });

      // bulkDelete ne supprime pas les messages > 14 jours (filter: true)
      const deleted = await interaction.channel.bulkDelete(nombre, true);

      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle('🧹 Salon nettoyé')
        .addFields(
          { name: '📨 Messages supprimés', value: `${deleted.size}`, inline: true },
          { name: '📍 Salon', value: `${interaction.channel}`, inline: true },
          { name: '👮 Modérateur', value: `<@${interaction.user.id}>`, inline: true },
        )
        .setImage(config.bannerUrl)
        .setFooter({ text: config.footerText })
        .setTimestamp();

      if (deleted.size < nombre) {
        embed.addFields({
          name: '⚠️ Note',
          value: `Seuls **${deleted.size}** messages ont pu être supprimés (les messages de plus de 14 jours ne peuvent pas être effacés en masse).`,
          inline: false,
        });
      }

      await interaction.editReply({ embeds: [embed] });

      await sendLog(client, {
        action: 'Clean',
        user: interaction.user,
        details: `${deleted.size} message(s) supprimé(s) dans <#${interaction.channel.id}> (demandé : ${nombre})`,
        color: config.colors.success,
      });
    } catch (err) {
      const errMsg = `❌ Erreur : ${err.message}`;
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: errMsg, embeds: [] });
      } else {
        await interaction.reply({ content: errMsg, ephemeral: true });
      }
    }
  },
};

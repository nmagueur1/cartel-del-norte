const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require('discord.js');
const { isAdmin, denyAccess } = require('../../utils/permissions');
const { getRoleIdForLevel, hasWarnRole } = require('../../utils/avertissements');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avertissement')
    .setDescription('⚠️ Donne un avertissement à un membre (ouvre un modal pour la raison)')
    .addUserOption((o) =>
      o.setName('membre').setDescription('Membre à avertir').setRequired(true)
    )
    .addIntegerOption((o) =>
      o.setName('niveau')
        .setDescription("Niveau d'avertissement à appliquer")
        .setRequired(true)
        .addChoices(
          { name: 'Avertissement 1', value: 1 },
          { name: 'Avertissement 2', value: 2 },
          { name: 'Avertissement 3', value: 3 },
        )
    ),

  async execute(interaction, client) {
    if (!isAdmin(interaction.member)) return denyAccess(interaction);

    const target = interaction.options.getMember('membre');
    const niveau = interaction.options.getInteger('niveau');

    if (!target) {
      return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
    }

    if (target.user.bot) {
      return interaction.reply({ content: '❌ Tu ne peux pas avertir un bot.', ephemeral: true });
    }

    if (target.id === interaction.user.id) {
      return interaction.reply({ content: '❌ Tu ne peux pas t\'avertir toi-même.', ephemeral: true });
    }

    const roleId = getRoleIdForLevel(niveau);
    if (!roleId) {
      return interaction.reply({ content: '❌ Niveau d\'avertissement invalide.', ephemeral: true });
    }

    if (hasWarnRole(target, niveau)) {
      return interaction.reply({
        content: `⚠️ **${target.user.tag}** possède déjà l'**Avertissement ${niveau}**.`,
        ephemeral: true,
      });
    }

    // ── Construction du modal ──────────────
    // customId encode : modal_avertissement | userId | niveau
    const modal = new ModalBuilder()
      .setCustomId(`modal_avertissement|${target.id}|${niveau}`)
      .setTitle(`⚠️ Avertissement ${niveau} — ${target.user.username}`.slice(0, 45));

    const raisonInput = new TextInputBuilder()
      .setCustomId('avert_raison')
      .setLabel('Raison de l\'avertissement')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Ex : non-respect du règlement, spam, comportement inapproprié...')
      .setMinLength(3)
      .setMaxLength(500)
      .setRequired(true);

    const preuvesInput = new TextInputBuilder()
      .setCustomId('avert_preuves')
      .setLabel('Preuves / contexte (optionnel)')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Lien vers un message, capture, contexte supplémentaire...')
      .setMaxLength(500)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(raisonInput),
      new ActionRowBuilder().addComponents(preuvesInput),
    );

    await interaction.showModal(modal);
  },
};

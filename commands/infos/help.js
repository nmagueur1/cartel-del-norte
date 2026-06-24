const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../utils/config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('📚 Affiche toutes les commandes disponibles'),

  async execute(interaction) {
    const header = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('📚 Commandes disponibles')
      .setDescription('Voici toutes les commandes du bot, classées par catégorie.')
      .setImage(config.bannerUrl)
      .setFooter({ text: config.footerText })
      .setTimestamp();

    const infos = new EmbedBuilder()
      .setColor(config.colors.info)
      .setTitle('📖  INFOS')
      .setDescription(
        '`/embed` → Crée un embed personnalisé\n' +
        '`/role-react` → Crée un bouton de role-react\n' +
        '`/new-groupe` → Crée un salon + fils pour un groupe\n' +
        '`/remove-groupe` → Supprime le salon d\'un groupe\n' +
        '`/vote` → Lance un vote Oui / Non / Abstention'
      );

    const carter = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle('📢  CARTER')
      .setDescription(
        '`/annonce` → Poste une annonce officielle'
      );

    const operations = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle('⚙️  OPÉRATIONS')
      .setDescription(
        '`/radio <numéro>` → Publie la fréquence radio du soir\n' +
        '`/briefing` → Poste un briefing d\'opération\n' +
        '`/debriefing` → Poste un debriefing d\'opération\n' +
        '`/wanted` → Publie une fiche WANTED sur un personnage'
      );

    const staff = new EmbedBuilder()
      .setColor(config.colors.danger)
      .setTitle('🛡️  STAFF')
      .setDescription(
        '`/kick <membre>` → Expulse un membre\n' +
        '`/ban <membre>` → Bannit un membre\n' +
        '`/mute <membre>` → Mute un membre\n' +
        '`/clean <nombre>` → Supprime un nombre de messages (1-100)\n' +
        '`/promotion <membre>` → Promeut un membre à un nouveau grade\n' +
        '`/absence` → Déclarer une absence\n' +
        '`/panel-absence` → Affiche le panel des absences\n' +
        '`/remove-absence` → Supprime une absence'
      );

    await interaction.reply({ embeds: [header, infos, carter, operations, staff], ephemeral: true });
  },
};

const { EmbedBuilder, ActionRowBuilder } = require('discord.js');
const { sendLog } = require('../utils/logger');
const { isAdmin, hasAccess, hasCarterRole, denyAccess } = require('../utils/permissions');
const config = require('../utils/config');
const { getAbsencesData, saveAbsencesData, updatePanel } = require('../utils/absences');
const { addWarn, getRoleIdForLevel } = require('../utils/avertissements');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // 1. SLASH COMMANDS
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      if (interaction.commandName === 'help') {
        // pas de restriction
      } else if (interaction.commandName === 'absence') {
        if (!hasCarterRole(interaction.member)) {
          return denyAccess(
            interaction,
            "\u{1F6AB} Seuls les membres ayant le rôle **Kyee** peuvent déclarer une absence."
          );
        }
      } else if (!hasAccess(interaction.member)) {
        return denyAccess(interaction);
      }

      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(`[Commande /${interaction.commandName}]`, error);
        const msg = { content: '❌ Une erreur est survenue lors de l\'exécution de cette commande.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(msg);
        } else {
          await interaction.reply(msg);
        }
      }
      return;
    }

    // 2. BOUTONS
    if (interaction.isButton()) {
      if (interaction.customId.startsWith('role_react_')) {
        const roleId = interaction.customId.replace('role_react_', '');
        const role = interaction.guild.roles.cache.get(roleId);
        if (!role) return interaction.reply({ content: '❌ Rôle introuvable.', ephemeral: true });

        const member = interaction.member;
        if (member.roles.cache.has(roleId)) {
          await member.roles.remove(roleId);
          return interaction.reply({ content: `✅ Rôle **${role.name}** retiré.`, ephemeral: true });
        } else {
          await member.roles.add(roleId);
          return interaction.reply({ content: `✅ Rôle **${role.name}** attribué !`, ephemeral: true });
        }
      }
    }

    // 3. SELECT MENUS
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'remove_absence_select') {
        if (!isAdmin(interaction.member)) return denyAccess(interaction);

        const selectedId = parseInt(interaction.values[0], 10);
        const data       = getAbsencesData();
        const index      = data.absences.findIndex(a => a.id === selectedId);

        if (index === -1) {
          return interaction.update({
            embeds: [
              new EmbedBuilder()
                .setColor(config.colors.danger)
                .setTitle('❌ Absence introuvable')
                .setDescription('Cette absence n\'existe plus ou a déjà été supprimée.')
                .setImage(config.bannerUrl)
                .setFooter({ text: config.footerText }),
            ],
            components: [],
          });
        }

        const removed = data.absences.splice(index, 1)[0];
        saveAbsencesData(data);

        await updatePanel(client, data);

        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setColor(config.colors.success)
              .setTitle('✅ Absence supprimée')
              .setDescription(`L'absence de **${removed.prenom} ${removed.nom}** a été retirée de la liste.`)
              .addFields(
                { name: '\u{1F6EB} Départ', value: removed.depart, inline: true },
                { name: '\u{1F6EC} Retour',  value: removed.retour, inline: true },
              )
              .setImage(config.bannerUrl)
              .setFooter({ text: config.footerText })
              .setTimestamp(),
          ],
          components: [],
        });

        await sendLog(client, {
          action: 'Absence supprimée',
          user: interaction.user,
          details: `${removed.prenom} ${removed.nom} (<@${removed.discordId}>) - ${removed.depart} -> ${removed.retour}`,
          color: config.colors.success,
        });
        return;
      }
    }

    // 4. MODALS
    if (interaction.isModalSubmit()) {
      // Modal embed generique
      if (interaction.customId === 'modal_embed') {
        const titre       = interaction.fields.getTextInputValue('embed_titre');
        const description = interaction.fields.getTextInputValue('embed_description');
        const couleur     = interaction.fields.getTextInputValue('embed_couleur') || '#D4AF37';
        const footer      = interaction.fields.getTextInputValue('embed_footer') || config.footerText;
        const imageUrl    = interaction.fields.getTextInputValue('embed_image') || null;

        let colorInt;
        try {
          colorInt = parseInt(couleur.replace('#', ''), 16);
        } catch {
          colorInt = config.colors.primary;
        }

        const embed = new EmbedBuilder()
          .setColor(colorInt)
          .setTitle(titre)
          .setDescription(description)
          .setImage(config.bannerUrl)
          .setFooter({ text: footer })
          .setTimestamp();

        // Si l'utilisateur fournit une image custom, elle remplace la banniere
        if (imageUrl) embed.setImage(imageUrl);

        await interaction.reply({ content: '✅ Embed créé !', ephemeral: true });
        await interaction.channel.send({ embeds: [embed] });
        return;
      }

      // Modal annonce
      if (interaction.customId === 'modal_annonce') {
        const titre       = interaction.fields.getTextInputValue('ann_titre');
        const description = interaction.fields.getTextInputValue('ann_description');
        const ping        = interaction.fields.getTextInputValue('ann_ping') || '';

        const embed = new EmbedBuilder()
          .setColor(config.colors.primary)
          .setTitle(`\u{1F4E2} ${titre}`)
          .setDescription(description)
          .setImage(config.bannerUrl)
          .setFooter({ text: `Annonce par ${interaction.user.tag} - ${config.footerText}` })
          .setTimestamp();

        const annChannel = await client.channels.fetch(config.channels.annonces);
        const content = ping ? `${ping}` : '';
        await annChannel.send({ content, embeds: [embed] });

        await interaction.reply({ content: '✅ Annonce publiée !', ephemeral: true });
        await sendLog(client, { action: 'Annonce publiée', user: interaction.user, details: titre, color: config.colors.info });
        return;
      }

      // Modal avertissement
      if (interaction.customId.startsWith('modal_avertissement|')) {
        if (!isAdmin(interaction.member)) return denyAccess(interaction);

        const [, userId, niveauStr] = interaction.customId.split('|');
        const niveau = parseInt(niveauStr, 10);

        const target = await interaction.guild.members.fetch(userId).catch(() => null);
        if (!target) {
          return interaction.reply({ content: '❌ Membre introuvable (a peut-être quitté le serveur).', ephemeral: true });
        }

        const roleId = getRoleIdForLevel(niveau);
        if (!roleId) {
          return interaction.reply({ content: '❌ Niveau d\'avertissement invalide.', ephemeral: true });
        }

        const raison  = interaction.fields.getTextInputValue('avert_raison');
        const preuves = interaction.fields.getTextInputValue('avert_preuves') || null;

        try {
          await target.roles.add(
            roleId,
            `Avert ${niveau} par ${interaction.user.tag} - ${raison}`
          );

          addWarn({
            userId: target.id,
            userTag: target.user.tag,
            niveau,
            raison,
            preuves,
            modId: interaction.user.id,
            modTag: interaction.user.tag,
            date: new Date().toISOString(),
          });

          const dmEmbed = new EmbedBuilder()
            .setColor(config.colors.danger)
            .setTitle(`⚠️ Tu as reçu un Avertissement ${niveau}`)
            .setDescription(
              `Tu viens de recevoir un **Avertissement de niveau ${niveau}** sur **Del Norte - Famille Kyee**.\n\n` +
              `Merci de respecter le règlement du serveur. En cas de récidive, des sanctions plus lourdes pourront être appliquées.`
            )
            .addFields(
              { name: '\u{1F4DD} Raison',    value: raison, inline: false },
              ...(preuves ? [{ name: '\u{1F4CE} Preuves / contexte', value: preuves, inline: false }] : []),
              { name: '\u{1F46E} Donné par', value: `${interaction.user.tag}`, inline: true },
              { name: '\u{1F39A}️ Niveau',   value: `${niveau} / 3`, inline: true },
            )
            .setImage(config.bannerUrl)
            .setFooter({ text: config.footerText })
            .setTimestamp();

          let dmOk = true;
          await target.user.send({ embeds: [dmEmbed] }).catch(() => { dmOk = false; });

          const replyEmbed = new EmbedBuilder()
            .setColor(niveau === 3 ? config.colors.danger : config.colors.warning)
            .setTitle(`⚠️ Avertissement ${niveau} appliqué`)
            .addFields(
              { name: '\u{1F464} Membre',    value: `<@${target.id}>`, inline: true },
              { name: '\u{1F39A}️ Niveau',   value: `Avertissement ${niveau}`, inline: true },
              { name: '\u{1F46E} Donné par', value: `<@${interaction.user.id}>`, inline: true },
              { name: '\u{1F4DD} Raison',    value: raison, inline: false },
              ...(preuves ? [{ name: '\u{1F4CE} Preuves / contexte', value: preuves, inline: false }] : []),
              { name: '\u{1F4E9} DM envoyé', value: dmOk ? '✅ Oui' : '❌ Non (MP fermés)', inline: true },
            )
            .setImage(config.bannerUrl)
            .setFooter({ text: config.footerText })
            .setTimestamp();

          if (niveau === 3) {
            replyEmbed.addFields({
              name: '\u{1F6A8} Alerte',
              value: '**Ce membre a atteint le niveau 3.** Pensez à prendre une décision (mute / kick / ban).',
              inline: false,
            });
          }

          await interaction.reply({ embeds: [replyEmbed], ephemeral: true });

          await sendLog(client, {
            action: `Avertissement ${niveau} donné`,
            user: interaction.user,
            target: target.user,
            details: `Raison : ${raison}${preuves ? `\nPreuves : ${preuves}` : ''}`,
            color: niveau === 3 ? config.colors.danger : config.colors.warning,
          });
        } catch (err) {
          await interaction.reply({ content: `❌ Erreur : ${err.message}`, ephemeral: true });
        }
        return;
      }

      // Modal new-information
      if (interaction.customId === 'modal_new_groupe') {
        if (!hasAccess(interaction.member)) return denyAccess(interaction);

        const nom       = interaction.fields.getTextInputValue('nom_groupe').trim();
        const categorie = interaction.fields.getTextInputValue('categorie_groupe').trim();
        const emoji     = interaction.fields.getTextInputValue('emoji_groupe').trim();

        const CATEGORIE_MAP = {
          orga: 'organisations',
          gang: 'gangs',
          pf:   'petites frappes',
          inde: 'indépendants',
          sasp: 'sasp',
          fib:  'fib',
        };

        const categorieKey = categorie.toLowerCase();
        if (!CATEGORIE_MAP[categorieKey]) {
          return interaction.reply({
            content: `❌ Catégorie invalide. Valeurs acceptées : **Orga, Gang, PF, Inde, SASP, FIB**`,
            ephemeral: true,
          });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
          // Trouver la catégorie Discord correspondante
          const nomCible = CATEGORIE_MAP[categorieKey];
          const categoryChannel = interaction.guild.channels.cache.find(
            c => c.type === 4 && c.name.toLowerCase().includes(nomCible)
          );

          if (!categoryChannel) {
            return interaction.editReply({
              content: `❌ Aucune catégorie Discord trouvée pour **${categorie}**. Vérifie que la catégorie existe sur le serveur.`,
            });
          }

          // Créer le salon texte dans la catégorie
          const nomSalon = nom.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          const channel = await interaction.guild.channels.create({
            name: `${emoji}・${nomSalon}`,
            type: 0, // GUILD_TEXT
            parent: categoryChannel.id,
            topic: `Informations — ${nom}`,
          });

          // Créer les 5 fils
          const fils = [
            '🗒️ Informations',
            '🏘️ Propriétés',
            '💼 Business',
            '🪪 Carte Identité',
            '📞 Contact',
          ];

          for (const nomFil of fils) {
            const starterMsg = await channel.send(`**${nomFil}**`);
            await channel.threads.create({
              name: nomFil,
              startMessage: starterMsg.id,
              autoArchiveDuration: 10080, // 7 jours
            });
          }

          await interaction.editReply({
            content: `✅ Salon **${channel.name}** créé dans la catégorie **${categoryChannel.name}** avec ses 5 fils.`,
          });

          await sendLog(client, {
            action: 'Nouveau groupe créé',
            user: interaction.user,
            details: `Groupe : ${nom} | Catégorie : ${categorie} | Salon : <#${channel.id}>`,
            color: config.colors.success,
          });
        } catch (err) {
          console.error('[new-information]', err);
          await interaction.editReply({ content: `❌ Erreur : ${err.message}` });
        }
        return;
      }

      // Modal absence
      if (interaction.customId === 'modal_absence') {
        const nom       = interaction.fields.getTextInputValue('absence_nom');
        const prenom    = interaction.fields.getTextInputValue('absence_prenom');
        const discordId = interaction.fields.getTextInputValue('absence_discord_id');
        const depart    = interaction.fields.getTextInputValue('absence_depart');
        const retour    = interaction.fields.getTextInputValue('absence_retour');

        const data = getAbsencesData();
        data.absences.push({
          nom,
          prenom,
          discordId,
          depart,
          retour,
          declaredBy: interaction.user.id,
          declaredAt: new Date().toLocaleDateString('fr-FR'),
          id: Date.now(),
        });
        saveAbsencesData(data);

        const absenceChannel = await client.channels.fetch(config.channels.absence);
        if (absenceChannel) {
          const notifEmbed = new EmbedBuilder()
            .setColor(config.colors.warning)
            .setTitle('\u{1F4C5} Nouvelle Absence Déclarée')
            .addFields(
              { name: '\u{1F464} Membre',      value: `${prenom} ${nom}`,           inline: true },
              { name: '\u{1F516} ID Discord',  value: `<@${discordId}>`,             inline: true },
              { name: '​',                value: '​',                      inline: true },
              { name: '\u{1F6EB} Départ', value: depart,                        inline: true },
              { name: '\u{1F6EC} Retour',      value: retour,                        inline: true },
              { name: '​',                value: '​',                      inline: true },
              { name: '\u{1F4DD} Déclaré par', value: `<@${interaction.user.id}>`,  inline: true },
            )
            .setImage(config.bannerUrl)
            .setFooter({ text: config.footerText })
            .setTimestamp();

          await absenceChannel.send({ embeds: [notifEmbed] });
        }

        await updatePanel(client, data);

        await interaction.reply({
          content: '✅ Ton absence a bien été enregistrée !',
          ephemeral: true,
        });

        await sendLog(client, {
          action: 'Absence déclarée',
          user: interaction.user,
          details: `${prenom} ${nom} (<@${discordId}>) - ${depart} -> ${retour}`,
          color: config.colors.warning,
        });
        return;
      }
    }
  },
};

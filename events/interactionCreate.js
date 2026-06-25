const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { sendLog } = require('../utils/logger');
const { isAdmin, hasAccess, hasCarterRole, denyAccess } = require('../utils/permissions');
const config = require('../utils/config');
const { toggleLike, getLikeCount, hasLiked } = require('../utils/instagram');
const { getAbsencesData, saveAbsencesData, updatePanel } = require('../utils/absences');
const { addWarn, getRoleIdForLevel } = require('../utils/avertissements');
const { getVote, castVote } = require('../utils/votes');

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
      // ── Like Instagram ────────────────────────────────────────────
      if (interaction.customId.startsWith('insta_like_')) {
        const messageId = interaction.customId.replace('insta_like_', '');
        const liked     = toggleLike(messageId, interaction.user.id);
        const count     = getLikeCount(messageId);

        const footerText = count === 0
          ? '0 personne n\'a aimé'
          : count === 1
            ? '1 personne a aimé'
            : `${count} personnes ont aimé`;

        const oldEmbed = interaction.message.embeds[0];
        const newEmbed = EmbedBuilder.from(oldEmbed).setFooter({ text: footerText });

        const newRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`insta_like_${messageId}`)
            .setLabel(`❤️  ${count}`)
            .setStyle(liked ? ButtonStyle.Danger : ButtonStyle.Secondary)
        );

        await interaction.update({ embeds: [newEmbed], components: [newRow] });
        return;
      }

      // ── Panel demande de rôle (ouvert à tous) ─────────────────────
      if (interaction.customId === 'demande_role_panel_btn') {
        const modal = new ModalBuilder()
          .setCustomId('modal_demande_role')
          .setTitle('Demande de Rôle');

        const prenomInput = new TextInputBuilder()
          .setCustomId('role_prenom')
          .setLabel('Prénom (RP)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(50);

        const nomInput = new TextInputBuilder()
          .setCustomId('role_nom')
          .setLabel('Nom (RP)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(50);

        const roleInput = new TextInputBuilder()
          .setCustomId('role_role')
          .setLabel('Rôle que tu as (ex : Membre, Recrue…)')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(100);

        modal.addComponents(
          new ActionRowBuilder().addComponents(prenomInput),
          new ActionRowBuilder().addComponents(nomInput),
          new ActionRowBuilder().addComponents(roleInput),
        );

        return interaction.showModal(modal);
      }

      // ── Bouton "Fait" demande de rôle (accesBot uniquement) ───────
      if (interaction.customId.startsWith('role_fait_')) {
        if (!hasAccess(interaction.member)) {
          return interaction.reply({ content: '🚫 Seuls les membres **accesBot** peuvent valider une demande.', ephemeral: true });
        }

        try {
          await interaction.message.delete();
        } catch {
          return interaction.reply({ content: '❌ Impossible de supprimer le message.', ephemeral: true });
        }
        return;
      }

      // ── Role React ────────────────────────────────────────────────
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

      // ── Boutons vote ──────────────────────────────────────────────
      if (interaction.customId.startsWith('vote_')) {
        const parts  = interaction.customId.split('_'); // ['vote','yes/no/abstain','id']
        const choice = parts[1]; // 'yes' | 'no' | 'abstain'
        const voteId = parts[2];

        if (!['yes', 'no', 'abstain'].includes(choice)) return;

        const vote = getVote(voteId);
        if (!vote) {
          return interaction.reply({ content: '❌ Ce vote est introuvable ou a expiré.', ephemeral: true });
        }

        castVote(voteId, interaction.user.id, choice);

        const choiceLabel = { yes: '✅ Oui', no: '❌ Non', abstain: '🤷 Abstention' }[choice];

        // Mettre à jour le compteur dans l'embed
        try {
          const channel = await interaction.client.channels.fetch(vote.channelId);
          const msg     = await channel.messages.fetch(vote.messageId);
          const oldData = msg.embeds[0].toJSON();

          const newDescription =
            vote.baseDescription +
            `**✅ Oui :** \`${vote.yes.size}\`\n` +
            `**❌ Non :** \`${vote.no.size}\`\n` +
            `**🤷 Abstention :** \`${vote.abstain.size}\``;

          const newEmbed = new EmbedBuilder(oldData).setDescription(newDescription);
          await msg.edit({ embeds: [newEmbed] });
        } catch { /* message supprimé ou inaccessible */ }

        return interaction.reply({ content: `Vote enregistré : **${choiceLabel}**`, ephemeral: true });
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
      // Modal demande de rôle
      if (interaction.customId === 'modal_demande_role') {
        const prenom = interaction.fields.getTextInputValue('role_prenom');
        const nom    = interaction.fields.getTextInputValue('role_nom');
        const role   = interaction.fields.getTextInputValue('role_role');

        const embed = new EmbedBuilder()
          .setColor(config.colors.info)
          .setTitle('🎖️ Nouvelle Demande de Rôle')
          .setDescription(`<@${interaction.user.id}> vient de soumettre une demande de rôle.`)
          .addFields(
            { name: '👤 Prénom', value: prenom, inline: true },
            { name: '👤 Nom',    value: nom,    inline: true },
            { name: '​',         value: '​',    inline: true },
            { name: '🎖️ Rôle demandé', value: role, inline: false },
          )
          .setImage(config.bannerUrl)
          .setFooter({ text: `Demande de ${interaction.user.tag} • ${config.footerText}` })
          .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`role_fait_${interaction.user.id}`)
            .setLabel('Fait')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅')
        );

        try {
          const demandeChannel = await client.channels.fetch(config.channels.demandeRole);
          await demandeChannel.send({ embeds: [embed], components: [row] });
          await interaction.reply({ content: '✅ Ta demande a bien été envoyée ! Le staff s\'en occupera rapidement.', ephemeral: true });
        } catch (err) {
          return interaction.reply({ content: `❌ Erreur lors de l'envoi : ${err.message}`, ephemeral: true });
        }
        return;
      }

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

      // Modal briefing
      if (interaction.customId === 'modal_briefing') {
        const nom      = interaction.fields.getTextInputValue('briefing_nom');
        const objectif = interaction.fields.getTextInputValue('briefing_objectif');
        const lieu     = interaction.fields.getTextInputValue('briefing_lieu');
        const heure    = interaction.fields.getTextInputValue('briefing_heure');
        const ping     = interaction.fields.getTextInputValue('briefing_ping') || '';

        const embed = new EmbedBuilder()
          .setColor(config.colors.warning)
          .setTitle(`📋 BRIEFING — ${nom}`)
          .setDescription('> *Information confidentielle. Ne pas partager hors de l\'organisation.*')
          .addFields(
            { name: '🎯 Objectif',    value: objectif, inline: false },
            { name: '📍 Lieu',        value: lieu,     inline: true  },
            { name: '⏰ Heure / RDV', value: heure,    inline: true  },
          )
          .setImage(config.bannerUrl)
          .setFooter({ text: `Briefing par ${interaction.user.tag} • ${config.footerText}` })
          .setTimestamp();

        try {
          const annChannel = await client.channels.fetch(config.channels.annonces);
          await annChannel.send({ content: ping || '', embeds: [embed] });
          await interaction.reply({ content: `✅ Briefing publié dans <#${config.channels.annonces}> !`, ephemeral: true });
        } catch (err) {
          return interaction.reply({ content: `❌ Erreur : ${err.message}`, ephemeral: true });
        }

        await sendLog(client, {
          action:  'Briefing posté',
          user:    interaction.user,
          details: `Opération : ${nom} | Lieu : ${lieu} | ${heure}`,
          color:   config.colors.warning,
        });
        return;
      }

      // Modal debriefing
      if (interaction.customId === 'modal_debriefing') {
        const nom      = interaction.fields.getTextInputValue('debrief_nom');
        const resultat = interaction.fields.getTextInputValue('debrief_resultat');
        const bilan    = interaction.fields.getTextInputValue('debrief_bilan');
        const pertes   = interaction.fields.getTextInputValue('debrief_pertes') || null;
        const notes    = interaction.fields.getTextInputValue('debrief_notes')   || null;

        const r = resultat.toLowerCase();
        let color = config.colors.info;
        if (r.includes('succ'))    color = config.colors.success;
        else if (r.includes('ch')) color = config.colors.danger;  // échec
        else if (r.includes('partiel')) color = config.colors.warning;

        const fields = [
          { name: '📊 Résultat', value: resultat, inline: true },
          { name: '📋 Bilan',    value: bilan,    inline: false },
        ];
        if (pertes) fields.push({ name: '💀 Pertes / Dommages', value: pertes, inline: false });
        if (notes)  fields.push({ name: '📝 Notes',             value: notes,  inline: false });

        const embed = new EmbedBuilder()
          .setColor(color)
          .setTitle(`📊 DEBRIEFING — ${nom}`)
          .addFields(...fields)
          .setImage(config.bannerUrl)
          .setFooter({ text: `Debriefing par ${interaction.user.tag} • ${config.footerText}` })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        await sendLog(client, {
          action:  'Debriefing posté',
          user:    interaction.user,
          details: `Opération : ${nom} | Résultat : ${resultat}`,
          color,
        });
        return;
      }

      // Modal wanted
      if (interaction.customId === 'modal_wanted') {
        const nom         = interaction.fields.getTextInputValue('wanted_nom');
        const crimes      = interaction.fields.getTextInputValue('wanted_crimes');
        const prime       = interaction.fields.getTextInputValue('wanted_prime');
        const description = interaction.fields.getTextInputValue('wanted_description') || null;
        const ping        = interaction.fields.getTextInputValue('wanted_ping')         || '';

        const fields = [
          { name: '⚖️ Crimes / Motifs', value: crimes,         inline: false },
          { name: '💰 Prime',           value: `**${prime}**`, inline: true  },
          { name: '⚠️ Dangerosité',     value: 'Extrêmement dangereux — À approcher avec précaution', inline: false },
        ];
        if (description) fields.push({ name: '📍 Description / Dernière position', value: description, inline: false });

        const embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle(`🔴 WANTED — ${nom}`)
          .setDescription('> *Toute information menant à sa capture sera récompensée.*')
          .addFields(...fields)
          .setImage(config.bannerUrl)
          .setFooter({ text: `Publié par ${interaction.user.tag} • ${config.footerText}` })
          .setTimestamp();

        try {
          const annChannel = await client.channels.fetch(config.channels.annonces);
          await annChannel.send({ content: ping || '', embeds: [embed] });
          await interaction.reply({ content: `✅ Fiche WANTED publiée dans <#${config.channels.annonces}> !`, ephemeral: true });
        } catch (err) {
          return interaction.reply({ content: `❌ Erreur : ${err.message}`, ephemeral: true });
        }

        await sendLog(client, {
          action:  'Fiche Wanted publiée',
          user:    interaction.user,
          details: `Personnage : ${nom} | Prime : ${prime}`,
          color:   0xFF0000,
        });
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

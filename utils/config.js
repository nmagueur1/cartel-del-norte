// ============================================
// Configuration centrale du bot Del Norte - Famille Kyee
// ============================================

module.exports = {
  // -- Salons ----------------------------------
  channels: {
    annonces:     '1519407323301281903',
    radio:        '1519407480575234219',
    logs:         '1519408570381373440',
    absence:      '1519407106053247117',
    demandeRole:  '1519406368262717562',
  },

  // -- Roles -----------------------------------
  roles: {
    accesBot: '1519386546032087112',  // Peut utiliser les commandes du bot
    carter:   '1519406204290469921',  // Membres de la Famille Kyee (peuvent /absence)
    avert1:   '1519386849683046441',  // Avertissement niveau 1
    avert2:   '1519386840644452574',  // Avertissement niveau 2
    avert3:   '1519386819618148574',  // Avertissement niveau 3
  },

  // -- Avertissements --------------------------
  // Mapping niveau -> ID de role (utilise par le systeme d'avertissements)
  avertissements: {
    1: '1519386849683046441',
    2: '1519386840644452574',
    3: '1519386819618148574',
  },

  // -- Couleurs embed --------------------------
  colors: {
    primary:  0xD4AF37, // Dore - couleur officielle Del Norte - Famille Kyee
    success:  0x2ECC71,
    danger:   0xE74C3C,
    warning:  0xF39C12,
    info:     0x3498DB,
    dark:     0x000000, // Noir profond - seconde couleur officielle Del Norte
  },

  // -- Divers ----------------------------------
  footerText: 'Del Norte - Famille Kyee',

  // -- Branding --------------------------------
  // Banniere officielle Del Norte - Famille Kyee (utilisee sur TOUS les embeds via .setImage)
  bannerUrl: 'https://media.discordapp.net/attachments/1500886780461973586/1501934996943016057/Bannieres_Carter.png?ex=69fde177&is=69fc8ff7&hm=2027678c52d07feb15852eaca744f8bf250e609326bc636b225b2a83066e76a9&=&format=webp&quality=lossless&width=1872&height=468',
};

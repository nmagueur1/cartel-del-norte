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
    mediaStorage: '1519697930938744852',  // Salon privé invisible (bot only) pour stocker les images Instagram
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
  bannerUrl: 'https://media.discordapp.net/attachments/1519407405157322923/1519691947223285760/Gemini_Generated_Image_1nbyj41nbyj41nby.png?ex=6a3e7aea&is=6a3d296a&hm=bdaf3e48998f1ca66674bdba7b704319a500523a4de1ce3dd8923a74f9969bd0&=&format=webp&quality=lossless',
};

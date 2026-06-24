// ────────────────────────────────────────────
// Utilitaires – Système d'avertissements
// ────────────────────────────────────────────

const fs   = require('fs');
const path = require('path');
const config = require('./config');

const AVERT_PATH = path.join(__dirname, '../data/avertissements.json');

// ── Lecture / écriture ─────────────────────
function getWarnsData() {
  try {
    return JSON.parse(fs.readFileSync(AVERT_PATH, 'utf8'));
  } catch {
    return { warns: [] };
  }
}

function saveWarnsData(data) {
  fs.writeFileSync(AVERT_PATH, JSON.stringify(data, null, 2));
}

// ── Helpers ────────────────────────────────

/**
 * Récupère tous les avertissements actifs d'un membre.
 * @param {string} userId
 * @returns {Array} Liste des warns du membre
 */
function getMemberWarns(userId) {
  const data = getWarnsData();
  return data.warns.filter(w => w.userId === userId);
}

/**
 * Récupère le rôle Discord correspondant à un niveau d'avertissement.
 * @param {number} niveau (1, 2 ou 3)
 * @returns {string|null} ID du rôle
 */
function getRoleIdForLevel(niveau) {
  return config.avertissements[niveau] || null;
}

/**
 * Ajoute un avertissement à l'historique JSON.
 * @param {Object} warn { userId, niveau, raison, modId, modTag, date }
 */
function addWarn(warn) {
  const data = getWarnsData();
  data.warns.push({
    id: Date.now(),
    ...warn,
  });
  saveWarnsData(data);
}

/**
 * Retire un avertissement de l'historique (par id ou par niveau).
 * @param {string} userId
 * @param {number} niveau
 * @returns {Object|null} Le warn retiré, ou null
 */
function removeWarnByLevel(userId, niveau) {
  const data = getWarnsData();
  // On retire le plus récent du niveau demandé
  const idx = [...data.warns]
    .map((w, i) => ({ w, i }))
    .filter(({ w }) => w.userId === userId && w.niveau === niveau)
    .sort((a, b) => b.w.id - a.w.id)[0]?.i;

  if (idx === undefined) return null;
  const removed = data.warns.splice(idx, 1)[0];
  saveWarnsData(data);
  return removed;
}

/**
 * Vérifie si le membre possède un rôle d'avertissement d'un niveau donné.
 */
function hasWarnRole(member, niveau) {
  const roleId = getRoleIdForLevel(niveau);
  return roleId ? member.roles.cache.has(roleId) : false;
}

module.exports = {
  getWarnsData,
  saveWarnsData,
  getMemberWarns,
  getRoleIdForLevel,
  addWarn,
  removeWarnByLevel,
  hasWarnRole,
};

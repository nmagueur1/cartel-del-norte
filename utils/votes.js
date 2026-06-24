// ────────────────────────────────────────────
// Utilitaires – Gestion des votes en mémoire
// ────────────────────────────────────────────

// Map : voteId → { question, baseDescription, messageId, channelId, yes, no, abstain }
const votes = new Map();

function initVote(voteId, question, baseDescription, messageId, channelId) {
  votes.set(voteId, {
    question,
    baseDescription,
    messageId,
    channelId,
    yes:     new Set(),
    no:      new Set(),
    abstain: new Set(),
  });
}

function getVote(voteId) {
  return votes.get(voteId) || null;
}

/**
 * Enregistre le vote d'un utilisateur.
 * Retire automatiquement son éventuel ancien vote.
 * @param {string} voteId
 * @param {string} userId
 * @param {'yes'|'no'|'abstain'} choice
 * @returns {object|null} le vote mis à jour
 */
function castVote(voteId, userId, choice) {
  const vote = votes.get(voteId);
  if (!vote) return null;

  vote.yes.delete(userId);
  vote.no.delete(userId);
  vote.abstain.delete(userId);
  vote[choice].add(userId);

  return vote;
}

module.exports = { initVote, getVote, castVote };

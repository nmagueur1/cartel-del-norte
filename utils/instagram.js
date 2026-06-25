// Stockage en mémoire des likes Instagram
// Map<messageId, Set<userId>>
const likes = new Map();

function getLikeSet(messageId) {
  if (!likes.has(messageId)) likes.set(messageId, new Set());
  return likes.get(messageId);
}

function toggleLike(messageId, userId) {
  const set = getLikeSet(messageId);
  if (set.has(userId)) {
    set.delete(userId);
    return false; // unliked
  }
  set.add(userId);
  return true; // liked
}

function getLikeCount(messageId) {
  return getLikeSet(messageId).size;
}

function hasLiked(messageId, userId) {
  return getLikeSet(messageId).has(userId);
}

module.exports = { toggleLike, getLikeCount, hasLiked };

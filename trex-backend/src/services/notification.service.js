const repo = require('../repositories/memory.repository');

function list(userId) {
  return [...repo.notifications.values()].filter(n => n.userId === userId).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
}
function markRead(userId, notificationId) {
  const n = repo.notifications.get(notificationId);
  if (!n || n.userId !== userId) throw Object.assign(new Error('Notification not found.'), { status: 404 });
  n.read = true;
  return n;
}
module.exports = { list, markRead };

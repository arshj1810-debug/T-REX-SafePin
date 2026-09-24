const repo = require('../repositories/memory.repository');

function get(req, res, next) {
  try {
    const userId = req.user.sub;
    const active = repo.protections.get(userId) === true;

    res.json({
      success: true,
      active
    });
  } catch (e) {
    next(e);
  }
}

function activate(req, res, next) {
  try {
    const userId = req.user.sub;

    repo.protections.set(userId, true);

    repo.addAudit({
      userId,
      action: 'EMERGENCY_PROTECTION_ACTIVATED',
      entityType: 'USER',
      entityId: userId
    });

    repo.addNotification(userId, {
      type: 'security',
      icon: '🛡️',
      title: 'Emergency Protection Activated',
      message: 'Your SafePin protection mode has been activated.',
      priority: 'high'
    });

    res.json({
      success: true,
      active: true
    });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  get,
  activate
};

/*
| T-REX / SafePin
| Notification Service
|
| PostgreSQL-backed notification management.
*/

const repo = require('../repositories/postgres.repository');

/* ============================================================
   LIST NOTIFICATIONS
   ============================================================ */

async function list(userId) {
    if (!userId) {
        throw Object.assign(
            new Error('Authenticated user is required.'),
            { status: 401 }
        );
    }

    return repo.listNotifications(userId);
}

/* ============================================================
   MARK NOTIFICATION AS READ
   ============================================================ */

async function markRead(userId, notificationId) {
    if (!userId) {
        throw Object.assign(
            new Error('Authenticated user is required.'),
            { status: 401 }
        );
    }

    if (!notificationId) {
        throw Object.assign(
            new Error('Notification ID is required.'),
            { status: 400 }
        );
    }

    return repo.markNotificationRead(
        userId,
        notificationId
    );
}

/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
    list,
    markRead
};
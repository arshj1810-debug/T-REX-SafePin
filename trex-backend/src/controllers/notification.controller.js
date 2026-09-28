/*
| T-REX / SafePin
| Notification Controller
|
| Handles asynchronous PostgreSQL-backed notifications.
*/

const service = require('../services/notification.service');

/* ============================================================
   LIST NOTIFICATIONS
   ============================================================ */

async function list(req, res, next) {
    try {
        const notifications =
            await service.list(
                req.user.sub
            );

        return res.json({
            success: true,
            notifications
        });
    } catch (error) {
        return next(error);
    }
}

/* ============================================================
   MARK NOTIFICATION AS READ
   ============================================================ */

async function markRead(req, res, next) {
    try {
        const notification =
            await service.markRead(
                req.user.sub,
                req.params.notificationId
            );

        return res.json({
            success: true,
            notification
        });
    } catch (error) {
        return next(error);
    }
}

/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
    list,
    markRead
};

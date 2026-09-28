/*
| T-REX / SafePin
| Security Controller
|
| PostgreSQL-backed Emergency Protection management.
*/

const repo = require('../repositories/postgres.repository');

/* ============================================================
   GET PROTECTION STATUS
   ============================================================ */

async function get(req, res, next) {
    try {
        const protection =
            await repo.getProtection(
                req.user.sub
            );

        return res.json({
            success: true,
            active: protection.active
        });
    } catch (error) {
        return next(error);
    }
}

/* ============================================================
   ACTIVATE EMERGENCY PROTECTION
   ============================================================ */

async function activate(req, res, next) {
    try {
        const userId =
            req.user.sub;

        const user =
            await repo.findUserById(
                userId
            );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        const protection =
            await repo.setProtection(
                userId,
                true
            );

        await repo.addAudit({
            id:
                repo.randomId('audit'),

            userId,

            action:
                'EMERGENCY_PROTECTION_ACTIVATED',

            entityType:
                'security_protection',

            entityId:
                userId,

            metadata: {
                active: true
            }
        });

        await repo.addNotification({
            notificationId:
                repo.randomId('ntf'),

            userId,

            type:
                'security',

            icon:
                '🛡️',

            title:
                'Emergency Protection Activated',

            message:
                'Your SafePin protection mode has been activated.',

            priority:
                'high',

            read:
                false
        });

        return res.json({
            success: true,
            active: protection.active
        });
    } catch (error) {
        return next(error);
    }
}

/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
    get,
    activate
};
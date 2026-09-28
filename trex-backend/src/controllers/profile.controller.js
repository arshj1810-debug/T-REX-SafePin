/*
| T-REX / SafePin
| Profile Controller
|
| PostgreSQL-backed user profile management.
*/

const repo = require('../repositories/postgres.repository');

/* ============================================================
   GET PROFILE
   ============================================================ */

async function get(req, res, next) {
    try {
        const user =
            await repo.findUserById(
                req.user.sub
            );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        return res.json({
            success: true,
            profile: user
        });
    } catch (error) {
        return next(error);
    }
}

/* ============================================================
   UPDATE PROFILE
   ============================================================ */

async function update(req, res, next) {
    try {
        const userId =
            req.user.sub;

        const body =
            req.body || {};

        const name =
            repo.normalizeString(
                body.name
            );

        const email =
            repo.normalizeString(
                body.email
            );

        const phone =
            repo.normalizePhone(
                body.phone
            );

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Name is required.'
            });
        }

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required.'
            });
        }

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required.'
            });
        }

        const existingUser =
            await repo.findUserById(
                userId
            );

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        /*
         * Prevent another account from using
         * the same phone number.
         */
        const phoneUser =
            await repo.findUserByPhone(
                phone
            );

        if (
            phoneUser &&
            phoneUser.id !== userId
        ) {
            return res.status(409).json({
                success: false,
                message:
                    'This phone number is already associated with another account.'
            });
        }

        const updatedUser =
            await repo.updateUser(
                userId,
                {
                    name,
                    email,
                    phone
                }
            );

        await repo.addAudit({
            id:
                repo.randomId('audit'),

            userId,

            action:
                'PROFILE_UPDATED',

            entityType:
                'user',

            entityId:
                userId,

            metadata: {
                fields: [
                    'name',
                    'email',
                    'phone'
                ]
            }
        });

        return res.json({
            success: true,
            profile: updatedUser
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
    update
};
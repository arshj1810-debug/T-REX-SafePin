const repo = require('../repositories/memory.repository');

function get(req, res, next) {
    try {
        const user = repo.findUserById(req.user.sub);

        if (!user) {
            throw Object.assign(
                new Error('User not found.'),
                { status: 404 }
            );
        }

        res.json({
            success: true,
            profile: user
        });
    } catch (e) {
        next(e);
    }
}

function update(req, res, next) {
    try {
        const user = repo.findUserById(req.user.sub);

        if (!user) {
            throw Object.assign(
                new Error('User not found.'),
                { status: 404 }
            );
        }

        if (req.body.name !== undefined) {
            const name = String(req.body.name).trim();

            if (!name) {
                throw Object.assign(
                    new Error('Name cannot be empty.'),
                    { status: 400 }
                );
            }

            if (name.length > 100) {
                throw Object.assign(
                    new Error('Name must be 100 characters or less.'),
                    { status: 400 }
                );
            }

            user.name = name;
        }

        if (req.body.email !== undefined) {
            const email = String(req.body.email).trim();

            if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                throw Object.assign(
                    new Error('Invalid email address.'),
                    { status: 400 }
                );
            }

            user.email = email;
        }

        if (req.body.phone !== undefined) {
            const phone = String(req.body.phone).trim();

            if (phone.length > 30) {
                throw Object.assign(
                    new Error('Phone number is too long.'),
                    { status: 400 }
                );
            }

            user.phone = phone;
        }

        user.updatedAt = repo.now();

        repo.addAudit({
            userId: user.id,
            action: 'PROFILE_UPDATED',
            entityType: 'USER',
            entityId: user.id
        });

        res.json({
            success: true,
            profile: user
        });
    } catch (e) {
        next(e);
    }
}

module.exports = {
    get,
    update
};

const crypto = require('crypto');

/*
|--------------------------------------------------------------------------
| In-Memory Storage
|--------------------------------------------------------------------------
|
| This repository is intentionally database-independent.
|
| For the SIH MVP, data is stored in memory.
| When the database teammate integrates the real database, this file
| can be replaced/adapted without changing the controllers or routes.
|
*/

const users = new Map();
const cases = new Map();
const documents = new Map();
const requests = new Map();
const notifications = new Map();
const protections = new Map();
const auditLogs = [];

/*
|--------------------------------------------------------------------------
| Utility Functions
|--------------------------------------------------------------------------
*/

function now() {
    return new Date().toISOString();
}

function id(prefix) {
    return `${prefix}_${crypto.randomUUID()}`;
}

function caseId() {
    return `2026-${Math.floor(
        100000 + Math.random() * 900000
    )}`;
}

/*
|--------------------------------------------------------------------------
| Demo User
|--------------------------------------------------------------------------
*/

function seedUser() {
    const user = {
        id: 'usr_demo_001',
        name: 'Aditya Kapoor',
        email: 'aditya@example.com',
        phone: '+91 XXXXX XXXXX',

        // Never store the complete Aadhaar number.
        aadhaarLast4: null,

        verified: true,
        role: 'requester',

        createdAt: now(),
        updatedAt: now()
    };

    users.set(
        user.id,
        user
    );

    return user;
}

seedUser();

/*
|--------------------------------------------------------------------------
| User Functions
|--------------------------------------------------------------------------
*/

function findUserById(userId) {
    return users.get(userId);
}

/*
|--------------------------------------------------------------------------
| Find User By Phone
|--------------------------------------------------------------------------
|
| Used by OTP authentication.
|
*/

function findUserByPhone(phone) {
    const normalizedPhone =
        String(phone || '').trim();

    if (!normalizedPhone) {
        return null;
    }

    return [
        ...users.values()
    ].find(
        user =>
            String(user.phone || '').trim() ===
            normalizedPhone
    ) || null;
}

/*
|--------------------------------------------------------------------------
| Create User From Successful OTP Verification
|--------------------------------------------------------------------------
|
| OTP verification proves control of the phone number.
|
| The user is created as a verified requester and the returned ID is
| subsequently placed inside the JWT.
|
*/

function findOrCreatePhoneUser({
    phone,
    userId = null
}) {
    const normalizedPhone =
        String(phone || '').trim();

    if (!normalizedPhone) {
        throw Object.assign(
            new Error('Phone number is required.'),
            { status: 400 }
        );
    }

    /*
     * If auth.service already has a user ID and that user exists,
     * update the phone information and return that user.
     */
    if (userId) {
        const existingById =
            users.get(userId);

        if (existingById) {
            existingById.phone =
                normalizedPhone;

            existingById.verified = true;

            existingById.updatedAt =
                now();

            return existingById;
        }
    }

    /*
     * Otherwise find an existing account by phone.
     */
    let user =
        findUserByPhone(
            normalizedPhone
        );

    if (user) {
        user.verified = true;

        user.updatedAt =
            now();

        return user;
    }

    /*
     * No existing account:
     * create a new verified requester.
     */
    user = {
        id: id('usr'),

        name: 'Verified Requester',

        email: '',

        phone: normalizedPhone,

        // OTP login does not itself establish Aadhaar identity.
        aadhaarLast4: null,

        verified: true,
        role: 'requester',

        createdAt: now(),

        updatedAt: now()
    };

    users.set(
        user.id,
        user
    );

    /*
     * Record the authentication event.
     */
    addAudit({
        userId: user.id,

        action: 'PHONE_OTP_VERIFIED',

        entityType: 'USER',

        entityId: user.id
    });

    return user;
}

/*
|--------------------------------------------------------------------------
| Existing Aadhaar-Based User Function
|--------------------------------------------------------------------------
|
| Kept intact for the existing T-REX workflow.
|
*/

function findOrCreateUser({
    aadhaarLast4
}) {
    const normalizedLast4 =
        String(aadhaarLast4 || '').trim();

    if (!normalizedLast4) {
        throw Object.assign(
            new Error('Aadhaar reference is required.'),
            { status: 400 }
        );
    }

    let user = [
        ...users.values()
    ].find(
        existingUser =>
            existingUser.aadhaarLast4 ===
            normalizedLast4
    );

    if (!user) {
        user = {
            id: id('usr'),

            name: 'Verified Requester',

            email: '',

            phone: '',

            aadhaarLast4:
                normalizedLast4,

            verified: false,

            createdAt: now(),

            updatedAt: now()
        };

        users.set(
            user.id,
            user
        );
    }

    return user;
}

/*
|--------------------------------------------------------------------------
| Audit Logs
|--------------------------------------------------------------------------
*/

function addAudit(entry = {}) {
    const auditEntry = {
        id: id('audit'),

        timestamp: now(),

        ...entry
    };

    auditLogs.push(
        auditEntry
    );

    return auditEntry;
}

/*
|--------------------------------------------------------------------------
| Notifications
|--------------------------------------------------------------------------
*/

function addNotification(
    userId,
    data = {}
) {
    const notification = {
        id: id('ntf'),

        userId,

        createdAt: now(),

        read: false,

        ...data
    };

    notifications.set(
        notification.id,
        notification
    );

    return notification;
}

/*
|--------------------------------------------------------------------------
| Repository Export
|--------------------------------------------------------------------------
*/

module.exports = {
    // Storage collections
    users,
    cases,
    documents,
    requests,
    notifications,
    protections,
    auditLogs,

    // Utility functions
    now,
    id,
    caseId,

    // User functions
    findUserById,
    findUserByPhone,
    findOrCreateUser,
    findOrCreatePhoneUser,

    // Audit
    addAudit,

    // Notifications
    addNotification
};

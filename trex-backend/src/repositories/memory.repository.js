const crypto = require('crypto');

/*
|--------------------------------------------------------------------------
| T-REX / SafePin
| In-Memory Repository
|--------------------------------------------------------------------------
|
| This repository is intentionally database-independent.
|
| It provides the storage interface currently used by the controllers and
| services. Later, the database implementation can replace this file
| without requiring changes to the API routes/controllers.
|
| IMPORTANT:
| This storage is temporary.
| All data is lost when the Node.js process restarts.
|
*/


// --------------------------------------------------------------------------
// In-Memory Collections
// --------------------------------------------------------------------------

const users = new Map();
const cases = new Map();
const documents = new Map();
const requests = new Map();
const notifications = new Map();
const protections = new Map();

const auditLogs = [];


// --------------------------------------------------------------------------
// Utility Helpers
// --------------------------------------------------------------------------

function now() {
    return new Date().toISOString();
}


/**
 * Generate a unique application ID.
 *
 * Example:
 * usr_6d4...
 * req_...
 * doc_...
 */
function id(prefix = 'id') {
    const safePrefix =
        String(prefix || 'id')
            .trim()
            .replace(/[^a-zA-Z0-9_-]/g, '');

    return `${safePrefix || 'id'}_${crypto.randomUUID()}`;
}


/**
 * Generate a human-readable T-REX case ID.
 *
 * Example:
 * 2026-483921
 *
 * crypto.randomInt() is used instead of Math.random()
 * for stronger uniqueness.
 */
function caseId() {
    const year = new Date().getFullYear();

    let generated;

    do {
        generated =
            `${year}-${crypto.randomInt(100000, 1000000)}`;
    } while (cases.has(generated));

    return generated;
}


/**
 * Normalize a value to a trimmed string.
 */
function normalizeString(value) {
    return String(value ?? '').trim();
}


/**
 * Normalize phone numbers for consistent lookup.
 *
 * This repository does not perform full phone validation.
 * Phone validation/OTP verification belongs to the authentication layer.
 */
function normalizePhone(phone) {
    return normalizeString(phone)
        .replace(/[^\d+]/g, '');
}


/**
 * Normalize Aadhaar reference.
 *
 * Only the last four digits/reference should ever be stored here.
 */
function normalizeAadhaarLast4(value) {
    return normalizeString(value)
        .replace(/\D/g, '')
        .slice(-4);
}


// --------------------------------------------------------------------------
// Demo User
// --------------------------------------------------------------------------

function seedUser() {
    const existing =
        users.get('usr_demo_001');

    if (existing) {
        return existing;
    }

    const timestamp = now();

    const user = {
        id: 'usr_demo_001',

        name: 'Aditya Kapoor',

        email: 'aditya@example.com',

        phone: '+91 XXXXX XXXXX',

        // Never store the complete Aadhaar number.
        aadhaarLast4: null,

        verified: true,

        role: 'requester',

        createdAt: timestamp,

        updatedAt: timestamp
    };

    users.set(
        user.id,
        user
    );

    return user;
}

seedUser();


// --------------------------------------------------------------------------
// User Functions
// --------------------------------------------------------------------------

function findUserById(userId) {
    const normalizedUserId =
        normalizeString(userId);

    if (!normalizedUserId) {
        return null;
    }

    return users.get(normalizedUserId) || null;
}


/**
 * Find a user by normalized phone number.
 */
function findUserByPhone(phone) {
    const normalizedPhone =
        normalizePhone(phone);

    if (!normalizedPhone) {
        return null;
    }

    for (const user of users.values()) {
        const userPhone =
            normalizePhone(user.phone);

        if (
            userPhone &&
            userPhone === normalizedPhone
        ) {
            return user;
        }
    }

    return null;
}


/**
 * Create or retrieve a user after successful phone OTP verification.
 *
 * IMPORTANT:
 * OTP verification establishes control of the phone number.
 * It does not by itself establish Aadhaar identity or authority
 * over a deceased person's services.
 */
function findOrCreatePhoneUser({
    phone,
    userId = null
} = {}) {
    const normalizedPhone =
        normalizePhone(phone);

    if (!normalizedPhone) {
        throw Object.assign(
            new Error(
                'Phone number is required.'
            ),
            {
                status: 400
            }
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Existing authenticated/application user
    |--------------------------------------------------------------------------
    |
    | Only use userId when the supplied user actually exists.
    |
    */
    const normalizedUserId =
        normalizeString(userId);

    if (normalizedUserId) {
        const existingById =
            users.get(normalizedUserId);

        if (existingById) {
            /*
             * Do not silently overwrite a different user's phone number.
             *
             * If this phone is already attached to another account,
             * reject the association rather than creating an account
             * collision.
             */
            const phoneOwner =
                findUserByPhone(normalizedPhone);

            if (
                phoneOwner &&
                phoneOwner.id !== existingById.id
            ) {
                throw Object.assign(
                    new Error(
                        'This phone number is already associated with another account.'
                    ),
                    {
                        status: 409
                    }
                );
            }

            existingById.phone =
                normalizedPhone;

            existingById.verified =
                true;

            existingById.updatedAt =
                now();

            return existingById;
        }
    }


    /*
    |--------------------------------------------------------------------------
    | Existing user by phone
    |--------------------------------------------------------------------------
    */

    const existingByPhone =
        findUserByPhone(normalizedPhone);

    if (existingByPhone) {
        existingByPhone.verified =
            true;

        existingByPhone.updatedAt =
            now();

        return existingByPhone;
    }


    /*
    |--------------------------------------------------------------------------
    | Create new verified requester
    |--------------------------------------------------------------------------
    */

    const timestamp = now();

    const user = {
        id: id('usr'),

        name: 'Verified Requester',

        email: '',

        phone: normalizedPhone,

        // OTP verification does not establish Aadhaar identity.
        aadhaarLast4: null,

        verified: true,

        role: 'requester',

        createdAt: timestamp,

        updatedAt: timestamp
    };

    users.set(
        user.id,
        user
    );


    /*
    |--------------------------------------------------------------------------
    | Authentication Audit
    |--------------------------------------------------------------------------
    */

    addAudit({
        userId: user.id,

        action: 'PHONE_OTP_VERIFIED',

        entityType: 'USER',

        entityId: user.id
    });

    return user;
}


/**
 * Existing Aadhaar-reference based user creation.
 *
 * Only the last four digits/reference are stored.
 *
 * NOTE:
 * This function does NOT claim that Aadhaar verification occurred.
 * Actual identity/authority verification belongs in the verification
 * workflow.
 */
function findOrCreateUser({
    aadhaarLast4
} = {}) {
    const normalizedLast4 =
        normalizeAadhaarLast4(
            aadhaarLast4
        );

    if (
        !normalizedLast4 ||
        normalizedLast4.length !== 4
    ) {
        throw Object.assign(
            new Error(
                'Aadhaar reference must contain the last four digits.'
            ),
            {
                status: 400
            }
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Existing user
    |--------------------------------------------------------------------------
    */

    for (const existingUser of users.values()) {
        if (
            String(existingUser.aadhaarLast4 || '') ===
            normalizedLast4
        ) {
            existingUser.updatedAt =
                now();

            return existingUser;
        }
    }


    /*
    |--------------------------------------------------------------------------
    | Create user
    |--------------------------------------------------------------------------
    */

    const timestamp = now();

    const user = {
        id: id('usr'),

        name: 'Verified Requester',

        email: '',

        phone: '',

        aadhaarLast4:
            normalizedLast4,

        /*
         * Storing an Aadhaar reference does NOT mean
         * Aadhaar identity has been verified.
         */
        verified: false,

        role: 'requester',

        createdAt: timestamp,

        updatedAt: timestamp
    };

    users.set(
        user.id,
        user
    );

    return user;
}


// --------------------------------------------------------------------------
// Audit Logs
// --------------------------------------------------------------------------

function addAudit(entry = {}) {
    const timestamp = now();

    const auditEntry = {
        id: id('audit'),

        timestamp,

        ...entry
    };

    auditLogs.push(
        auditEntry
    );

    return auditEntry;
}


// --------------------------------------------------------------------------
// Notifications
// --------------------------------------------------------------------------

function addNotification(
    userId,
    data = {}
) {
    const normalizedUserId =
        normalizeString(userId);

    if (!normalizedUserId) {
        throw Object.assign(
            new Error(
                'User ID is required to create a notification.'
            ),
            {
                status: 400
            }
        );
    }

    const timestamp = now();

    const notification = {
        id: id('ntf'),

        userId:
            normalizedUserId,

        createdAt:
            timestamp,

        updatedAt:
            timestamp,

        read: false,

        ...data
    };

    notifications.set(
        notification.id,
        notification
    );

    return notification;
}


// --------------------------------------------------------------------------
// Repository Export
// --------------------------------------------------------------------------

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

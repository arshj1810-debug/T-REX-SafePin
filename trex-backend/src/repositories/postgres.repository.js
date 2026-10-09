/*
| T-REX / SafePin
| PostgreSQL Repository
|
| This repository provides the database-backed storage layer.
| All functions are asynchronous because PostgreSQL queries are asynchronous.
*/

const crypto = require('crypto');

const db = require('../config/database');

/* ============================================================
   GENERAL HELPERS
   ============================================================ */

function now() {
    return new Date().toISOString();
}

function normalizeString(value) {
    return String(value ?? '').trim();
}

function normalizePhone(value) {
    const digits =
        String(value ?? '').replace(/\D/g, '');

    if (!digits) {
        return '';
    }

    if (digits.length === 10) {
        return `91${digits}`;
    }

    if (
        digits.length === 12 &&
        digits.startsWith('91')
    ) {
        return digits;
    }

    return digits;
}

function normalizeAadhaarLast4(value) {
    const digits =
        String(value ?? '').replace(/\D/g, '');

    if (!digits) {
        return '';
    }

    return digits.slice(-4);
}

function randomId(prefix) {
    return `${prefix}_${crypto.randomUUID()}`;
}

function caseId() {
    const year =
        new Date().getFullYear();

    const number =
        crypto
            .randomInt(0, 1000000)
            .toString()
            .padStart(6, '0');

    return `${year}-${number}`;
}

/* ============================================================
   ROW MAPPERS
   ============================================================ */

function mapUser(row) {
    if (!row) {
        return null;
    }

    return {
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        aadhaarLast4:
            row.aadhaar_last4,
        verified: row.verified,
        role: row.role,

        createdAt:
            row.created_at
                ? new Date(
                      row.created_at
                  ).toISOString()
                : null,

        updatedAt:
            row.updated_at
                ? new Date(
                      row.updated_at
                  ).toISOString()
                : null
    };
}

function mapCase(row) {
    if (!row) {
        return null;
    }

    return {
        caseId: row.case_id,
        userId: row.user_id,
        documentName:
            row.document_name,
        action: row.action,
        reason: row.reason,
        status: row.status,
        statusLabel:
            row.status_label,
        timeline:
            row.timeline || [],

        createdAt:
            row.created_at
                ? new Date(
                      row.created_at
                  ).toISOString()
                : null,

        updatedAt:
            row.updated_at
                ? new Date(
                      row.updated_at
                  ).toISOString()
                : null
    };
}

function mapRequest(row) {
    if (!row) {
        return null;
    }

    return {
        requestId:
            row.request_id,
        caseId:
            row.case_id,
        userId:
            row.user_id,
        service:
            row.service,
        action:
            row.action,
        status:
            row.status,
        statusLabel:
            row.status_label,

        createdAt:
            row.created_at
                ? new Date(
                      row.created_at
                  ).toISOString()
                : null,

        updatedAt:
            row.updated_at
                ? new Date(
                      row.updated_at
                  ).toISOString()
                : null
    };
}

function mapDocument(row) {
    if (!row) {
        return null;
    }

    return {
        documentId:
            row.document_id,
        caseId:
            row.case_id,
        userId:
            row.user_id,
        originalName:
            row.original_name,
        filename:
            row.filename,
        mimeType:
            row.mime_type,
        size:
            Number(row.size),
        status:
            row.status,
        statusLabel:
            row.status_label,

        uploadedAt:
            row.uploaded_at
                ? new Date(
                      row.uploaded_at
                  ).toISOString()
                : null
    };
}

function mapNotification(row) {
    if (!row) {
        return null;
    }

    return {
        notificationId:
            row.notification_id,
        userId:
            row.user_id,
        type:
            row.type,
        icon:
            row.icon,
        title:
            row.title,
        message:
            row.message,
        caseId:
            row.case_id,
        priority:
            row.priority,
        read:
            row.read,

        createdAt:
            row.created_at
                ? new Date(
                      row.created_at
                  ).toISOString()
                : null
    };
}

function mapProtection(row) {
    if (!row) {
        return {
            active: false,
            activatedAt: null,
            updatedAt: null
        };
    }

    return {
        active:
            row.active === true,

        activatedAt:
            row.activated_at
                ? new Date(
                      row.activated_at
                  ).toISOString()
                : null,

        updatedAt:
            row.updated_at
                ? new Date(
                      row.updated_at
                  ).toISOString()
                : null
    };
}

function mapVerificationSession(row) {
    if (!row) {
        return null;
    }

    return {
        id: row.id,
        userId:
            row.user_id,
        phone:
            row.phone,
        provider:
            row.provider,
        channel:
            row.channel,
        providerSessionId:
            row.provider_session_id,

        expiresAt:
            row.expires_at
                ? new Date(
                      row.expires_at
                  ).toISOString()
                : null,

        createdAt:
            row.created_at
                ? new Date(
                      row.created_at
                  ).toISOString()
                : null,

        usedAt:
            row.used_at
                ? new Date(
                      row.used_at
                  ).toISOString()
                : null
    };
}

/* ============================================================
   USERS
   ============================================================ */

async function findUserById(userId) {
    const result =
        await db.query(
            `
            SELECT
                id,
                name,
                email,
                phone,
                aadhaar_last4,
                verified,
                role,
                created_at,
                updated_at
            FROM users
            WHERE id = $1
            LIMIT 1
            `,
            [userId]
        );

    return mapUser(
        result.rows[0]
    );
}

async function findUserByPhone(phone) {
    const normalizedPhone =
        normalizePhone(phone);

    if (!normalizedPhone) {
        return null;
    }

    const result =
        await db.query(
            `
            SELECT
                id,
                name,
                email,
                phone,
                aadhaar_last4,
                verified,
                role,
                created_at,
                updated_at
            FROM users
            WHERE phone = $1
            LIMIT 1
            `,
            [normalizedPhone]
        );

    return mapUser(
        result.rows[0]
    );
}

async function findOrCreatePhoneUser(
    phone
) {
    const normalizedPhone =
        normalizePhone(phone);

    if (!normalizedPhone) {
        throw Object.assign(
            new Error(
                'Valid phone number is required.'
            ),
            { status: 400 }
        );
    }

    const existing =
        await findUserByPhone(
            normalizedPhone
        );

    if (existing) {
        return existing;
    }

    const userId =
        randomId('usr');

    const result =
        await db.query(
            `
            INSERT INTO users (
                id,
                name,
                email,
                phone,
                verified,
                role
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6
            )
            RETURNING
                id,
                name,
                email,
                phone,
                aadhaar_last4,
                verified,
                role,
                created_at,
                updated_at
            `,
            [
                userId,
                'Verified Requester',
                '',
                normalizedPhone,
                false,
                'requester'
            ]
        );

    return mapUser(
        result.rows[0]
    );
}

async function findOrCreateUser(
    data = {}
) {
    const userId =
        normalizeString(data.id);

    const phone =
        normalizePhone(data.phone);

    const aadhaarLast4 =
        normalizeAadhaarLast4(
            data.aadhaarLast4
        );

    if (userId) {
        const existingById =
            await findUserById(
                userId
            );

        if (existingById) {
            return existingById;
        }
    }

    if (phone) {
        const existingByPhone =
            await findUserByPhone(
                phone
            );

        if (existingByPhone) {
            return existingByPhone;
        }
    }

    /*
     * The current database schema requires phone to be unique
     * and non-null. Therefore this helper is intended primarily
     * for phone-based users.
     */

    if (!phone) {
        throw Object.assign(
            new Error(
                'Phone number is required to create a user.'
            ),
            { status: 400 }
        );
    }

    const finalUserId =
        userId ||
        randomId('usr');

    const result =
        await db.query(
            `
            INSERT INTO users (
                id,
                name,
                email,
                phone,
                aadhaar_last4,
                verified,
                role
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                NULLIF($5, ''),
                $6,
                $7
            )
            RETURNING
                id,
                name,
                email,
                phone,
                aadhaar_last4,
                verified,
                role,
                created_at,
                updated_at
            `,
            [
                finalUserId,

                normalizeString(
                    data.name
                ) ||
                    'Verified Requester',

                normalizeString(
                    data.email
                ),

                phone,

                aadhaarLast4,

                Boolean(
                    data.verified
                ),

                normalizeString(
                    data.role
                ) ||
                    'requester'
            ]
        );

    return mapUser(
        result.rows[0]
    );
}

async function updateUser(
    userId,
    data = {}
) {
    const name =
        normalizeString(
            data.name
        );

    const email =
        normalizeString(
            data.email
        );

    const phone =
        normalizePhone(
            data.phone
        );

    const existing =
        await findUserById(
            userId
        );

    if (!existing) {
        throw Object.assign(
            new Error(
                'User not found.'
            ),
            { status: 404 }
        );
    }

    const finalName =
        name || existing.name;

    const finalEmail =
        email || existing.email;

    const finalPhone =
        phone || existing.phone;

    const result =
        await db.query(
            `
            UPDATE users
            SET
                name = $2,
                email = $3,
                phone = $4,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING
                id,
                name,
                email,
                phone,
                aadhaar_last4,
                verified,
                role,
                created_at,
                updated_at
            `,
            [
                userId,
                finalName,
                finalEmail,
                finalPhone
            ]
        );

    return mapUser(
        result.rows[0]
    );
}

async function markUserVerified(
    userId
) {
    const result =
        await db.query(
            `
            UPDATE users
            SET
                verified = TRUE,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING
                id,
                name,
                email,
                phone,
                aadhaar_last4,
                verified,
                role,
                created_at,
                updated_at
            `,
            [userId]
        );

    return mapUser(
        result.rows[0]
    );
}

/* ============================================================
   VERIFICATION SESSIONS
   ============================================================ */

async function createVerificationSession(
    data = {}
) {
    const sessionId =
        normalizeString(data.id) ||
        randomId('verification');

    const result =
        await db.query(
            `
            INSERT INTO verification_sessions (
                id,
                user_id,
                phone,
                provider,
                channel,
                provider_session_id,
                expires_at
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7
            )
            RETURNING *
            `,
            [
                sessionId,

                data.userId ||
                    null,

                normalizePhone(
                    data.phone
                ),

                data.provider ||
                    '2factor',

                data.channel ||
                    'sms',

                data.providerSessionId ||
                    null,

                data.expiresAt
            ]
        );

    return mapVerificationSession(
        result.rows[0]
    );
}

async function findVerificationSession(
    sessionId
) {
    const result =
        await db.query(
            `
            SELECT *
            FROM verification_sessions
            WHERE id = $1
            LIMIT 1
            `,
            [sessionId]
        );

    return mapVerificationSession(
        result.rows[0]
    );
}

/*
 * Marks an OTP session as consumed.
 *
 * When userId is supplied, the session is also linked to
 * the authenticated PostgreSQL user. This is necessary
 * because the user may not exist yet when the OTP is first
 * requested.
 */
async function markVerificationSessionUsed(
    sessionId,
    userId = null
) {
    const result =
        await db.query(
            `
            UPDATE verification_sessions
            SET
                used_at = CURRENT_TIMESTAMP,
                user_id =
                    COALESCE(
                        $2,
                        user_id
                    )
            WHERE id = $1
            RETURNING *
            `,
            [
                sessionId,
                userId || null
            ]
        );

    return mapVerificationSession(
        result.rows[0]
    );
}

/* ============================================================
   CASES
   ============================================================ */

async function createCase(
    data = {}
) {
    let generatedCaseId =
        normalizeString(
            data.caseId
        );

    if (!generatedCaseId) {
        generatedCaseId =
            caseId();
    }

    const result =
        await db.query(
            `
            INSERT INTO cases (
                case_id,
                user_id,
                document_name,
                action,
                reason,
                status,
                status_label,
                timeline
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8::jsonb
            )
            RETURNING *
            `,
            [
                generatedCaseId,
                data.userId,
                data.documentName,
                data.action,
                data.reason,
                data.status ||
                    'UNDER_VERIFICATION',
                data.statusLabel ||
                    'Under Verification',
                JSON.stringify(
                    data.timeline || []
                )
            ]
        );

    return mapCase(
        result.rows[0]
    );
}

async function findCaseById(
    caseIdValue
) {
    const result =
        await db.query(
            `
            SELECT *
            FROM cases
            WHERE case_id = $1
            LIMIT 1
            `,
            [caseIdValue]
        );

    return mapCase(
        result.rows[0]
    );
}

async function listCasesByUser(
    userId
) {
    const result =
        await db.query(
            `
            SELECT *
            FROM cases
            WHERE user_id = $1
            ORDER BY created_at DESC
            `,
            [userId]
        );

    return result.rows.map(
        mapCase
    );
}

async function updateCase(
    caseIdValue,
    data = {}
) {
    const existing =
        await findCaseById(
            caseIdValue
        );

    if (!existing) {
        throw Object.assign(
            new Error(
                'Case not found.'
            ),
            { status: 404 }
        );
    }

    const status =
        data.status ||
        existing.status;

    const statusLabel =
        data.statusLabel ||
        existing.statusLabel;

    const timeline =
        data.timeline ||
        existing.timeline;

    const result =
        await db.query(
            `
            UPDATE cases
            SET
                status = $2,
                status_label = $3,
                timeline = $4::jsonb,
                updated_at = CURRENT_TIMESTAMP
            WHERE case_id = $1
            RETURNING *
            `,
            [
                caseIdValue,
                status,
                statusLabel,
                JSON.stringify(
                    timeline
                )
            ]
        );

    return mapCase(
        result.rows[0]
    );
}

/* ============================================================
   SERVICE REQUESTS
   ============================================================ */

async function createRequest(
    data = {}
) {
    const requestId =
        normalizeString(
            data.requestId
        ) ||
        randomId('req');

    const result =
        await db.query(
            `
            INSERT INTO service_requests (
                request_id,
                case_id,
                user_id,
                service,
                action,
                status,
                status_label
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7
            )
            RETURNING *
            `,
            [
                requestId,
                data.caseId,
                data.userId,
                data.service,
                data.action,
                data.status ||
                    'UNDER_VERIFICATION',
                data.statusLabel ||
                    'Under Verification'
            ]
        );

    return mapRequest(
        result.rows[0]
    );
}

async function findRequestById(
    requestId
) {
    const result =
        await db.query(
            `
            SELECT *
            FROM service_requests
            WHERE request_id = $1
            LIMIT 1
            `,
            [requestId]
        );

    return mapRequest(
        result.rows[0]
    );
}

async function listRequestsByUser(
    userId
) {
    const result =
        await db.query(
            `
            SELECT *
            FROM service_requests
            WHERE user_id = $1
            ORDER BY created_at DESC
            `,
            [userId]
        );

    return result.rows.map(
        mapRequest
    );
}

async function updateRequest(
    requestId,
    data = {}
) {
    const existing =
        await findRequestById(
            requestId
        );

    if (!existing) {
        throw Object.assign(
            new Error(
                'Service request not found.'
            ),
            { status: 404 }
        );
    }

    const status =
        data.status ||
        existing.status;

    const statusLabel =
        data.statusLabel ||
        existing.statusLabel;

    const result =
        await db.query(
            `
            UPDATE service_requests
            SET
                status = $2,
                status_label = $3,
                updated_at = CURRENT_TIMESTAMP
            WHERE request_id = $1
            RETURNING *
            `,
            [
                requestId,
                status,
                statusLabel
            ]
        );

    return mapRequest(
        result.rows[0]
    );
}

/* ============================================================
   DOCUMENTS
   ============================================================ */

async function createDocument(
    data = {}
) {
    const documentId =
        normalizeString(
            data.documentId
        ) ||
        randomId('doc');

    const result =
        await db.query(
            `
            INSERT INTO documents (
                document_id,
                case_id,
                user_id,
                original_name,
                filename,
                mime_type,
                size,
                status,
                status_label
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9
            )
            RETURNING *
            `,
            [
                documentId,
                data.caseId,
                data.userId,
                data.originalName,
                data.filename,
                data.mimeType,
                Number(data.size) || 0,
                data.status ||
                    'UPLOADED',
                data.statusLabel ||
                    'Uploaded'
            ]
        );

    return mapDocument(
        result.rows[0]
    );
}

async function findDocumentById(
    documentId
) {
    const result =
        await db.query(
            `
            SELECT *
            FROM documents
            WHERE document_id = $1
            LIMIT 1
            `,
            [documentId]
        );

    return mapDocument(
        result.rows[0]
    );
}

async function listDocumentsByCase(
    caseIdValue,
    userId
) {
    const result =
        await db.query(
            `
            SELECT *
            FROM documents
            WHERE case_id = $1
              AND user_id = $2
            ORDER BY uploaded_at DESC
            `,
            [
                caseIdValue,
                userId
            ]
        );

    return result.rows.map(
        mapDocument
    );
}

/* ============================================================
   NOTIFICATIONS
   ============================================================ */

async function addNotification(
    data = {}
) {
    const notificationId =
        normalizeString(
            data.notificationId
        ) ||
        randomId('ntf');

    const result =
        await db.query(
            `
            INSERT INTO notifications (
                notification_id,
                user_id,
                type,
                icon,
                title,
                message,
                case_id,
                priority,
                read
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9
            )
            RETURNING *
            `,
            [
                notificationId,
                data.userId,
                data.type ||
                    'general',
                data.icon ||
                    null,
                data.title,
                data.message,
                data.caseId ||
                    null,
                data.priority ||
                    'normal',
                Boolean(
                    data.read
                )
            ]
        );

    return mapNotification(
        result.rows[0]
    );
}

async function listNotifications(
    userId
) {
    const result =
        await db.query(
            `
            SELECT *
            FROM notifications
            WHERE user_id = $1
            ORDER BY created_at DESC
            `,
            [userId]
        );

    return result.rows.map(
        mapNotification
    );
}

async function markNotificationRead(
    userId,
    notificationId
) {
    const result =
        await db.query(
            `
            UPDATE notifications
            SET read = TRUE
            WHERE notification_id = $1
              AND user_id = $2
            RETURNING *
            `,
            [
                notificationId,
                userId
            ]
        );

    if (!result.rows[0]) {
        throw Object.assign(
            new Error(
                'Notification not found.'
            ),
            { status: 404 }
        );
    }

    return mapNotification(
        result.rows[0]
    );
}

/* ============================================================
   SECURITY PROTECTION
   ============================================================ */

async function getProtection(
    userId
) {
    const result =
        await db.query(
            `
            SELECT *
            FROM security_protections
            WHERE user_id = $1
            LIMIT 1
            `,
            [userId]
        );

    return mapProtection(
        result.rows[0]
    );
}

async function setProtection(
    userId,
    active
) {
    const result =
        await db.query(
            `
            INSERT INTO security_protections (
                user_id,
                active,
                activated_at
            )
            VALUES (
                $1,
                $2,
                CASE
                    WHEN $2 = TRUE
                    THEN CURRENT_TIMESTAMP
                    ELSE NULL
                END
            )
            ON CONFLICT (user_id)
            DO UPDATE SET
                active = EXCLUDED.active,
                activated_at =
                    CASE
                        WHEN EXCLUDED.active = TRUE
                        THEN COALESCE(
                            security_protections.activated_at,
                            CURRENT_TIMESTAMP
                        )
                        ELSE NULL
                    END,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
            `,
            [
                userId,
                Boolean(active)
            ]
        );

    return mapProtection(
        result.rows[0]
    );
}

/* ============================================================
   AUDIT LOGS
   ============================================================ */

async function addAudit(
    data = {}
) {
    const auditId =
        normalizeString(
            data.id
        ) ||
        randomId('audit');

    const result =
        await db.query(
            `
            INSERT INTO audit_logs (
                id,
                user_id,
                action,
                entity_type,
                entity_id,
                metadata
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6::jsonb
            )
            RETURNING *
            `,
            [
                auditId,
                data.userId ||
                    null,
                data.action,
                data.entityType ||
                    null,
                data.entityId ||
                    null,
                JSON.stringify(
                    data.metadata || {}
                )
            ]
        );

    return result.rows[0];
}

/* ============================================================
   DATABASE HEALTH
   ============================================================ */

async function healthCheck() {
    const result =
        await db.query(
            `
            SELECT
                current_database() AS database,
                NOW() AS time
            `
        );

    return {
        database:
            result.rows[0]
                .database,

        time:
            new Date(
                result.rows[0].time
            ).toISOString()
    };
}

/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
    now,
    randomId,
    caseId,

    normalizeString,
    normalizePhone,
    normalizeAadhaarLast4,

    findUserById,
    findUserByPhone,
    findOrCreatePhoneUser,
    findOrCreateUser,
    updateUser,
    markUserVerified,

    createVerificationSession,
    findVerificationSession,
    markVerificationSessionUsed,

    createCase,
    findCaseById,
    listCasesByUser,
    updateCase,

    createRequest,
    findRequestById,
    listRequestsByUser,

    createDocument,
    findDocumentById,
    listDocumentsByCase,

    addNotification,
    listNotifications,
    markNotificationRead,

    getProtection,
    setProtection,

    addAudit,

    healthCheck
};
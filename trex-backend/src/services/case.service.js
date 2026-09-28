/*
| T-REX / SafePin
| Case Service
|
| PostgreSQL-backed case management.
*/

const repo = require('../repositories/postgres.repository');

/* ============================================================
   CONSTANTS
   ============================================================ */

const VALID_ACTIONS = new Set([
    'Deactivate',
    'Freeze',
    'Update',
    'Other'
]);

const ACTION_ALIASES = {
    'Protection / Deactivation': 'Deactivate',
    'Freeze / Hold': 'Freeze',
    'Update Details': 'Update',
    'Other / Query': 'Other'
};

/* ============================================================
   HELPERS
   ============================================================ */

function normalizeAction(action) {
    const value = repo.normalizeString(action);

    return ACTION_ALIASES[value] || value;
}

/*
|--------------------------------------------------------------------------
| Build initial case timeline
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Tracking.js expects the progress field to be named `step`.
|
| Example:
| {
|     status: 'SUBMITTED',
|     step: 'COMPLETED'
| }
|
| The previous version used `state`, which caused the frontend
| to treat every timeline item as PENDING.
|
*/

function buildTimeline() {
    const timestamp = repo.now();

    return [
        {
            status: 'SUBMITTED',
            title: 'Request Submitted',
            step: 'COMPLETED',
            timestamp
        },
        {
            status: 'VERIFICATION',
            title: 'Verification Officer Review',
            step: 'IN_PROGRESS',
            timestamp
        },
        {
            status: 'DEPARTMENT',
            title: 'Sent to Concerned Department',
            step: 'PENDING',
            timestamp
        },
        {
            status: 'ACTION',
            title: 'Department Action',
            step: 'PENDING',
            timestamp
        },
        {
            status: 'APPROVAL',
            title: 'Final Approval',
            step: 'PENDING',
            timestamp
        },
        {
            status: 'CLOSED',
            title: 'Case Closed',
            step: 'PENDING',
            timestamp
        }
    ];
}

/* ============================================================
   CREATE CASE
   ============================================================ */

async function createCase(userId, payload = {}) {
    const documentName = repo.normalizeString(
        payload.documentName ||
        payload.service ||
        payload.document
    );

    const action = normalizeAction(
        payload.action
    );

    const reason = repo.normalizeString(
        payload.reason
    );

    if (!userId) {
        throw Object.assign(
            new Error('Authenticated user is required.'),
            { status: 401 }
        );
    }

    if (!documentName) {
        throw Object.assign(
            new Error('Document/service is required.'),
            { status: 400 }
        );
    }

    if (!action) {
        throw Object.assign(
            new Error('Action is required.'),
            { status: 400 }
        );
    }

    if (!VALID_ACTIONS.has(action)) {
        throw Object.assign(
            new Error(
                `Invalid action. Allowed actions: ${[
                    ...VALID_ACTIONS
                ].join(', ')}.`
            ),
            { status: 400 }
        );
    }

    if (!reason) {
        throw Object.assign(
            new Error('Reason is required.'),
            { status: 400 }
        );
    }

    if (reason.length > 1000) {
        throw Object.assign(
            new Error(
                'Reason must not exceed 1000 characters.'
            ),
            { status: 400 }
        );
    }

    /* --------------------------------------------------------
       Verify authenticated user
       -------------------------------------------------------- */

    const user =
        await repo.findUserById(userId);

    if (!user) {
        throw Object.assign(
            new Error('User not found.'),
            { status: 404 }
        );
    }

    /* --------------------------------------------------------
       Create case
       -------------------------------------------------------- */

    const createdCase =
        await repo.createCase({
            caseId: repo.caseId(),
            userId,
            documentName,
            action,
            reason,
            status: 'UNDER_VERIFICATION',
            statusLabel: 'Under Verification',
            timeline: buildTimeline()
        });

    /* --------------------------------------------------------
       Create linked service request
       -------------------------------------------------------- */

    const request =
        await repo.createRequest({
            requestId: repo.randomId('req'),
            caseId: createdCase.caseId,
            userId,
            service: documentName,
            action,
            status: 'UNDER_VERIFICATION',
            statusLabel: 'Under Verification'
        });

    /* --------------------------------------------------------
       Notification
       -------------------------------------------------------- */

    await repo.addNotification({
        notificationId:
            repo.randomId('ntf'),

        userId,

        type: 'request',

        icon: '📋',

        title: 'Protection Request Submitted',

        message:
            `${action} request for ${documentName} ` +
            `has been submitted successfully. ` +
            `Case ID: ${createdCase.caseId}`,

        caseId: createdCase.caseId,

        priority: 'normal',

        read: false
    });

    /* --------------------------------------------------------
       Audit log
       -------------------------------------------------------- */

    await repo.addAudit({
        id: repo.randomId('audit'),

        userId,

        action: 'CASE_CREATED',

        entityType: 'case',

        entityId: createdCase.caseId,

        metadata: {
            service: documentName,
            action
        }
    });

    return {
        case: createdCase,
        request
    };
}

/* ============================================================
   GET CASE
   ============================================================ */

async function getCase(userId, caseId) {
    if (!userId) {
        throw Object.assign(
            new Error('Authenticated user is required.'),
            { status: 401 }
        );
    }

    const requestedCase =
        await repo.findCaseById(caseId);

    if (
        !requestedCase ||
        requestedCase.userId !== userId
    ) {
        throw Object.assign(
            new Error('Case not found.'),
            { status: 404 }
        );
    }

    return requestedCase;
}

/* ============================================================
   LIST CASES
   ============================================================ */

async function listCases(userId) {
    if (!userId) {
        throw Object.assign(
            new Error('Authenticated user is required.'),
            { status: 401 }
        );
    }

    return repo.listCasesByUser(userId);
}

/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
    createCase,
    getCase,
    listCases
};
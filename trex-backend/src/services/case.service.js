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

/*
|------------------------------------------------------------------
| Case workflow
|------------------------------------------------------------------
|
| The case must move through the workflow in order.
|
| UNDER_VERIFICATION
|        ↓
| DEPARTMENT
|        ↓
| ACTION
|        ↓
| APPROVAL
|        ↓
| COMPLETED
|        ↓
| CLOSED
|
*/

const WORKFLOW = [
    'UNDER_VERIFICATION',
    'DEPARTMENT',
    'ACTION',
    'APPROVAL',
    'COMPLETED',
    'CLOSED'
];

const STATUS_LABELS = {
    UNDER_VERIFICATION: 'Under Verification',
    DEPARTMENT: 'Sent to Concerned Department',
    ACTION: 'Department Action',
    APPROVAL: 'Final Approval',
    COMPLETED: 'Completed',
    CLOSED: 'Case Closed'
};

const TIMELINE_TITLES = {
    SUBMITTED: 'Request Submitted',
    VERIFICATION: 'Verification Officer Review',
    DEPARTMENT: 'Sent to Concerned Department',
    ACTION: 'Department Action',
    APPROVAL: 'Final Approval',
    CLOSED: 'Case Closed'
};

/* ============================================================
   HELPERS
   ============================================================ */

function normalizeAction(action) {
    const value = repo.normalizeString(action);

    return ACTION_ALIASES[value] || value;
}

function normalizeStatus(status) {
    return repo
        .normalizeString(status)
        .toUpperCase()
        .replace(/\s+/g, '_');
}

/*
|------------------------------------------------------------------
| Build initial case timeline
|------------------------------------------------------------------
|
| Tracking.js expects the progress field to be named `step`.
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

/*
|------------------------------------------------------------------
| Update timeline according to the current case status
|------------------------------------------------------------------
|
| The timeline contains six visual stages while the case workflow
| contains six backend statuses.
|
| UNDER_VERIFICATION
|   → Verification in progress
|
| DEPARTMENT
|   → Verification completed
|   → Department in progress
|
| ACTION
|   → Department completed
|   → Action in progress
|
| APPROVAL
|   → Action completed
|   → Approval in progress
|
| COMPLETED
|   → Approval completed
|   → Case Closed in progress
|
| CLOSED
|   → Everything completed
|
*/

function updateTimelineForStatus(
    timeline,
    currentStatus,
    timestamp
) {
    const existingTimeline =
        Array.isArray(timeline)
            ? timeline
            : buildTimeline();

    const updatedTimeline =
        existingTimeline.map(
            (item) => ({
                ...item
            })
        );

    /*
     * Always keep Request Submitted completed.
     */
    const submitted =
        updatedTimeline.find(
            (item) =>
                item.status === 'SUBMITTED'
        );

    if (submitted) {
        submitted.step = 'COMPLETED';
    }

    /*
     * Reset workflow stages first.
     */
    for (
        const item of updatedTimeline
    ) {
        if (
            item.status !== 'SUBMITTED'
        ) {
            item.step = 'PENDING';
        }
    }

    /*
     * Verification stage.
     */
    const verification =
        updatedTimeline.find(
            (item) =>
                item.status === 'VERIFICATION'
        );

    /*
     * Department stage.
     */
    const department =
        updatedTimeline.find(
            (item) =>
                item.status === 'DEPARTMENT'
        );

    /*
     * Action stage.
     */
    const action =
        updatedTimeline.find(
            (item) =>
                item.status === 'ACTION'
        );

    /*
     * Approval stage.
     */
    const approval =
        updatedTimeline.find(
            (item) =>
                item.status === 'APPROVAL'
        );

    /*
     * Closed stage.
     */
    const closed =
        updatedTimeline.find(
            (item) =>
                item.status === 'CLOSED'
        );

    switch (currentStatus) {
        case 'UNDER_VERIFICATION':
            if (verification) {
                verification.step =
                    'IN_PROGRESS';
            }
            break;

        case 'DEPARTMENT':
            if (verification) {
                verification.step =
                    'COMPLETED';
                verification.timestamp =
                    timestamp;
            }

            if (department) {
                department.step =
                    'IN_PROGRESS';
                department.timestamp =
                    timestamp;
            }
            break;

        case 'ACTION':
            if (verification) {
                verification.step =
                    'COMPLETED';
            }

            if (department) {
                department.step =
                    'COMPLETED';
                department.timestamp =
                    timestamp;
            }

            if (action) {
                action.step =
                    'IN_PROGRESS';
                action.timestamp =
                    timestamp;
            }
            break;

        case 'APPROVAL':
            if (verification) {
                verification.step =
                    'COMPLETED';
            }

            if (department) {
                department.step =
                    'COMPLETED';
            }

            if (action) {
                action.step =
                    'COMPLETED';
                action.timestamp =
                    timestamp;
            }

            if (approval) {
                approval.step =
                    'IN_PROGRESS';
                approval.timestamp =
                    timestamp;
            }
            break;

        case 'COMPLETED':
            if (verification) {
                verification.step =
                    'COMPLETED';
            }

            if (department) {
                department.step =
                    'COMPLETED';
            }

            if (action) {
                action.step =
                    'COMPLETED';
            }

            if (approval) {
                approval.step =
                    'COMPLETED';
                approval.timestamp =
                    timestamp;
            }

            if (closed) {
                closed.step =
                    'IN_PROGRESS';
                closed.timestamp =
                    timestamp;
            }
            break;

        case 'CLOSED':
            if (verification) {
                verification.step =
                    'COMPLETED';
            }

            if (department) {
                department.step =
                    'COMPLETED';
            }

            if (action) {
                action.step =
                    'COMPLETED';
            }

            if (approval) {
                approval.step =
                    'COMPLETED';
            }

            if (closed) {
                closed.step =
                    'COMPLETED';
                closed.timestamp =
                    timestamp;
            }
            break;

        default:
            break;
    }

    return updatedTimeline;
}

/*
|------------------------------------------------------------------
| Get linked service request
|------------------------------------------------------------------
*/

async function getLinkedRequest(
    userId,
    caseId
) {
    const requests =
        await repo.listRequestsByUser(
            userId
        );

    return (
        requests.find(
            (request) =>
                request.caseId === caseId
        ) || null
    );
}

/* ============================================================
   CREATE CASE
   ============================================================ */

async function createCase(
    userId,
    payload = {}
) {
    const documentName =
        repo.normalizeString(
            payload.documentName ||
            payload.service ||
            payload.document
        );

    const action =
        normalizeAction(
            payload.action
        );

    const reason =
        repo.normalizeString(
            payload.reason
        );

    if (!userId) {
        throw Object.assign(
            new Error(
                'Authenticated user is required.'
            ),
            { status: 401 }
        );
    }

    if (!documentName) {
        throw Object.assign(
            new Error(
                'Document/service is required.'
            ),
            { status: 400 }
        );
    }

    if (!action) {
        throw Object.assign(
            new Error(
                'Action is required.'
            ),
            { status: 400 }
        );
    }

    if (
        !VALID_ACTIONS.has(action)
    ) {
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
            new Error(
                'Reason is required.'
            ),
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
        await repo.findUserById(
            userId
        );

    if (!user) {
        throw Object.assign(
            new Error(
                'User not found.'
            ),
            { status: 404 }
        );
    }

    /* --------------------------------------------------------
       Create case
       -------------------------------------------------------- */

    const createdCase =
        await repo.createCase({
            caseId:
                repo.caseId(),

            userId,

            documentName,

            action,

            reason,

            status:
                'UNDER_VERIFICATION',

            statusLabel:
                'Under Verification',

            timeline:
                buildTimeline()
        });

    /* --------------------------------------------------------
       Create linked service request
       -------------------------------------------------------- */

    const request =
        await repo.createRequest({
            requestId:
                repo.randomId('req'),

            caseId:
                createdCase.caseId,

            userId,

            service:
                documentName,

            action,

            status:
                'UNDER_VERIFICATION',

            statusLabel:
                'Under Verification'
        });

    /* --------------------------------------------------------
       Notification
       -------------------------------------------------------- */

    await repo.addNotification({
        notificationId:
            repo.randomId('ntf'),

        userId,

        type:
            'request',

        icon:
            '📋',

        title:
            'Protection Request Submitted',

        message:
            `${action} request for ${documentName} ` +
            `has been submitted successfully. ` +
            `Case ID: ${createdCase.caseId}`,

        caseId:
            createdCase.caseId,

        priority:
            'normal',

        read:
            false
    });

    /* --------------------------------------------------------
       Audit log
       -------------------------------------------------------- */

    await repo.addAudit({
        id:
            repo.randomId('audit'),

        userId,

        action:
            'CASE_CREATED',

        entityType:
            'case',

        entityId:
            createdCase.caseId,

        metadata: {
            service:
                documentName,

            action
        }
    });

    return {
        case:
            createdCase,

        request
    };
}

/* ============================================================
   UPDATE CASE STATUS
   ============================================================ */

async function updateCaseStatus(
    userId,
    caseId,
    payload = {}
) {
    if (!userId) {
        throw Object.assign(
            new Error(
                'Authenticated user is required.'
            ),
            { status: 401 }
        );
    }

    const normalizedCaseId =
        repo.normalizeString(
            caseId
        );

    if (!normalizedCaseId) {
        throw Object.assign(
            new Error(
                'Case ID is required.'
            ),
            { status: 400 }
        );
    }

    /*
     * Accept either:
     *
     * {
     *     status: "DEPARTMENT"
     * }
     *
     * or:
     *
     * {
     *     nextStatus: "DEPARTMENT"
     * }
     */
    const requestedStatus =
        normalizeStatus(
            payload.status ||
            payload.nextStatus
        );

    if (!requestedStatus) {
        throw Object.assign(
            new Error(
                'Next case status is required.'
            ),
            { status: 400 }
        );
    }

    if (
        !STATUS_LABELS[
            requestedStatus
        ]
    ) {
        throw Object.assign(
            new Error(
                `Invalid case status. Allowed statuses: ${WORKFLOW.join(', ')}.`
            ),
            { status: 400 }
        );
    }

    /* --------------------------------------------------------
       Find case
       -------------------------------------------------------- */

    const existingCase =
        await repo.findCaseById(
            normalizedCaseId
        );

    if (
        !existingCase ||
        existingCase.userId !== userId
    ) {
        throw Object.assign(
            new Error(
                'Case not found.'
            ),
            { status: 404 }
        );
    }

    const currentStatus =
        normalizeStatus(
            existingCase.status
        );

    /* --------------------------------------------------------
       Already closed
       -------------------------------------------------------- */

    if (
        currentStatus === 'CLOSED'
    ) {
        throw Object.assign(
            new Error(
                'This case is already closed.'
            ),
            { status: 400 }
        );
    }

    /* --------------------------------------------------------
       Find workflow positions
       -------------------------------------------------------- */

    const currentIndex =
        WORKFLOW.indexOf(
            currentStatus
        );

    const requestedIndex =
        WORKFLOW.indexOf(
            requestedStatus
        );

    if (
        currentIndex === -1
    ) {
        throw Object.assign(
            new Error(
                `Current case status "${currentStatus}" is not a valid workflow status.`
            ),
            { status: 500 }
        );
    }

    if (
        requestedIndex === -1
    ) {
        throw Object.assign(
            new Error(
                `Requested case status "${requestedStatus}" is not a valid workflow status.`
            ),
            { status: 400 }
        );
    }

    /*
     * Only the immediate next stage is allowed.
     *
     * This prevents:
     *
     * UNDER_VERIFICATION
     *        ↓
     * CLOSED
     *
     * and forces the case through every stage.
     */
    if (
        requestedIndex !==
        currentIndex + 1
    ) {
        throw Object.assign(
            new Error(
                `Invalid status transition: ${currentStatus} → ${requestedStatus}. ` +
                `The case must move to ${WORKFLOW[currentIndex + 1]}.`
            ),
            { status: 400 }
        );
    }

    /* --------------------------------------------------------
       Find linked service request
       -------------------------------------------------------- */

    const linkedRequest =
        await getLinkedRequest(
            userId,
            normalizedCaseId
        );

    if (!linkedRequest) {
        throw Object.assign(
            new Error(
                'Linked service request not found for this case.'
            ),
            { status: 404 }
        );
    }

    /* --------------------------------------------------------
       Build new timeline
       -------------------------------------------------------- */

    const timestamp =
        repo.now();

    const updatedTimeline =
        updateTimelineForStatus(
            existingCase.timeline,
            requestedStatus,
            timestamp
        );

    /* --------------------------------------------------------
       Update case
       -------------------------------------------------------- */

    const updatedCase =
        await repo.updateCase(
            normalizedCaseId,
            {
                status:
                    requestedStatus,

                statusLabel:
                    STATUS_LABELS[
                        requestedStatus
                    ],

                timeline:
                    updatedTimeline
            }
        );

    /* --------------------------------------------------------
       Update linked service request
       -------------------------------------------------------- */

    const updatedRequest =
        await repo.updateRequest(
            linkedRequest.requestId,
            {
                status:
                    requestedStatus,

                statusLabel:
                    STATUS_LABELS[
                        requestedStatus
                    ]
            }
        );

    /* --------------------------------------------------------
       Notification
       -------------------------------------------------------- */

    const notificationMessages = {
        DEPARTMENT:
            'Your request has been sent to the concerned department.',

        ACTION:
            'The concerned department has started processing your request.',

        APPROVAL:
            'Your request has reached the final approval stage.',

        COMPLETED:
            'Your request has been completed and is awaiting case closure.',

        CLOSED:
            'Your T-REX request has been successfully closed.'
    };

    await repo.addNotification({
        notificationId:
            repo.randomId('ntf'),

        userId,

        type:
            'request',

        icon:
            requestedStatus === 'CLOSED'
                ? '✅'
                : '🔄',

        title:
            `Request Status Updated — ${STATUS_LABELS[requestedStatus]}`,

        message:
            notificationMessages[
                requestedStatus
            ] ||
            `Your case ${normalizedCaseId} ` +
            `has moved to ${STATUS_LABELS[requestedStatus]}.`,

        caseId:
            normalizedCaseId,

        priority:
            requestedStatus === 'CLOSED'
                ? 'normal'
                : 'normal',

        read:
            false
    });

    /* --------------------------------------------------------
       Audit log
       -------------------------------------------------------- */

    await repo.addAudit({
        id:
            repo.randomId('audit'),

        userId,

        action:
            'CASE_STATUS_UPDATED',

        entityType:
            'case',

        entityId:
            normalizedCaseId,

        metadata: {
            previousStatus:
                currentStatus,

            newStatus:
                requestedStatus,

            statusLabel:
                STATUS_LABELS[
                    requestedStatus
                ],

            requestId:
                updatedRequest.requestId
        }
    });

    return {
        case:
            updatedCase,

        request:
            updatedRequest,

        previousStatus:
            currentStatus,

        currentStatus:
            requestedStatus
    };
}

/* ============================================================
   GET CASE
   ============================================================ */

async function getCase(
    userId,
    caseId
) {
    if (!userId) {
        throw Object.assign(
            new Error(
                'Authenticated user is required.'
            ),
            { status: 401 }
        );
    }

    const requestedCase =
        await repo.findCaseById(
            caseId
        );

    if (
        !requestedCase ||
        requestedCase.userId !== userId
    ) {
        throw Object.assign(
            new Error(
                'Case not found.'
            ),
            { status: 404 }
        );
    }

    return requestedCase;
}

/* ============================================================
   LIST CASES
   ============================================================ */

async function listCases(
    userId
) {
    if (!userId) {
        throw Object.assign(
            new Error(
                'Authenticated user is required.'
            ),
            { status: 401 }
        );
    }

    return repo.listCasesByUser(
        userId
    );
}

/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
    createCase,
    updateCaseStatus,
    getCase,
    listCases
};
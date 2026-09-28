/*
| T-REX / SafePin
| Document Service
|
| PostgreSQL-backed supporting-document management.
*/

const repo = require('../repositories/postgres.repository');

/* ============================================================
   CASE AUTHORIZATION
   ============================================================ */

async function getAuthorizedCase(userId, caseId) {
    if (!userId) {
        throw Object.assign(
            new Error('Authenticated user is required.'),
            { status: 401 }
        );
    }

    if (!caseId) {
        throw Object.assign(
            new Error('Case ID is required.'),
            { status: 400 }
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
   ADD DOCUMENT
   ============================================================ */

async function addDocument(
    userId,
    caseId,
    file
) {
    await getAuthorizedCase(
        userId,
        caseId
    );

    if (!file) {
        throw Object.assign(
            new Error(
                'Supporting document is required.'
            ),
            { status: 400 }
        );
    }

    const document =
        await repo.createDocument({
            documentId:
                repo.randomId('doc'),

            caseId,

            userId,

            originalName:
                file.originalname,

            filename:
                file.filename,

            mimeType:
                file.mimetype,

            size:
                Number(file.size) || 0,

            status:
                'UPLOADED',

            statusLabel:
                'Uploaded'
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
            '📎',

        title:
            'Supporting Document Uploaded',

        message:
            `Supporting document "${file.originalname}" ` +
            `was uploaded for Case ID: ${caseId}`,

        caseId,

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
            'DOCUMENT_UPLOADED',

        entityType:
            'document',

        entityId:
            document.documentId,

        metadata: {
            caseId,

            originalName:
                file.originalname,

            mimeType:
                file.mimetype,

            size:
                Number(file.size) || 0
        }
    });

    return document;
}

/* ============================================================
   LIST DOCUMENTS
   ============================================================ */

async function listDocuments(
    userId,
    caseId
) {
    await getAuthorizedCase(
        userId,
        caseId
    );

    return await repo.listDocumentsByCase(
        caseId,
        userId
    );
}

/* ============================================================
   GET DOCUMENT
   ============================================================ */

async function getDocument(
    userId,
    documentId
) {
    if (!userId) {
        throw Object.assign(
            new Error('Authenticated user is required.'),
            { status: 401 }
        );
    }

    if (!documentId) {
        throw Object.assign(
            new Error('Document ID is required.'),
            { status: 400 }
        );
    }

    const document =
        await repo.findDocumentById(
            documentId
        );

    if (
        !document ||
        document.userId !== userId
    ) {
        throw Object.assign(
            new Error('Document not found.'),
            { status: 404 }
        );
    }

    return document;
}

/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
    addDocument,
    listDocuments,
    getDocument
};

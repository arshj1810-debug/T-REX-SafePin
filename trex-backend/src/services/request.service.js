/*
| T-REX / SafePin
| Request Service
|
| PostgreSQL-backed service request management.
*/

const repo = require('../repositories/postgres.repository');

/* ============================================================
   LIST REQUESTS
   ============================================================ */

async function listRequests(userId) {
    if (!userId) {
        throw Object.assign(
            new Error('Authenticated user is required.'),
            { status: 401 }
        );
    }

    return repo.listRequestsByUser(userId);
}

/* ============================================================
   GET SINGLE REQUEST
   ============================================================ */

async function getRequest(userId, requestId) {
    if (!userId) {
        throw Object.assign(
            new Error('Authenticated user is required.'),
            { status: 401 }
        );
    }

    if (!requestId) {
        throw Object.assign(
            new Error('Request ID is required.'),
            { status: 400 }
        );
    }

    const request =
        await repo.findRequestById(
            requestId
        );

    if (
        !request ||
        request.userId !== userId
    ) {
        throw Object.assign(
            new Error('Request not found.'),
            { status: 404 }
        );
    }

    return request;
}

/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
    listRequests,
    getRequest
};
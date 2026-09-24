const repo = require('../repositories/memory.repository');

function listRequests(userId) {
    return [...repo.requests.values()]
        .filter(request => request.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function getRequest(userId, requestId) {
    const request = repo.requests.get(requestId);

    if (!request || request.userId !== userId) {
        throw Object.assign(
            new Error('Request not found.'),
            { status: 404 }
        );
    }

    return request;
}

module.exports = {
    listRequests,
    getRequest
};
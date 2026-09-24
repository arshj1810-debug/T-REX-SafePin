const repo = require('../repositories/memory.repository');

const VALID_ACTIONS = new Set([
  'Deactivate',
  'Freeze',
  'Update',
  'Other'
]);

function normalizeCaseId(value) {
  return String(value || '').trim();
}

function normalizeAction(value) {
  const action = String(value || '').trim();

  const aliases = {
    'Protection / Deactivation': 'Deactivate',
    'Freeze / Hold': 'Freeze',
    'Update Details': 'Update',
    'Other / Query': 'Other'
  };

  return aliases[action] || action;
}

function createCase(userId, payload = {}) {
  const normalizedUserId = String(userId || '').trim();

  if (!normalizedUserId) {
    throw Object.assign(
      new Error('Authenticated user is required.'),
      { status: 401 }
    );
  }

  const documentName = String(
    payload.service || payload.documentName || ''
  ).trim();

  const action = normalizeAction(payload.action);
  const reason = String(payload.reason || '').trim();

  if (!documentName) {
    throw Object.assign(
      new Error('Document/service is required.'),
      { status: 400 }
    );
  }

  if (!VALID_ACTIONS.has(action)) {
    throw Object.assign(
      new Error('Invalid action.'),
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
      new Error('Reason must be 1000 characters or less.'),
      { status: 400 }
    );
  }

  const cid = normalizeCaseId(repo.caseId());
  const timestamp = repo.now();

  if (!cid) {
    throw Object.assign(
      new Error('Unable to generate a Case ID.'),
      { status: 500 }
    );
  }

  const c = {
    caseId: cid,
    userId: normalizedUserId,
    documentName,
    action,
    reason,
    status: 'UNDER_VERIFICATION',
    statusLabel: 'Under Verification',
    createdAt: timestamp,
    updatedAt: timestamp,
    timeline: [
      {
        step: 1,
        key: 'SUBMITTED',
        title: 'Request Submitted',
        status: 'COMPLETED',
        timestamp
      },
      {
        step: 2,
        key: 'VERIFICATION',
        title: 'Verification Officer Review',
        status: 'IN_PROGRESS',
        timestamp: null
      },
      {
        step: 3,
        key: 'DEPARTMENT',
        title: 'Sent to Concerned Department',
        status: 'PENDING',
        timestamp: null
      },
      {
        step: 4,
        key: 'ACTION',
        title: 'Department Action',
        status: 'PENDING',
        timestamp: null
      },
      {
        step: 5,
        key: 'APPROVAL',
        title: 'Final Approval',
        status: 'PENDING',
        timestamp: null
      },
      {
        step: 6,
        key: 'CLOSED',
        title: 'Case Closed',
        status: 'PENDING',
        timestamp: null
      }
    ]
  };

  repo.cases.set(cid, c);

  if (!repo.cases.has(cid)) {
    throw Object.assign(
      new Error('Case was created but could not be stored.'),
      { status: 500 }
    );
  }

  const request = {
    requestId: repo.id('req'),
    caseId: cid,
    userId: normalizedUserId,
    service: documentName,
    action,
    status: 'UNDER_VERIFICATION',
    statusLabel: 'Under Verification',
    createdAt: timestamp,
    updatedAt: timestamp
  };

  repo.requests.set(request.requestId, request);

  repo.addNotification(normalizedUserId, {
    type: 'request',
    icon: '📋',
    title: 'Protection Request Submitted',
    message:
      `Your ${action} request for ${documentName} has been submitted and is under verification.`,
    caseId: cid,
    priority: 'normal'
  });

  repo.addAudit({
    userId: normalizedUserId,
    action: 'CASE_CREATED',
    entityType: 'CASE',
    entityId: cid,
    metadata: {
      service: documentName,
      action
    }
  });

  console.log('T-REX CASE CREATED:', {
    caseId: cid,
    userId: normalizedUserId,
    service: documentName,
    action,
    repositoryCaseCount: repo.cases.size
  });

  return {
    case: c,
    request
  };
}

function getCase(userId, cid) {
  const normalizedUserId = String(userId || '').trim();
  const normalizedCaseId = normalizeCaseId(cid);

  if (!normalizedCaseId) {
    throw Object.assign(
      new Error('Case ID is required.'),
      { status: 400 }
    );
  }

  const c = repo.cases.get(normalizedCaseId);

  if (!c || String(c.userId) !== normalizedUserId) {
    console.warn('T-REX CASE LOOKUP FAILED:', {
      requestedCaseId: normalizedCaseId,
      authenticatedUserId: normalizedUserId,
      repositoryCaseCount: repo.cases.size,
      availableCaseIds: [...repo.cases.values()].map(item => item.caseId)
    });

    throw Object.assign(
      new Error('Case not found.'),
      { status: 404 }
    );
  }

  return c;
}

function listCases(userId) {
  const normalizedUserId = String(userId || '').trim();

  return [...repo.cases.values()]
    .filter(c => String(c.userId) === normalizedUserId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

module.exports = {
  createCase,
  getCase,
  listCases
};

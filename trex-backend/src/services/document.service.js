const repo = require('../repositories/memory.repository');

function getAuthorizedCase(userId, caseId) {
  const normalizedUserId = String(userId || '').trim();
  const normalizedCaseId = String(caseId || '').trim();
  const c = repo.cases.get(normalizedCaseId);

  if (!c || String(c.userId) !== normalizedUserId) {
    throw Object.assign(
      new Error('Case not found.'),
      { status: 404 }
    );
  }

  return c;
}

function addDocument(userId, caseId, file) {
  const c = getAuthorizedCase(userId, caseId);

  if (!file) {
    throw Object.assign(
      new Error('File is required.'),
      { status: 400 }
    );
  }

  const document = {
    documentId: repo.id('doc'),
    caseId: c.caseId,
    userId: String(userId),
    originalName: file.originalname,
    filename: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    status: 'UPLOADED',
    statusLabel: 'Uploaded',
    uploadedAt: repo.now()
  };

  repo.documents.set(document.documentId, document);

  repo.addNotification(userId, {
    type: 'request',
    icon: '📎',
    title: 'Supporting Document Uploaded',
    message: `${document.originalName} was securely attached to Case ${c.caseId}.`,
    caseId: c.caseId,
    priority: 'normal'
  });

  repo.addAudit({
    userId,
    action: 'DOCUMENT_UPLOADED',
    entityType: 'DOCUMENT',
    entityId: document.documentId,
    metadata: {
      caseId: c.caseId,
      originalName: document.originalName,
      mimeType: document.mimeType,
      size: document.size
    }
  });

  return document;
}

function listDocuments(userId, caseId) {
  getAuthorizedCase(userId, caseId);

  return [...repo.documents.values()]
    .filter(
      d =>
        d.caseId === String(caseId).trim() &&
        String(d.userId) === String(userId).trim()
    )
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

module.exports = {
  addDocument,
  listDocuments
};

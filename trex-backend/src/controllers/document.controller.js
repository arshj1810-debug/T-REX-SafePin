/*
| T-REX / SafePin
| Document Controller
|
| Handles asynchronous PostgreSQL-backed document operations.
*/

const service = require('../services/document.service');

/* ============================================================
   UPLOAD DOCUMENT
   ============================================================ */

async function upload(req, res, next) {
    try {
        const document =
            await service.addDocument(
                req.user.sub,
                req.params.caseId,
                req.file
            );

        return res.status(201).json({
            success: true,
            document
        });
    } catch (error) {
        return next(error);
    }
}

/* ============================================================
   LIST DOCUMENTS
   ============================================================ */

async function list(req, res, next) {
    try {
        const documents =
            await service.listDocuments(
                req.user.sub,
                req.params.caseId
            );

        return res.json({
            success: true,
            documents
        });
    } catch (error) {
        return next(error);
    }
}

/* ============================================================
   GET DOCUMENT
   ============================================================ */

async function get(req, res, next) {
    try {
        const document =
            await service.getDocument(
                req.user.sub,
                req.params.documentId
            );

        return res.json({
            success: true,
            document
        });
    } catch (error) {
        return next(error);
    }
}

/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
    upload,
    list,
    get
};
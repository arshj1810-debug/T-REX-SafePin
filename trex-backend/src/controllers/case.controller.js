/*
| T-REX / SafePin
| Case Controller
|
| Handles asynchronous PostgreSQL-backed case services.
*/

const service = require('../services/case.service');

/* ============================================================
   CREATE CASE
   ============================================================ */

async function create(req, res, next) {
    try {
        const result =
            await service.createCase(
                req.user.sub,
                req.body
            );

        return res.status(201).json({
            success: true,
            ...result
        });
    } catch (error) {
        return next(error);
    }
}

/* ============================================================
   LIST CASES
   ============================================================ */

async function list(req, res, next) {
    try {
        const cases =
            await service.listCases(
                req.user.sub
            );

        return res.json({
            success: true,
            cases
        });
    } catch (error) {
        return next(error);
    }
}

/* ============================================================
   GET SINGLE CASE
   ============================================================ */

async function get(req, res, next) {
    try {
        const requestedCase =
            await service.getCase(
                req.user.sub,
                req.params.caseId
            );

        return res.json({
            success: true,
            case: requestedCase
        });
    } catch (error) {
        return next(error);
    }
}

/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
    create,
    list,
    get
};

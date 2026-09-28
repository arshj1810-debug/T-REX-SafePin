/*
| T-REX / SafePin
| Request Controller
|
| Handles asynchronous PostgreSQL-backed service requests.
*/

const service = require('../services/request.service');

/* ============================================================
   LIST REQUESTS
   ============================================================ */

async function list(req, res, next) {
    try {
        const requests =
            await service.listRequests(
                req.user.sub
            );

        return res.json({
            success: true,
            requests
        });
    } catch (error) {
        return next(error);
    }
}

/* ============================================================
   GET SINGLE REQUEST
   ============================================================ */

async function get(req, res, next) {
    try {
        const request =
            await service.getRequest(
                req.user.sub,
                req.params.requestId
            );

        return res.json({
            success: true,
            request
        });
    } catch (error) {
        return next(error);
    }
}

/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
    list,
    get
};

module.exports = {
    list,
    get
};
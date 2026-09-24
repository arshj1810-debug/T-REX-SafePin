const service = require('../services/request.service');

function list(req, res, next) {
    try {
        res.json({
            success: true,
            requests: service.listRequests(req.user.sub)
        });
    } catch (e) {
        next(e);
    }
}

function get(req, res, next) {
    try {
        res.json({
            success: true,
            request: service.getRequest(
                req.user.sub,
                req.params.requestId
            )
        });
    } catch (e) {
        next(e);
    }
}

module.exports = {
    list,
    get
};
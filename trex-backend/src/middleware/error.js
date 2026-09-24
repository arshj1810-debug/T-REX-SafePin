function notFound(req, res) {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
}

function errorHandler(err, req, res, next) {
    console.error('T-REX API Error:', err);

    const status = Number(err.status) || 500;

    res.status(status).json({
        success: false,
        message: err.message || 'Internal server error.'
    });
}

module.exports = {
    notFound,
    errorHandler
};
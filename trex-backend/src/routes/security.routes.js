const router = require('express').Router();

const auth = require('../middleware/auth');
const c = require('../controllers/security.controller');

router.use(auth);

/*
 * GET /api/security
 * Returns current emergency protection status.
 */
router.get(
    '/',
    c.get
);

/*
 * GET /api/security/protection
 * Existing protection-status endpoint.
 */
router.get(
    '/protection',
    c.get
);

/*
 * POST /api/security/protection
 * Activates emergency protection.
 */
router.post(
    '/protection',
    c.activate
);

module.exports = router;
const router = require('express').Router();

const auth = require('../middleware/auth');
const c = require('../controllers/case.controller');

router.use(auth);

/* ============================================================
   CASE ROUTES
   ============================================================ */

router.post('/', c.create);

router.get('/', c.list);

router.get('/:caseId', c.get);

/*
 * Update the workflow status of a case.
 *
 * Example:
 * PATCH /api/cases/2026-123456/status
 *
 * Body:
 * {
 *     "status": "DEPARTMENT"
 * }
 */
router.patch('/:caseId/status', c.updateStatus);

module.exports = router;
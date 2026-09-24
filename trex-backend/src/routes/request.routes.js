const router = require('express').Router();
const auth = require('../middleware/auth');
const requestController = require('../controllers/request.controller');

router.use(auth);

// Get all requests for the authenticated user
router.get('/', requestController.list);

// Get a single request
router.get('/:requestId', requestController.get);

module.exports = router;
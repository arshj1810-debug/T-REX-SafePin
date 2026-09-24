const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/profile.controller');

router.use(auth);

router.get('/', c.get);
router.patch('/', c.update);

module.exports = router;

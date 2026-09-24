const router=require('express').Router(); const auth=require('../middleware/auth'); const c=require('../controllers/security.controller');
router.use(auth); router.get('/protection',c.get); router.post('/protection',c.activate); module.exports=router;

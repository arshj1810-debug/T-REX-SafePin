const router=require('express').Router(); const auth=require('../middleware/auth'); const c=require('../controllers/notification.controller');
router.use(auth); router.get('/',c.list); router.patch('/:notificationId/read',c.read); module.exports=router;

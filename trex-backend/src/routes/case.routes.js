const router=require('express').Router(); const auth=require('../middleware/auth'); const c=require('../controllers/case.controller');
router.use(auth); router.post('/',c.create); router.get('/',c.list); router.get('/:caseId',c.get); module.exports=router;

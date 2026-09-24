const service = require('../services/notification.service');
function list(req,res,next){try{res.json({success:true,notifications:service.list(req.user.sub)});}catch(e){next(e);}}
function read(req,res,next){try{res.json({success:true,notification:service.markRead(req.user.sub,req.params.notificationId)});}catch(e){next(e);}}
module.exports={list,read};

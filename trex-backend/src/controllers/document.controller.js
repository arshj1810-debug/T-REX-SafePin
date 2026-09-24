const service = require('../services/document.service');
function upload(req,res,next){ try { res.status(201).json({success:true,document:service.addDocument(req.user.sub,req.params.caseId,req.file)}); } catch(e){next(e);} }
function list(req,res,next){ try { res.json({success:true,documents:service.listDocuments(req.user.sub,req.params.caseId)}); } catch(e){next(e);} }
module.exports={upload,list};

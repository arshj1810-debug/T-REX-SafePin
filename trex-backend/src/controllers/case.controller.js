const service = require('../services/case.service');
function create(req,res,next){ try { res.status(201).json({success:true,...service.createCase(req.user.sub, req.body)}); } catch(e){next(e);} }
function list(req,res,next){ try { res.json({success:true,cases:service.listCases(req.user.sub)}); } catch(e){next(e);} }
function get(req,res,next){ try { res.json({success:true,case:service.getCase(req.user.sub, req.params.caseId)}); } catch(e){next(e);} }
module.exports={create,list,get};

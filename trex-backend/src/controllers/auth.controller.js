const service = require("../services/auth.service");

/**
 * POST /api/auth/start
 */
async function start(req, res, next) {
  try {
    const result = await service.startVerification({
      phone: req.body.phone || req.body.mobile,
      mobile: req.body.mobile || req.body.phone,
      userId: req.body.userId || null,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}


/**
 * POST /api/auth/verify-otp
 */
async function verifyOtp(req, res, next) {
  try {
    const result = await service.verifyOtp({
      phone: req.body.phone || req.body.mobile,
      mobile: req.body.mobile || req.body.phone,

      otp: req.body.otp,

      verificationId:
        req.body.verificationId ||
        req.body.sessionId,

      sessionId:
        req.body.sessionId ||
        req.body.verificationId,

      userId: req.body.userId || null,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}


module.exports = {
  start,
  verifyOtp,

  // Compatibility aliases
  startVerification: start,
  verifyOTP: verifyOtp,
};
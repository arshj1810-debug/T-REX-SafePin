const express = require("express");
const authController = require("../controllers/auth.controller");

const router = express.Router();


// ==========================================
// START PHONE OTP
// POST /api/auth/start
// ==========================================
router.post(
  "/start",
  authController.start
);


// ==========================================
// VERIFY PHONE OTP
// POST /api/auth/verify-otp
// ==========================================
router.post(
  "/verify-otp",
  authController.verifyOtp
);


module.exports = router;
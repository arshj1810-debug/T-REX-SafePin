const jwt = require("jsonwebtoken");
const phoneOtpService = require("./phone-otp.service");
const repo = require("../repositories/memory.repository");

const sessions = new Map();

const JWT_SECRET =
  process.env.JWT_SECRET || "dev-only-secret-change-me";

const OTP_PROVIDER =
  String(process.env.PHONE_OTP_PROVIDER_MODE || "2factor")
    .trim()
    .toLowerCase();

/*
|--------------------------------------------------------------------------
| Phone Normalization
|--------------------------------------------------------------------------
*/

function normalizePhone(phone) {
  if (
    typeof phoneOtpService.normalizeMobile ===
    "function"
  ) {
    return phoneOtpService.normalizeMobile(phone);
  }

  const digits =
    String(phone || "").replace(/\D/g, "");

  if (digits.length === 10) {
    return `91${digits}`;
  }

  if (
    digits.length === 12 &&
    digits.startsWith("91")
  ) {
    return digits;
  }

  throw new Error(
    "Please enter a valid Indian mobile number."
  );
}

/*
|--------------------------------------------------------------------------
| JWT
|--------------------------------------------------------------------------
*/

function createToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      phone: user.phone,
      role: user.role || "requester",
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

/*
|--------------------------------------------------------------------------
| START PHONE VERIFICATION
|--------------------------------------------------------------------------
*/

async function startVerification({
  phone,
  mobile,
  userId = null,
}) {
  const rawPhone = phone || mobile;

  if (!rawPhone) {
    throw new Error(
      "Phone number is required."
    );
  }

  const normalizedPhone =
    normalizePhone(rawPhone);

  console.log(
    "Starting phone verification through 2Factor..."
  );

  if (OTP_PROVIDER !== "2factor") {
    throw new Error(
      `Unsupported phone OTP provider: ${OTP_PROVIDER}`
    );
  }

  let phoneResult;

  if (
    typeof phoneOtpService.requestOtp ===
    "function"
  ) {
    phoneResult =
      await phoneOtpService.requestOtp(
        normalizedPhone
      );
  } else if (
    typeof phoneOtpService.startPhoneVerification ===
    "function"
  ) {
    phoneResult =
      await phoneOtpService.startPhoneVerification(
        normalizedPhone
      );
  } else {
    throw new Error(
      "phone-otp.service.js does not export requestOtp or startPhoneVerification."
    );
  }

  if (!phoneResult) {
    throw new Error(
      "2Factor OTP service returned no response."
    );
  }

  if (phoneResult.success === false) {
    throw new Error(
      phoneResult.message ||
        "Unable to start SMS OTP verification."
    );
  }

  const verificationId =
    phoneResult.verificationId ||
    phoneResult.sessionId;

  if (!verificationId) {
    throw new Error(
      "2Factor did not return a verification/session ID."
    );
  }

  const providerSessionId =
    phoneResult.providerSessionId ||
    phoneResult.providerVerificationId ||
    phoneResult.Details ||
    phoneResult.details ||
    null;

  /*
   * Store everything required to verify the OTP later.
   */
  sessions.set(
    verificationId,
    {
      verificationId,

      phone: normalizedPhone,

      userId: userId || null,

      provider:
        phoneResult.provider ||
        "2factor",

      channel:
        phoneResult.channel ||
        "sms",

      providerSessionId,

      createdAt: Date.now(),

      expiresAt:
        Date.now() +
        Number(
          process.env.TWO_FACTOR_OTP_EXPIRY ||
            5
        ) *
          60 *
          1000,
    }
  );

  console.log(
    "Phone verification session created."
  );

  console.log(
    `Verification ID: ${verificationId}`
  );

  console.log("OTP channel: SMS");

  return {
    success: true,

    provider: "2factor",

    providerConnected: true,

    channel: "sms",

    verificationId,

    sessionId: verificationId,

    expiresIn:
      Number(
        process.env.TWO_FACTOR_OTP_EXPIRY ||
          5
      ) * 60,
  };
}

/*
|--------------------------------------------------------------------------
| VERIFY OTP
|--------------------------------------------------------------------------
*/

async function verifyOtp({
  phone,
  mobile,
  otp,
  verificationId,
  sessionId,
  userId,
}) {
  if (!otp) {
    throw new Error(
      "OTP is required."
    );
  }

  const verificationKey =
    verificationId || sessionId;

  if (!verificationKey) {
    throw new Error(
      "Verification ID is required."
    );
  }

  console.log("");
  console.log(
    "=========================================="
  );
  console.log(
    "T-REX OTP VERIFICATION"
  );
  console.log(
    "=========================================="
  );
  console.log(
    `Verification ID: ${verificationKey}`
  );
  console.log(
    "=========================================="
  );

  /*
   * Find the server-side OTP session.
   */
  const session =
    sessions.get(verificationKey);

  if (!session) {
    throw new Error(
      "OTP session not found or expired. Please request a new OTP."
    );
  }

  /*
   * Check OTP session expiry.
   */
  if (
    Date.now() >
    session.expiresAt
  ) {
    sessions.delete(
      verificationKey
    );

    throw new Error(
      "OTP has expired. Please request a new OTP."
    );
  }

  /*
   * IMPORTANT:
   *
   * We use the phone stored in the server-side
   * OTP session. The frontend does not need to
   * send the phone again.
   */
  const sessionPhone =
    session.phone;

  if (!sessionPhone) {
    throw new Error(
      "Phone number is missing from the OTP session."
    );
  }

  const normalizedSessionPhone =
    normalizePhone(
      sessionPhone
    );

  /*
   * If the frontend sends a phone anyway,
   * verify that it matches the session.
   */
  const frontendPhone =
    phone || mobile;

  if (frontendPhone) {
    const normalizedFrontendPhone =
      normalizePhone(
        frontendPhone
      );

    if (
      normalizedFrontendPhone !==
      normalizedSessionPhone
    ) {
      throw new Error(
        "Phone number does not match the OTP session."
      );
    }
  }

  /*
   * Verify provider.
   */
  if (
    session.provider !==
    "2factor"
  ) {
    throw new Error(
      `Unsupported OTP provider: ${session.provider}`
    );
  }

  /*
   * 2Factor reference/session ID.
   */
  if (!session.providerSessionId) {
    throw new Error(
      "2Factor provider session is missing."
    );
  }

  console.log(
    `Phone from OTP session: +${normalizedSessionPhone.slice(
      0,
      5
    )}******`
  );

  console.log(
    `2Factor provider session: ${session.providerSessionId}`
  );

  console.log(
    "Sending OTP to 2Factor for verification..."
  );

  let result;

  /*
   * Call 2Factor verification.
   */
  if (
    typeof phoneOtpService.verifyOtp ===
    "function"
  ) {
    result =
      await phoneOtpService.verifyOtp({
        mobile:
          normalizedSessionPhone,

        phone:
          normalizedSessionPhone,

        otp,

        providerSessionId:
          session.providerSessionId,
      });
  } else if (
    typeof phoneOtpService.verifyPhoneVerification ===
    "function"
  ) {
    result =
      await phoneOtpService.verifyPhoneVerification({
        mobile:
          normalizedSessionPhone,

        phone:
          normalizedSessionPhone,

        otp,

        providerSessionId:
          session.providerSessionId,
      });
  } else {
    throw new Error(
      "phone-otp.service.js does not export an OTP verification function."
    );
  }

  /*
   * Provider verification failed.
   */
  if (
    !result ||
    (
      result.verified === false &&
      result.success === false
    )
  ) {
    throw new Error(
      "OTP verification failed."
    );
  }

  /*
  |--------------------------------------------------------------------------
  | CREATE / FIND USER IN REPOSITORY
  |--------------------------------------------------------------------------
  |
  | THIS IS THE IMPORTANT FIX.
  |
  | Previously we created a user object only in this
  | service. Now we persist the user in the in-memory
  | repository so /api/profile can find it.
  |
  */

  console.log(
    "OTP verified successfully."
  );

  console.log(
    "Creating/finding user in repository..."
  );

  const repositoryUser =
    repo.findOrCreatePhoneUser({
      phone:
        normalizedSessionPhone,

      userId:
        userId ||
        session.userId ||
        null,
    });

  if (!repositoryUser) {
    throw new Error(
      "Unable to create or retrieve authenticated user."
    );
  }

  /*
   * Add requester role for authentication.
   *
   * The repository user is the source of truth
   * for the account.
   */
  repositoryUser.role =
    repositoryUser.role ||
    "requester";

  repositoryUser.verified =
    true;

  repositoryUser.updatedAt =
    repo.now();

  /*
   * Save an authentication audit event.
   */
  repo.addAudit({
    userId:
      repositoryUser.id,

    action:
      "LOGIN_SUCCESS",

    entityType:
      "USER",

    entityId:
      repositoryUser.id,

    metadata: {
      method:
        "SMS_OTP",
      provider:
        "2factor",
    },
  });

  /*
   * The OTP session is one-time-use.
   */
  sessions.delete(
    verificationKey
  );

  /*
   * Create JWT using the REAL repository user ID.
   */
  const user = {
    id:
      repositoryUser.id,

    phone:
      repositoryUser.phone,

    role:
      repositoryUser.role ||
      "requester",
  };

  const token =
    createToken(user);

  console.log("");
  console.log(
    "=========================================="
  );
  console.log(
    "OTP VERIFICATION SUCCESSFUL"
  );
  console.log(
    "=========================================="
  );
  console.log(
    `Repository User ID: ${user.id}`
  );
  console.log(
    `Phone: +${normalizedSessionPhone.slice(
      0,
      5
    )}******`
  );
  console.log(
    `Role: ${user.role}`
  );
  console.log(
    "User saved in memory repository."
  );
  console.log(
    "JWT token created."
  );
  console.log(
    "=========================================="
  );
  console.log("");

  return {
    success: true,

    verified: true,

    token,

    user: {
      id:
        user.id,

      phone:
        user.phone,

      role:
        user.role,
    },
  };
}

/*
|--------------------------------------------------------------------------
| GET CURRENT USER
|--------------------------------------------------------------------------
*/

function getCurrentUser(token) {
  if (!token) {
    throw new Error(
      "Authentication token is required."
    );
  }

  return jwt.verify(
    token,
    JWT_SECRET
  );
}

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  startVerification,

  verifyOtp,

  getCurrentUser,

  startPhoneVerification:
    startVerification,
};
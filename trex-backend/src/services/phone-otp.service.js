const crypto = require("crypto");

const SEND_OTP_BASE_URL =
  process.env.TWO_FACTOR_BASE_URL || "https://2factor.in/API/V1";

const VERIFY_OTP_BASE_URL =
  process.env.TWO_FACTOR_BASE_URL || "https://2factor.in/API/V1";

function normalizeMobile(mobile) {
  const digits = String(mobile || "").replace(/\D/g, "");

  if (!digits) {
    throw new Error("Mobile number is required.");
  }

  if (digits.length === 10) {
    return `91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return digits;
  }

  throw new Error("Please enter a valid Indian mobile number.");
}

function getApiKey() {
  const apiKey = process.env.TWO_FACTOR_API_KEY;

  if (!apiKey) {
    throw new Error("TWO_FACTOR_API_KEY is not configured.");
  }

  return apiKey;
}

async function startPhoneVerification(mobile) {
  const phone = normalizeMobile(mobile);
  const apiKey = getApiKey();

  // IMPORTANT:
  // This endpoint is explicitly SMS.
  // Do NOT change this to VOICE or OBD.
  const url =
    `${SEND_OTP_BASE_URL}/${encodeURIComponent(apiKey)}` +
    `/SMS/${encodeURIComponent(phone)}/AUTOGEN`;

  console.log("");
  console.log("==========================================");
  console.log("2FACTOR SMS OTP REQUEST");
  console.log("==========================================");
  console.log("Provider: 2factor");
  console.log("Channel: SMS ONLY");
  console.log("Endpoint: SMS/AUTOGEN");
  console.log(`Destination: +${phone.slice(0, 5)}******`);
  console.log("==========================================");

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json, text/plain, */*",
    },
  });

  const raw = await response.text();

  console.log("");
  console.log("2Factor raw response:");
  console.log(raw);

  if (!response.ok) {
    throw new Error(
      `2Factor SMS API failed with HTTP ${response.status}: ${raw}`
    );
  }

  let data;

  try {
    data = JSON.parse(raw);
  } catch {
    data = {
      raw,
    };
  }

  console.log("");
  console.log("2Factor parsed response:");
  console.log(data);

  const providerStatus = String(
    data.Status ||
      data.status ||
      data.providerStatus ||
      ""
  ).toLowerCase();

  const providerSessionId =
    data.Details ||
    data.details ||
    data.providerDetails ||
    data.sessionId ||
    data.SessionId ||
    null;

  if (
    providerStatus !== "success" ||
    !providerSessionId
  ) {
    throw new Error(
      `2Factor SMS OTP was not accepted. Response: ${raw}`
    );
  }

  const applicationSessionId = `otp_${crypto.randomUUID()}`;

  console.log("");
  console.log("2Factor SMS request accepted successfully.");
  console.log(`Application OTP session: ${applicationSessionId}`);
  console.log("OTP channel: SMS ONLY");
  console.log(`2Factor provider session: ${providerSessionId}`);
  console.log("");

  return {
    success: true,
    provider: "2factor",
    providerConnected: true,

    // Explicitly record SMS.
    channel: "sms",

    // Our application session.
    sessionId: applicationSessionId,
    verificationId: applicationSessionId,

    // Provider session required for verification.
    providerSessionId,
    providerVerificationId: providerSessionId,

    mobile: phone,
  };
}

async function verifyPhoneVerification({
  mobile,
  otp,
  providerSessionId,
}) {
  const phone = normalizeMobile(mobile);
  const apiKey = getApiKey();

  if (!otp) {
    throw new Error("OTP is required.");
  }

  if (!providerSessionId) {
    throw new Error("2Factor provider session is missing.");
  }

  /*
   * IMPORTANT:
   * Verification is also explicitly SMS.
   *
   * We are NOT using:
   * /VOICE/
   * /OBD/
   * Voice APIs
   */

  const url =
    `${VERIFY_OTP_BASE_URL}/${encodeURIComponent(apiKey)}` +
    `/SMS/VERIFY/` +
    `${encodeURIComponent(providerSessionId)}/` +
    `${encodeURIComponent(String(otp).trim())}`;

  console.log("");
  console.log("==========================================");
  console.log("2FACTOR SMS OTP VERIFICATION");
  console.log("==========================================");
  console.log("Channel: SMS ONLY");
  console.log(`Destination: +${phone.slice(0, 5)}******`);
  console.log("Endpoint: SMS/VERIFY");
  console.log("==========================================");

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json, text/plain, */*",
    },
  });

  const raw = await response.text();

  console.log("");
  console.log("2Factor verification response:");
  console.log(raw);

  if (!response.ok) {
    throw new Error(
      `2Factor SMS verification failed with HTTP ${response.status}: ${raw}`
    );
  }

  let data;

  try {
    data = JSON.parse(raw);
  } catch {
    data = {
      raw,
    };
  }

  const status = String(
    data.Status ||
      data.status ||
      data.providerStatus ||
      ""
  ).toLowerCase();

  const details = String(
    data.Details ||
      data.details ||
      data.message ||
      data.Message ||
      ""
  ).toLowerCase();

  const verified =
    status === "success" ||
    details.includes("success") ||
    details.includes("verified");

  if (!verified) {
    throw new Error(
      data.Details ||
        data.details ||
        data.message ||
        "Invalid OTP."
    );
  }

  return {
    success: true,
    verified: true,
    provider: "2factor",
    channel: "sms",
    mobile: phone,
  };
}

module.exports = {
  normalizeMobile,
  startPhoneVerification,
  verifyPhoneVerification,
};
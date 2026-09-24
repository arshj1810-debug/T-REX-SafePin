/* =========================================================
   T-REX - PROFILE
   Backend Connected Version
   Profile + Statistics + Preferences + Phone OTP
========================================================= */


/* =========================================================
   CONFIGURATION
========================================================= */

const API_BASE_URL =
    "http://localhost:5000/api";


/* =========================================================
   ELEMENTS
========================================================= */

const nameInput =
    document.getElementById("nameInput");

const emailInput =
    document.getElementById("emailInput");

const phoneInput =
    document.getElementById("phoneInput");

const profileName =
    document.getElementById("profileName");

const editActions =
    document.getElementById("editActions");


/* =========================================================
   STATE
========================================================= */

let currentProfile = null;

let phoneVerificationId = null;

let phoneVerificationPhone = null;

let phoneVerificationInProgress = false;


/* =========================================================
   LOCAL STORAGE
========================================================= */

const PREFERENCES_KEY =
    "safepinPreferences";


/* =========================================================
   AUTHENTICATION
========================================================= */

function getAuthToken() {

    return sessionStorage.getItem(
        "trexToken"
    );

}


function clearAuthentication() {

    sessionStorage.removeItem(
        "trexToken"
    );

    sessionStorage.removeItem(
        "trexVerificationId"
    );

    sessionStorage.removeItem(
        "trexUserId"
    );

    sessionStorage.removeItem(
        "verificationId"
    );

    sessionStorage.removeItem(
        "userId"
    );

}


/* =========================================================
   BACKEND API HELPER
========================================================= */

async function apiRequest(
    endpoint,
    options = {}
) {

    const token =
        getAuthToken();


    if (!token) {

        redirectToLogin();

        throw new Error(
            "Your session has expired. Please log in again."
        );

    }


    const headers = {

        ...(options.headers || {}),

        Authorization:
            `Bearer ${token}`

    };


    if (
        options.body &&
        !headers["Content-Type"]
    ) {

        headers["Content-Type"] =
            "application/json";

    }


    let response;


    try {

        response =
            await fetch(
                `${API_BASE_URL}${endpoint}`,
                {
                    ...options,
                    headers
                }
            );

    } catch (error) {

        console.error(
            "T-REX backend connection failed:",
            error
        );

        throw new Error(
            "Unable to connect to the T-REX backend."
        );

    }


    const rawResponse =
        await response.text();


    let result = {};


    if (rawResponse) {

        try {

            result =
                JSON.parse(
                    rawResponse
                );

        } catch (error) {

            console.error(
                "Invalid backend response:",
                rawResponse
            );

            throw new Error(
                "The T-REX backend returned an invalid response."
            );

        }

    }


    if (response.status === 401) {

        clearAuthentication();

        alert(
            "Your session has expired. Please log in again."
        );

        redirectToLogin();

        throw new Error(
            "Authentication expired."
        );

    }


    if (
        !response.ok ||
        result.success === false
    ) {

        throw new Error(
            result.message ||
            result.error ||
            "T-REX backend request failed."
        );

    }


    return result;

}


/* =========================================================
   PUBLIC AUTH API HELPER
   Used only for OTP endpoints.
========================================================= */

async function publicApiRequest(
    endpoint,
    options = {}
) {

    const headers = {

        ...(options.headers || {})

    };


    if (
        options.body &&
        !headers["Content-Type"]
    ) {

        headers["Content-Type"] =
            "application/json";

    }


    let response;


    try {

        response =
            await fetch(
                `${API_BASE_URL}${endpoint}`,
                {
                    ...options,
                    headers
                }
            );

    } catch (error) {

        console.error(
            "T-REX OTP backend connection failed:",
            error
        );

        throw new Error(
            "Unable to connect to the T-REX OTP service."
        );

    }


    const rawResponse =
        await response.text();


    let result = {};


    if (rawResponse) {

        try {

            result =
                JSON.parse(
                    rawResponse
                );

        } catch (error) {

            console.error(
                "Invalid OTP backend response:",
                rawResponse
            );

            throw new Error(
                "The OTP service returned an invalid response."
            );

        }

    }


    if (
        !response.ok ||
        result.success === false
    ) {

        throw new Error(
            result.message ||
            result.error ||
            "Unable to process OTP request."
        );

    }


    return result;

}


/* =========================================================
   LOGIN REDIRECT
========================================================= */

function redirectToLogin() {

    window.location.href =
        "../Login/Login.html";

}


/* =========================================================
   INITIALS
========================================================= */

function getInitials(name) {

    const value =
        String(
            name || ""
        ).trim();


    if (!value) {
        return "TR";
    }


    const parts =
        value
            .split(/\s+/)
            .filter(Boolean);


    if (parts.length === 1) {

        return parts[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();

}


/* =========================================================
   PROFILE RESPONSE NORMALIZER
========================================================= */

function extractProfile(result) {

    return (
        result?.user ||
        result?.profile ||
        result?.data ||
        null
    );

}


/* =========================================================
   LOAD PROFILE
========================================================= */

async function loadProfile() {

    console.log(
        "Loading T-REX profile..."
    );


    try {

        const result =
            await apiRequest(
                "/profile"
            );


        const profile =
            extractProfile(
                result
            );


        if (!profile) {

            throw new Error(
                "Profile information was not returned by the backend."
            );

        }


        currentProfile =
            profile;


        console.log(
            "T-REX profile loaded successfully:",
            profile
        );


        if (nameInput) {

            nameInput.value =
                profile.name || "";

        }


        if (emailInput) {

            emailInput.value =
                profile.email || "";

        }


        if (phoneInput) {

            phoneInput.value =
                profile.phone || "";

        }


        updateProfileUI(
            profile
        );


        loadPreferences();


        await calculateStatistics();


        disableEditing();


    } catch (error) {

        console.error(
            "Unable to load T-REX profile:",
            error
        );


        if (profileName) {

            profileName.textContent =
                "Unable to load profile";

        }


        alert(
            error.message ||
            "Unable to load your profile."
        );

    }

}


/* =========================================================
   UPDATE PROFILE UI
========================================================= */

function updateProfileUI(
    profile
) {

    if (!profile) {
        return;
    }


    const name =
        String(
            profile.name ||
            "Verified Requester"
        ).trim();


    const initials =
        getInitials(
            name
        );


    if (profileName) {

        profileName.textContent =
            name;

    }


    const sidebarName =
        document.getElementById(
            "profileSidebarName"
        );


    if (sidebarName) {

        sidebarName.textContent =
            name;

    }


    const sidebarAvatar =
        document.getElementById(
            "profileSidebarAvatar"
        );


    if (sidebarAvatar) {

        sidebarAvatar.textContent =
            initials;

    }


    const topName =
        document.getElementById(
            "profileTopName"
        );


    if (topName) {

        topName.textContent =
            name;

    }


    const topAvatar =
        document.getElementById(
            "profileTopAvatar"
        );


    if (topAvatar) {

        topAvatar.textContent =
            initials;

    }


    const heroAvatar =
        document.getElementById(
            "profileHeroAvatar"
        );


    if (heroAvatar) {

        heroAvatar.textContent =
            initials;

    }


    document
        .querySelectorAll(
            ".user-box strong, .top-profile strong"
        )
        .forEach(
            element => {

                element.textContent =
                    name;

            }
        );


    document
        .querySelectorAll(
            ".user-box .avatar, .top-profile .small-avatar"
        )
        .forEach(
            element => {

                element.textContent =
                    initials;

            }
        );


    const safePinId =
        document.getElementById(
            "safePinId"
        );


    if (safePinId) {

        safePinId.textContent =
            createSafePinId(
                profile
            );

    }


    const profileRole =
        document.getElementById(
            "profileRole"
        );


    if (
        profileRole &&
        profile.role
    ) {

        profileRole.value =
            profile.role;

    }


    updateAccountStatus(
        profile
    );

}


/* =========================================================
   SAFE PIN ID
========================================================= */

function createSafePinId(
    profile
) {

    if (profile.safePinId) {

        return String(
            profile.safePinId
        );

    }


    if (profile.id) {

        const id =
            String(
                profile.id
            )
            .replace(
                /^usr_/i,
                ""
            )
            .replace(
                /-/g,
                ""
            )
            .substring(
                0,
                8
            )
            .toUpperCase();


        if (id) {

            return `SP-USR-${id}`;

        }

    }


    return "SP-PENDING";

}


/* =========================================================
   ACCOUNT STATUS
========================================================= */

function updateAccountStatus(
    profile
) {

    const verified =
        profile.verified !== false;


    const mobileVerified =
        Boolean(
            profile.phone &&
            String(
                profile.phone
            ).trim() &&
            profile.phoneVerified !== false
        );


    const identityIcon =
        document.getElementById(
            "identityStatusIcon"
        );


    const identityTitle =
        document.getElementById(
            "identityStatusTitle"
        );


    const identityText =
        document.getElementById(
            "identityStatusText"
        );


    if (verified) {

        if (identityIcon) {
            identityIcon.textContent = "✓";
        }

        if (identityTitle) {
            identityTitle.textContent =
                "Identity Verified";
        }

        if (identityText) {
            identityText.textContent =
                "Verification completed";
        }

    } else {

        if (identityIcon) {
            identityIcon.textContent = "!";
        }

        if (identityTitle) {
            identityTitle.textContent =
                "Identity Verification Pending";
        }

        if (identityText) {
            identityText.textContent =
                "Additional verification is required";
        }

    }


    const mobileIcon =
        document.getElementById(
            "mobileStatusIcon"
        );


    const mobileTitle =
        document.getElementById(
            "mobileStatusTitle"
        );


    const mobileText =
        document.getElementById(
            "mobileStatusText"
        );


    if (mobileVerified) {

        if (mobileIcon) {
            mobileIcon.textContent = "✓";
        }

        if (mobileTitle) {
            mobileTitle.textContent =
                "Mobile Verified";
        }

        if (mobileText) {
            mobileText.textContent =
                "Registered mobile is protected";
        }

    } else {

        if (mobileIcon) {
            mobileIcon.textContent = "!";
        }

        if (mobileTitle) {
            mobileTitle.textContent =
                "Mobile Not Verified";
        }

        if (mobileText) {
            mobileText.textContent =
                "Verify your mobile number";
        }

    }


    const accountIcon =
        document.getElementById(
            "accountStatusIcon"
        );


    const accountTitle =
        document.getElementById(
            "accountStatusTitle"
        );


    const accountText =
        document.getElementById(
            "accountStatusText"
        );


    if (accountIcon) {
        accountIcon.textContent = "✓";
    }


    if (accountTitle) {
        accountTitle.textContent =
            "Account Active";
    }


    if (accountText) {
        accountText.textContent =
            "No restrictions detected";
    }


    const verificationPercentage =
        document.getElementById(
            "verificationPercentage"
        );


    if (verificationPercentage) {

        verificationPercentage.textContent =
            verified
                ? "100%"
                : "Pending";

    }

}


/* =========================================================
   EDIT PROFILE
========================================================= */

function toggleEdit() {

    if (nameInput) {

        nameInput.disabled =
            false;

    }


    if (emailInput) {

        emailInput.disabled =
            false;

    }


    if (phoneInput) {

        phoneInput.disabled =
            false;

    }


    if (editActions) {

        editActions.style.display =
            "flex";

    }


    if (nameInput) {

        nameInput.focus();

    }

}


/* =========================================================
   SAVE PROFILE
========================================================= */

async function saveProfile() {

    if (
        !nameInput ||
        !emailInput ||
        !phoneInput
    ) {

        return;

    }


    const profile = {

        name:
            nameInput.value.trim(),

        email:
            emailInput.value.trim(),

        phone:
            phoneInput.value.trim()

    };


    if (!profile.name) {

        alert(
            "Please enter your name."
        );

        return;

    }


    if (!profile.email) {

        alert(
            "Please enter your email address."
        );

        return;

    }


    try {

        console.log(
            "Updating T-REX profile..."
        );


        const result =
            await apiRequest(
                "/profile",
                {
                    method: "PATCH",

                    body:
                        JSON.stringify(
                            profile
                        )
                }
            );


        const updatedProfile =
            extractProfile(
                result
            ) ||
            profile;


        currentProfile =
            updatedProfile;


        if (nameInput) {

            nameInput.value =
                updatedProfile.name || "";

        }


        if (emailInput) {

            emailInput.value =
                updatedProfile.email || "";

        }


        if (phoneInput) {

            phoneInput.value =
                updatedProfile.phone || "";

        }


        updateProfileUI(
            updatedProfile
        );


        disableEditing();


        console.log(
            "T-REX profile updated successfully:",
            updatedProfile
        );


        alert(
            "Profile updated successfully."
        );


    } catch (error) {

        console.error(
            "Profile update error:",
            error
        );


        alert(
            error.message ||
            "Unable to update your profile."
        );

    }

}


/* =========================================================
   CANCEL EDIT
========================================================= */

async function cancelEdit() {

    try {

        const result =
            await apiRequest(
                "/profile"
            );


        const profile =
            extractProfile(
                result
            );


        if (!profile) {

            throw new Error(
                "Profile information was not returned by the backend."
            );

        }


        currentProfile =
            profile;


        if (nameInput) {

            nameInput.value =
                profile.name || "";

        }


        if (emailInput) {

            emailInput.value =
                profile.email || "";

        }


        if (phoneInput) {

            phoneInput.value =
                profile.phone || "";

        }


        updateProfileUI(
            profile
        );


        disableEditing();


    } catch (error) {

        console.error(
            "Unable to reload profile:",
            error
        );


        alert(
            error.message ||
            "Unable to reload your profile."
        );

    }

}


/* =========================================================
   DISABLE EDITING
========================================================= */

function disableEditing() {

    if (nameInput) {

        nameInput.disabled =
            true;

    }


    if (emailInput) {

        emailInput.disabled =
            true;

    }


    if (phoneInput) {

        phoneInput.disabled =
            true;

    }


    if (editActions) {

        editActions.style.display =
            "none";

    }

}


/* =========================================================
   STATISTICS
========================================================= */

async function calculateStatistics() {

    try {

        const result =
            await apiRequest(
                "/cases"
            );


        const cases =
            Array.isArray(
                result.cases
            )
                ? result.cases
                : [];


        const documents =
            cases.length;


        const activeCases =
            cases.filter(
                item =>
                    String(
                        item.status || ""
                    ).toUpperCase() !==
                    "CLOSED"
            );


        const requests =
            activeCases.length;


        const documentsElement =
            document.getElementById(
                "profileDocuments"
            );


        const requestsElement =
            document.getElementById(
                "profileRequests"
            );


        if (documentsElement) {

            documentsElement.textContent =
                documents;

        }


        if (requestsElement) {

            requestsElement.textContent =
                requests;

        }


        updateProtectionLevel(
            cases
        );


        console.log(
            "T-REX profile statistics:",
            {
                documents,
                requests
            }
        );


    } catch (error) {

        console.error(
            "Unable to load profile statistics:",
            error
        );


        const documentsElement =
            document.getElementById(
                "profileDocuments"
            );


        const requestsElement =
            document.getElementById(
                "profileRequests"
            );


        if (documentsElement) {
            documentsElement.textContent = "0";
        }


        if (requestsElement) {
            requestsElement.textContent = "0";
        }


        updateProtectionLevel(
            []
        );

    }

}


/* =========================================================
   PROTECTION LEVEL
========================================================= */

function updateProtectionLevel(
    cases
) {

    const protectionLevel =
        document.getElementById(
            "protectionLevel"
        );


    const protectionProgress =
        document.getElementById(
            "protectionProgress"
        );


    const percentage =
        currentProfile
            ? 100
            : 0;


    if (protectionLevel) {

        protectionLevel.textContent =
            `${percentage}%`;

    }


    if (protectionProgress) {

        protectionProgress.style.width =
            `${percentage}%`;

    }

}


/* =========================================================
   PHONE NORMALIZATION
========================================================= */

function normalizePhoneForOtp(
    value
) {

    const digits =
        String(
            value || ""
        ).replace(
            /\D/g,
            ""
        );


    if (
        digits.length === 10
    ) {

        return `91${digits}`;

    }


    if (
        digits.length === 12 &&
        digits.startsWith("91")
    ) {

        return digits;

    }


    throw new Error(
        "Please enter a valid 10-digit Indian mobile number."
    );

}


/* =========================================================
   UPDATE VERIFY BUTTON
========================================================= */

function setVerifyButton(
    text,
    disabled = false
) {

    const button =
        document.querySelector(
            ".verify-btn"
        );


    if (!button) {
        return;
    }


    button.textContent =
        text;


    button.disabled =
        disabled;

}


/* =========================================================
   PHONE VERIFICATION
========================================================= */

async function verifyPhone() {

    if (
        phoneVerificationInProgress
    ) {

        return;

    }


    if (!phoneInput) {

        alert(
            "Mobile number field was not found."
        );

        return;

    }


    if (
        !currentProfile ||
        !currentProfile.id
    ) {

        alert(
            "Your profile is not loaded yet. Please try again."
        );

        return;

    }


    let normalizedPhone;


    try {

        normalizedPhone =
            normalizePhoneForOtp(
                phoneInput.value
            );

    } catch (error) {

        alert(
            error.message
        );

        return;

    }


    phoneVerificationInProgress =
        true;


    try {

        setVerifyButton(
            "Sending OTP...",
            true
        );


        console.log(
            "Starting Profile mobile verification...",
            {
                userId:
                    currentProfile.id,
                phone:
                    `+${normalizedPhone}`
            }
        );


        /*
         * IMPORTANT:
         *
         * This endpoint is intentionally called
         * without the normal apiRequest() helper
         * because /auth/start is a public OTP
         * endpoint.
         *
         * The current authenticated user's ID
         * is supplied so that successful OTP
         * verification updates the existing
         * account rather than creating a new one.
         */

        const result =
            await publicApiRequest(
                "/auth/start",
                {
                    method: "POST",

                    body:
                        JSON.stringify({
                            phone:
                                normalizedPhone,

                            mobile:
                                normalizedPhone,

                            userId:
                                currentProfile.id
                        })
                }
            );


        if (
            !result ||
            result.success !== true
        ) {

            throw new Error(
                result?.message ||
                "Unable to send OTP."
            );

        }


        phoneVerificationId =
            result.verificationId ||
            result.sessionId ||
            null;


        if (!phoneVerificationId) {

            throw new Error(
                "The OTP service did not return a verification ID."
            );

        }


        phoneVerificationPhone =
            normalizedPhone;


        console.log(
            "Profile OTP sent successfully.",
            {
                verificationId:
                    phoneVerificationId,
                channel:
                    result.channel ||
                    "sms",
                provider:
                    result.provider ||
                    "2factor"
            }
        );


        setVerifyButton(
            "Enter OTP",
            false
        );


        const otp =
            prompt(
                "OTP sent by SMS.\n\nEnter the 6-digit OTP:"
            );


        if (!otp) {

            setVerifyButton(
                "Verify",
                false
            );

            return;

        }


        await verifyPhoneOtp(
            otp
        );


    } catch (error) {

        console.error(
            "Profile phone verification error:",
            error
        );


        setVerifyButton(
            "Verify",
            false
        );


        alert(
            error.message ||
            "Unable to send OTP."
        );

    } finally {

        phoneVerificationInProgress =
            false;

    }

}


/* =========================================================
   VERIFY PHONE OTP
========================================================= */

async function verifyPhoneOtp(
    otp
) {

    const cleanOtp =
        String(
            otp || ""
        ).trim();


    if (
        !/^\d{4,8}$/.test(
            cleanOtp
        )
    ) {

        throw new Error(
            "Please enter the OTP sent to your mobile number."
        );

    }


    if (
        !phoneVerificationId
    ) {

        throw new Error(
            "OTP verification session is missing. Please request a new OTP."
        );

    }


    try {

        setVerifyButton(
            "Verifying...",
            true
        );


        const result =
            await publicApiRequest(
                "/auth/verify-otp",
                {
                    method: "POST",

                    body:
                        JSON.stringify({
                            phone:
                                phoneVerificationPhone,

                            mobile:
                                phoneVerificationPhone,

                            otp:
                                cleanOtp,

                            verificationId:
                                phoneVerificationId,

                            sessionId:
                                phoneVerificationId,

                            userId:
                                currentProfile?.id ||
                                null
                        })
                }
            );


        if (
            !result ||
            result.success !== true ||
            result.verified !== true
        ) {

            throw new Error(
                result?.message ||
                "OTP verification failed."
            );

        }


        /*
         * The backend returns a fresh JWT for
         * the repository user.
         *
         * Because we supplied currentProfile.id,
         * the backend should have updated the
         * existing account rather than creating
         * another account.
         */

        if (result.token) {

            sessionStorage.setItem(
                "trexToken",
                result.token
            );

        }


        /*
         * Refresh the profile from the backend.
         */

        const profileResult =
            await apiRequest(
                "/profile"
            );


        const updatedProfile =
            extractProfile(
                profileResult
            );


        if (!updatedProfile) {

            throw new Error(
                "OTP was verified, but the updated profile could not be loaded."
            );

        }


        /*
         * Mark phone as verified on the
         * frontend for this session.
         *
         * The backend's current profile schema
         * does not expose phoneVerified separately.
         */

        updatedProfile.phoneVerified =
            true;


        currentProfile =
            updatedProfile;


        if (phoneInput) {

            phoneInput.value =
                updatedProfile.phone || "";

        }


        updateProfileUI(
            updatedProfile
        );


        setVerifyButton(
            "Verified ✓",
            true
        );


        phoneVerificationId =
            null;


        phoneVerificationPhone =
            null;


        alert(
            "Mobile number verified successfully."
        );


        console.log(
            "T-REX mobile number verified successfully."
        );


    } catch (error) {

        console.error(
            "OTP verification error:",
            error
        );


        setVerifyButton(
            "Verify",
            false
        );


        throw error;

    }

}


/* =========================================================
   SAVE PREFERENCES
========================================================= */

function savePreferences() {

    const securityToggle =
        document.getElementById(
            "securityToggle"
        );


    const requestToggle =
        document.getElementById(
            "requestToggle"
        );


    const systemToggle =
        document.getElementById(
            "systemToggle"
        );


    const preferences = {

        security:
            securityToggle
                ? securityToggle.checked
                : false,

        requests:
            requestToggle
                ? requestToggle.checked
                : false,

        system:
            systemToggle
                ? systemToggle.checked
                : false

    };


    localStorage.setItem(

        PREFERENCES_KEY,

        JSON.stringify(
            preferences
        )

    );

}


/* =========================================================
   LOAD PREFERENCES
========================================================= */

function loadPreferences() {

    const saved =
        localStorage.getItem(
            PREFERENCES_KEY
        );


    if (!saved) {
        return;
    }


    let preferences;


    try {

        preferences =
            JSON.parse(
                saved
            );

    } catch (error) {

        console.error(
            "Invalid saved preferences:",
            error
        );

        return;

    }


    const securityToggle =
        document.getElementById(
            "securityToggle"
        );


    const requestToggle =
        document.getElementById(
            "requestToggle"
        );


    const systemToggle =
        document.getElementById(
            "systemToggle"
        );


    if (
        securityToggle &&
        preferences.security !== undefined
    ) {

        securityToggle.checked =
            preferences.security;

    }


    if (
        requestToggle &&
        preferences.requests !== undefined
    ) {

        requestToggle.checked =
            preferences.requests;

    }


    if (
        systemToggle &&
        preferences.system !== undefined
    ) {

        systemToggle.checked =
            preferences.system;

    }

}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

    clearAuthentication();

    window.location.href =
        "../Login/Login.html";

}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        console.log(
            "Initializing T-REX Profile..."
        );


        await loadProfile();


        console.log(
            "T-REX Profile initialized successfully."
        );

    }
);
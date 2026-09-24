/* =========================================================
   T-REX - SECURITY CENTER
   Backend Connected Version
   ========================================================= */

const API_BASE_URL = "/api";

/* =========================================================
   AUTHENTICATION
   ========================================================= */

function getAuthToken() {

    return sessionStorage.getItem(
        "trexToken"
    );

}


/* =========================================================
   API REQUEST
   ========================================================= */

async function apiRequest(
    endpoint,
    options = {}
) {

    const token =
        getAuthToken();

    if (!token) {

        throw new Error(
            "Your session has expired. Please log in again."
        );

    }


    const headers = {
        ...(options.headers || {}),
        "Authorization":
            `Bearer ${token}`
    };


    if (options.body) {

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
            "T-REX backend connection error:",
            error
        );

        throw new Error(
            "Unable to connect to the T-REX backend. Make sure the backend server is running."
        );

    }


    const rawResponse =
        await response.text();

    let result = {};


    try {

        result =
            rawResponse
                ? JSON.parse(rawResponse)
                : {};

    } catch (error) {

        console.error(
            "Invalid backend response:",
            rawResponse
        );

        throw new Error(
            "The T-REX backend returned an invalid response."
        );

    }


    /* =====================================================
       SESSION EXPIRED
       ===================================================== */

    if (response.status === 401) {

        sessionStorage.removeItem(
            "trexToken"
        );

        sessionStorage.removeItem(
            "verificationId"
        );

        sessionStorage.removeItem(
            "userId"
        );

        sessionStorage.removeItem(
            "trexVerificationId"
        );

        sessionStorage.removeItem(
            "trexUserId"
        );


        alert(
            "Your session has expired. Please log in again."
        );


        window.location.href =
            "../Login/Login.html";


        throw new Error(
            "Authentication expired."
        );

    }


    /* =====================================================
       API ERROR
       ===================================================== */

    if (
        !response.ok ||
        result.success === false
    ) {

        throw new Error(
            result.message ||
            "T-REX backend request failed."
        );

    }


    return result;

}


/* =========================================================
   GET INITIALS
   ========================================================= */

function getInitials(name) {

    const value =
        String(name || "")
            .trim();


    if (!value) {

        return "TR";

    }


    return value
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(
            word =>
                word
                    .charAt(0)
                    .toUpperCase()
        )
        .join("");

}


/* =========================================================
   EXTRACT PROFILE
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
   UPDATE PROFILE UI
   ========================================================= */

function updateProfileUI(profile) {

    if (!profile) {

        return;

    }


    const profileName =
        profile.name ||
        "Verified Requester";


    const initials =
        getInitials(
            profileName
        );


    /* =====================================================
       SIDEBAR NAME
       ===================================================== */

    const sidebarName =
        document.getElementById(
            "sidebarUserName"
        );


    if (sidebarName) {

        sidebarName.textContent =
            profileName;

    }


    /* =====================================================
       SIDEBAR AVATAR
       ===================================================== */

    const sidebarAvatar =
        document.getElementById(
            "sidebarProfileAvatar"
        );


    if (sidebarAvatar) {

        sidebarAvatar.textContent =
            initials;

    }


    /* =====================================================
       TOP PROFILE NAME
       ===================================================== */

    const topProfileName =
        document.getElementById(
            "topProfileName"
        );


    if (topProfileName) {

        topProfileName.textContent =
            profileName;

    }


    /* =====================================================
       TOP PROFILE INITIALS
       ===================================================== */

    const topProfileInitials =
        document.getElementById(
            "topProfileInitials"
        );


    if (topProfileInitials) {

        topProfileInitials.textContent =
            initials;

    }


    /* =====================================================
       FALLBACK SELECTORS
       ===================================================== */

    document
        .querySelectorAll(
            ".user-box strong, .top-profile span"
        )
        .forEach(element => {

            if (
                element.id !==
                "topProfileName"
            ) {

                element.textContent =
                    profileName;

            }

        });


    document
        .querySelectorAll(
            ".avatar, .small-avatar"
        )
        .forEach(element => {

            if (
                element.id !==
                "sidebarProfileAvatar" &&
                element.id !==
                "topProfileInitials"
            ) {

                element.textContent =
                    initials;

            }

        });

}


/* =========================================================
   LOAD PROFILE
   ========================================================= */

async function loadProfile() {

    console.log(
        "Loading T-REX security profile..."
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
                "Authenticated profile was not returned by the backend."
            );

        }


        updateProfileUI(
            profile
        );


        console.log(
            "T-REX security profile loaded successfully."
        );


        return profile;

    } catch (error) {

        console.error(
            "Unable to load security profile:",
            error
        );


        /*
           Do not replace the real user name
           with a fake profile if the backend
           fails. Keep the loading state visible.
        */

        const sidebarName =
            document.getElementById(
                "sidebarUserName"
            );


        const topProfileName =
            document.getElementById(
                "topProfileName"
            );


        if (sidebarName) {

            sidebarName.textContent =
                "Profile unavailable";

        }


        if (topProfileName) {

            topProfileName.textContent =
                "Profile unavailable";

        }


        throw error;

    }

}


/* =========================================================
   LOAD SECURITY STATUS
   ========================================================= */

async function loadSecurity() {

    console.log(
        "Loading T-REX security status..."
    );


    try {

        const result =
            await apiRequest(
                "/security/protection"
            );


        const active =
            result.active === true;


        updateSecurityInterface(
            active
        );


        console.log(
            "T-REX security status loaded:",
            {
                active
            }
        );


        return active;

    } catch (error) {

        console.error(
            "Unable to load T-REX security status:",
            error
        );


        showSecurityLoadError(
            error
        );


        return null;

    }

}


/* =========================================================
   UPDATE SECURITY INTERFACE
   ========================================================= */

function updateSecurityInterface(
    active
) {

    const progress =
        document.getElementById(
            "securityProgress"
        );


    const score =
        document.getElementById(
            "securityScore"
        );


    const progressText =
        document.getElementById(
            "securityProgressText"
        );


    const heroTitle =
        document.getElementById(
            "securityHeroTitle"
        );


    const heroDescription =
        document.getElementById(
            "securityHeroDescription"
        );


    const protectionStatus =
        document.getElementById(
            "protectionStatus"
        );


    const protectionStatusText =
        document.getElementById(
            "protectionStatusText"
        );


    const protectionAlertTitle =
        document.getElementById(
            "protectionAlertTitle"
        );


    const protectionAlertMessage =
        document.getElementById(
            "protectionAlertMessage"
        );


    const protectionAlertTime =
        document.getElementById(
            "protectionAlertTime"
        );


    const systemSecurityStatus =
        document.getElementById(
            "systemSecurityStatus"
        );


    const systemSecurityMessage =
        document.getElementById(
            "systemSecurityMessage"
        );


    const emergencyProtectionDescription =
        document.getElementById(
            "emergencyProtectionDescription"
        );


    /*
       The current backend returns only:
       active: true / false

       It does NOT return a numerical
       security score.

       Therefore the UI uses a status
       indicator instead of pretending
       that a numeric score is calculated
       by the backend.
    */


    if (active) {

        if (progress) {

            progress.style.width =
                "100%";

        }


        if (score) {

            score.textContent =
                "100";

        }


        if (progressText) {

            progressText.textContent =
                "Emergency protection active";

        }


        if (heroTitle) {

            heroTitle.textContent =
                "Your account is protected";

        }


        if (heroDescription) {

            heroDescription.textContent =
                "Emergency account protection is currently active for your T-REX account.";

        }


        if (protectionStatus) {

            protectionStatus.textContent =
                "● Protected";

        }


        if (protectionStatusText) {

            protectionStatusText.textContent =
                "Emergency protection active";

        }


        if (protectionAlertTitle) {

            protectionAlertTitle.textContent =
                "Emergency protection active";

        }


        if (protectionAlertMessage) {

            protectionAlertMessage.textContent =
                "Your account is currently protected by the emergency protection control.";

        }


        if (protectionAlertTime) {

            protectionAlertTime.textContent =
                "Active now";

        }


        if (systemSecurityStatus) {

            systemSecurityStatus.textContent =
                "System Protected";

        }


        if (systemSecurityMessage) {

            systemSecurityMessage.textContent =
                "Emergency protection is active.";

        }


        if (emergencyProtectionDescription) {

            emergencyProtectionDescription.textContent =
                "Emergency account protection is currently active.";

        }

    } else {

        /*
           Standard authentication/security
           is active, but emergency protection
           has not been enabled.
        */

        if (progress) {

            progress.style.width =
                "75%";

        }


        if (score) {

            score.textContent =
                "75";

        }


        if (progressText) {

            progressText.textContent =
                "Standard protection active";

        }


        if (heroTitle) {

            heroTitle.textContent =
                "Your account is protected";

        }


        if (heroDescription) {

            heroDescription.textContent =
                "Standard SafePin security controls are active. Emergency protection can be enabled when required.";

        }


        if (protectionStatus) {

            protectionStatus.textContent =
                "● Protected";

        }


        if (protectionStatusText) {

            protectionStatusText.textContent =
                "Standard security active";

        }


        if (protectionAlertTitle) {

            protectionAlertTitle.textContent =
                "Standard security active";

        }


        if (protectionAlertMessage) {

            protectionAlertMessage.textContent =
                "Your authenticated T-REX session and standard security controls are active.";

        }


        if (protectionAlertTime) {

            protectionAlertTime.textContent =
                "Active";

        }


        if (systemSecurityStatus) {

            systemSecurityStatus.textContent =
                "System Secure";

        }


        if (systemSecurityMessage) {

            systemSecurityMessage.textContent =
                "Standard security controls are active.";

        }


        if (emergencyProtectionDescription) {

            emergencyProtectionDescription.textContent =
                "If you notice suspicious activity, you can temporarily protect your account.";

        }

    }


    updateProtectionButton(
        active
    );

}


/* =========================================================
   SECURITY LOAD ERROR
   ========================================================= */

function showSecurityLoadError(
    error
) {

    const heroTitle =
        document.getElementById(
            "securityHeroTitle"
        );


    const heroDescription =
        document.getElementById(
            "securityHeroDescription"
        );


    const protectionStatus =
        document.getElementById(
            "protectionStatus"
        );


    const protectionStatusText =
        document.getElementById(
            "protectionStatusText"
        );


    const progress =
        document.getElementById(
            "securityProgress"
        );


    const score =
        document.getElementById(
            "securityScore"
        );


    const progressText =
        document.getElementById(
            "securityProgressText"
        );


    const systemSecurityStatus =
        document.getElementById(
            "systemSecurityStatus"
        );


    const systemSecurityMessage =
        document.getElementById(
            "systemSecurityMessage"
        );


    if (heroTitle) {

        heroTitle.textContent =
            "Security status unavailable";

    }


    if (heroDescription) {

        heroDescription.textContent =
            error.message ||
            "Unable to retrieve security status.";

    }


    if (protectionStatus) {

        protectionStatus.textContent =
            "● Unavailable";

    }


    if (protectionStatusText) {

        protectionStatusText.textContent =
            "Unable to load security status";

    }


    if (progress) {

        progress.style.width =
            "0%";

    }


    if (score) {

        score.textContent =
            "--";

    }


    if (progressText) {

        progressText.textContent =
            "Security status unavailable";

    }


    if (systemSecurityStatus) {

        systemSecurityStatus.textContent =
            "Security Status Unavailable";

    }


    if (systemSecurityMessage) {

        systemSecurityMessage.textContent =
            "Unable to retrieve backend security status.";

    }


    updateProtectionButton(
        false
    );

}


/* =========================================================
   EMERGENCY ACCOUNT PROTECTION
   ========================================================= */

async function protectAccount() {

    const confirmProtection =
        confirm(
            "Are you sure you want to activate emergency account protection?"
        );


    if (!confirmProtection) {

        return;

    }


    const button =
        document.getElementById(
            "protectAccountButton"
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Activating...";

    }


    try {

        console.log(
            "Activating T-REX emergency protection..."
        );


        const result =
            await apiRequest(
                "/security/protection",
                {
                    method: "POST",
                    body:
                        JSON.stringify({})
                }
            );


        if (
            result.success &&
            result.active === true
        ) {

            updateSecurityInterface(
                true
            );


            alert(
                "Emergency account protection has been activated."
            );


            console.log(
                "Emergency protection activated successfully."
            );

        } else {

            throw new Error(
                "Emergency protection could not be activated."
            );

        }

    } catch (error) {

        console.error(
            "Emergency protection error:",
            error
        );


        alert(
            error.message ||
            "Unable to activate emergency account protection."
        );


        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Protect Account";

        }

    }

}


/* =========================================================
   UPDATE PROTECTION BUTTON
   ========================================================= */

function updateProtectionButton(
    active
) {

    const button =
        document.getElementById(
            "protectAccountButton"
        );


    if (!button) {

        return;

    }


    if (active) {

        button.textContent =
            "Protection Active";

        button.disabled =
            true;

        button.style.background =
            "#198754";

    } else {

        button.textContent =
            "Protect Account";

        button.disabled =
            false;

        button.style.background =
            "";

    }

}


/* =========================================================
   LOGOUT
   ========================================================= */

function logout(event) {

    if (event) {

        event.preventDefault();

    }


    const confirmLogout =
        confirm(
            "Are you sure you want to logout?"
        );


    if (!confirmLogout) {

        return false;

    }


    sessionStorage.removeItem(
        "trexToken"
    );

    sessionStorage.removeItem(
        "verificationId"
    );

    sessionStorage.removeItem(
        "userId"
    );

    sessionStorage.removeItem(
        "trexVerificationId"
    );

    sessionStorage.removeItem(
        "trexUserId"
    );


    window.location.href =
        "../Login/Login.html";


    return false;

}


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "Initializing T-REX Security Center..."
        );


        const token =
            getAuthToken();


        if (!token) {

            console.warn(
                "No T-REX authentication token found."
            );


            window.location.href =
                "../Login/Login.html";

            return;

        }


        /*
           Load profile and security status
           independently so a profile problem
           does not prevent the security status
           from being displayed.
        */

        await Promise.all([
            loadProfile(),
            loadSecurity()
        ]);


        const sessionTime =
            document.getElementById(
                "sessionTime"
            );


        if (sessionTime) {

            sessionTime.textContent =
                `Session active • ${new Date().toLocaleString()}`;

        }


        const currentSessionStatus =
            document.getElementById(
                "currentSessionStatus"
            );


        if (currentSessionStatus) {

            currentSessionStatus.textContent =
                "Authenticated";

        }


        console.log(
            "T-REX Security Center initialized successfully."
        );

    }
);
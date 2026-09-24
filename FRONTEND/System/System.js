/* =========================================================
   T-REX - SYSTEM OVERVIEW
   Backend Connected Version
   ========================================================= */

const API_BASE_URL =
    "http://localhost:5000/api";


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

    const response =
        await fetch(
            `${API_BASE_URL}${endpoint}`,
            {
                ...options,
                headers
            }
        );

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


    if (response.status === 401) {

        clearSession();

        alert(
            "Your session has expired. Please log in again."
        );

        window.location.href =
            "../Login/Login.html";

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
            "T-REX backend request failed."
        );

    }

    return result;

}


/* =========================================================
   SESSION CLEANUP
   ========================================================= */

function clearSession() {

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

}


/* =========================================================
   INITIAL DATA
   ========================================================= */

async function loadSystemData() {

    console.log(
        "Loading T-REX System Overview..."
    );

    const startTime =
        performance.now();


    try {

        /*
         * Load authenticated backend data.
         *
         * The health endpoint does not require
         * authentication.
         */

        const [
            healthResult,
            profileResult,
            casesResult,
            requestsResult,
            notificationsResult,
            securityResult
        ] = await Promise.all([

            fetchHealth(),

            apiRequest(
                "/profile"
            ),

            apiRequest(
                "/cases"
            ),

            apiRequest(
                "/requests"
            ),

            apiRequest(
                "/notifications"
            ),

            apiRequest(
                "/security/protection"
            )

        ]);


        const responseTime =
            Math.round(
                performance.now() -
                startTime
            );


        /*
         * Profile API may return:
         *
         * {
         *   user: {...}
         * }
         *
         * or older compatible structures.
         */

        const profile =
            extractProfile(
                profileResult
            );


        const cases =
            Array.isArray(
                casesResult.cases
            )
                ? casesResult.cases
                : [];


        const requests =
            Array.isArray(
                requestsResult.requests
            )
                ? requestsResult.requests
                : [];


        const notifications =
            Array.isArray(
                notificationsResult.notifications
            )
                ? notificationsResult.notifications
                : [];


        const protectionActive =
            securityResult.active === true;


        updateProfile(
            profile
        );


        updateStatistics(
            cases,
            requests,
            notifications,
            protectionActive
        );


        updateSystemStatus(
            healthResult,
            protectionActive
        );


        updateRequestPipeline(
            cases
        );


        updateSystemActivity(
            cases,
            requests,
            notifications,
            healthResult
        );


        updateApiMonitoring(
            responseTime,
            cases,
            requests,
            healthResult
        );


        console.log(
            "T-REX System Overview loaded successfully:",
            {
                cases: cases.length,
                requests: requests.length,
                notifications: notifications.length,
                protectionActive,
                backend:
                    healthResult.status
            }
        );


    } catch (error) {

        console.error(
            "Unable to load T-REX System Overview:",
            error
        );

        showSystemError(
            error
        );

    }

}


/* =========================================================
   PROFILE EXTRACTION
   ========================================================= */

function extractProfile(
    result
) {

    return (
        result?.user ||
        result?.profile ||
        result?.data ||
        {}
    );

}


/* =========================================================
   HEALTH CHECK
   ========================================================= */

async function fetchHealth() {

    const start =
        performance.now();


    const response =
        await fetch(
            `${API_BASE_URL}/health`
        );


    const rawResponse =
        await response.text();


    let result = {};

    try {

        result =
            rawResponse
                ? JSON.parse(rawResponse)
                : {};

    } catch (error) {

        throw new Error(
            "Backend health endpoint returned invalid data."
        );

    }


    if (!response.ok) {

        throw new Error(
            result.message ||
            "T-REX backend is unavailable."
        );

    }


    return {
        ...result,

        responseTime:
            Math.round(
                performance.now() -
                start
            )
    };

}


/* =========================================================
   PROFILE
   ========================================================= */

function updateProfile(
    profile
) {

    const name =
        String(
            profile?.name ||
            "Verified Requester"
        ).trim();


    const initials =
        getInitials(
            name
        );


    /*
     * New System.html IDs
     */

    const sidebarName =
        document.getElementById(
            "sidebarUserName"
        );

    if (sidebarName) {

        sidebarName.textContent =
            name;

    }


    const topName =
        document.getElementById(
            "topProfileName"
        );

    if (topName) {

        topName.textContent =
            name;

    }


    const sidebarAvatar =
        document.getElementById(
            "sidebarProfileAvatar"
        );

    if (sidebarAvatar) {

        sidebarAvatar.textContent =
            initials;

    }


    const topInitials =
        document.getElementById(
            "topProfileInitials"
        );

    if (topInitials) {

        topInitials.textContent =
            initials;

    }


    /*
     * Compatibility with any existing
     * profile elements that may still
     * exist in System.html.
     */

    const profileNameElements =
        document.querySelectorAll(
            "[data-profile-name]"
        );


    profileNameElements.forEach(
        element => {

            element.textContent =
                name;

        }
    );


    const profileAvatarElements =
        document.querySelectorAll(
            "[data-profile-avatar]"
        );


    profileAvatarElements.forEach(
        element => {

            element.textContent =
                initials;

        }
    );

}


/* =========================================================
   INITIALS
   ========================================================= */

function getInitials(
    name
) {

    return String(
        name || ""
    )
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(
            word =>
                word
                    .charAt(0)
                    .toUpperCase()
        )
        .join("") || "TR";

}


/* =========================================================
   STATISTICS
   ========================================================= */

function updateStatistics(
    cases,
    requests,
    notifications,
    protectionActive
) {

    const activeCases =
        cases.filter(
            item =>
                ![
                    "CLOSED",
                    "COMPLETED"
                ].includes(
                    item.status
                )
        ).length;


    const activeCasesElement =
        document.getElementById(
            "activeCases"
        );

    if (activeCasesElement) {

        activeCasesElement.textContent =
            activeCases;

    }


    const requestsElement =
        document.getElementById(
            "documentsProcessed"
        );

    if (requestsElement) {

        requestsElement.textContent =
            requests.length;

    }


    const notificationsElement =
        document.getElementById(
            "notificationsCount"
        );

    if (notificationsElement) {

        notificationsElement.textContent =
            notifications.length;

    }


    const securityElement =
        document.getElementById(
            "securityState"
        );

    if (securityElement) {

        securityElement.textContent =
            protectionActive
                ? "Active"
                : "Protected";

    }

}


/* =========================================================
   SYSTEM STATUS
   ========================================================= */

function updateSystemStatus(
    health,
    protectionActive
) {

    const title =
        document.getElementById(
            "systemStatusTitle"
        );

    const pill =
        document.getElementById(
            "systemStatusPill"
        );

    const message =
        document.getElementById(
            "systemStatusMessage"
        );

    const backendStatus =
        document.getElementById(
            "backendStatus"
        );

    const backendService =
        document.getElementById(
            "backendServiceStatus"
        );

    const securityService =
        document.getElementById(
            "securityServiceStatus"
        );

    const secureStatus =
        document.getElementById(
            "systemSecureStatus"
        );

    const secureMessage =
        document.getElementById(
            "systemSecureMessage"
        );


    const isOperational =
        health &&
        health.success === true &&
        health.status === "ok";


    if (isOperational) {

        if (title) {

            title.textContent =
                "All Systems Operational";

        }


        if (pill) {

            pill.textContent =
                "Operational";

        }


        if (message) {

            if (protectionActive) {

                message.textContent =
                    "T-REX backend services are operational and emergency account protection is active.";

            } else {

                message.textContent =
                    "T-REX backend services are operational and authenticated platform services are available.";

            }

        }


        if (backendStatus) {

            backendStatus.textContent =
                "ONLINE";

        }


        if (backendService) {

            backendService.textContent =
                "● Online";

        }


        if (securityService) {

            securityService.textContent =
                protectionActive
                    ? "● Protected"
                    : "● Operational";

        }


        if (secureStatus) {

            secureStatus.textContent =
                "System Secure";

        }


        if (secureMessage) {

            secureMessage.textContent =
                "All T-REX services operational";

        }

    } else {

        if (title) {

            title.textContent =
                "System Status Unavailable";

        }


        if (pill) {

            pill.textContent =
                "Unavailable";

        }


        if (message) {

            message.textContent =
                "The T-REX backend health status could not be confirmed.";

        }


        if (backendStatus) {

            backendStatus.textContent =
                "OFFLINE";

        }


        if (backendService) {

            backendService.textContent =
                "● Offline";

        }


        if (securityService) {

            securityService.textContent =
                "● Unknown";

        }


        if (secureStatus) {

            secureStatus.textContent =
                "Status Unknown";

        }


        if (secureMessage) {

            secureMessage.textContent =
                "Unable to confirm backend status";

        }

    }

}


/* =========================================================
   REQUEST PIPELINE
   ========================================================= */

function updateRequestPipeline(
    cases
) {

    const total =
        cases.length;


    let submitted = 0;
    let verification = 0;
    let department = 0;
    let completed = 0;


    cases.forEach(
        currentCase => {

            const status =
                currentCase.status;


            if (
                status ===
                "UNDER_VERIFICATION"
            ) {

                submitted++;

                verification++;

            } else if (
                status ===
                "DEPARTMENT"
            ) {

                department++;

            } else if (
                status ===
                "COMPLETED" ||
                status ===
                "CLOSED"
            ) {

                completed++;

            } else {

                submitted++;

            }

        }
    );


    const submittedPercent =
        total
            ? Math.round(
                (submitted / total) *
                100
            )
            : 0;


    const verificationPercent =
        total
            ? Math.round(
                (verification / total) *
                100
            )
            : 0;


    const departmentPercent =
        total
            ? Math.round(
                (department / total) *
                100
            )
            : 0;


    const completedPercent =
        total
            ? Math.round(
                (completed / total) *
                100
            )
            : 0;


    updatePipelineRow(
        "pipelineSubmitted",
        "pipelineSubmittedValue",
        submittedPercent
    );


    updatePipelineRow(
        "pipelineVerification",
        "pipelineVerificationValue",
        verificationPercent
    );


    updatePipelineRow(
        "pipelineDepartment",
        "pipelineDepartmentValue",
        departmentPercent
    );


    updatePipelineRow(
        "pipelineCompleted",
        "pipelineCompletedValue",
        completedPercent
    );

}


/* =========================================================
   PIPELINE ROW
   ========================================================= */

function updatePipelineRow(
    progressId,
    valueId,
    percentage
) {

    const progress =
        document.getElementById(
            progressId
        );

    const value =
        document.getElementById(
            valueId
        );


    if (progress) {

        progress.style.width =
            `${percentage}%`;

    }


    if (value) {

        value.textContent =
            `${percentage}%`;

    }

}


/* =========================================================
   SYSTEM ACTIVITY
   ========================================================= */

function updateSystemActivity(
    cases,
    requests,
    notifications,
    health
) {

    const container =
        document.getElementById(
            "systemActivity"
        );


    if (!container) {

        return;

    }


    const activities = [];


    if (
        health &&
        health.success
    ) {

        activities.push({

            icon:
                "✓",

            className:
                "green",

            title:
                "T-REX backend online",

            message:
                "Backend health check responded successfully.",

            time:
                "Just now"

        });

    }


    if (cases.length) {

        const latestCase =
            cases[0];


        activities.push({

            icon:
                "API",

            className:
                "maroon",

            title:
                "Case available",

            message:
                `${latestCase.documentName || "Protection request"} is currently ${formatStatus(
                    latestCase.statusLabel ||
                    latestCase.status
                )}.`,

            time:
                formatRelativeTime(
                    latestCase.updatedAt ||
                    latestCase.createdAt
                )

        });

    }


    if (notifications.length) {

        const latestNotification =
            notifications[0];


        activities.push({

            icon:
                "🔔",

            className:
                "orange",

            title:
                latestNotification.title ||
                "Notification received",

            message:
                latestNotification.message ||
                "A new T-REX notification is available.",

            time:
                formatRelativeTime(
                    latestNotification.createdAt
                )

        });

    }


    if (!activities.length) {

        activities.push({

            icon:
                "✓",

            className:
                "green",

            title:
                "System ready",

            message:
                "No recent case or notification activity is available.",

            time:
                "Now"

        });

    }


    container.innerHTML =
        activities
            .slice(0, 3)
            .map(
                activity => `

                    <div class="activity-item">

                        <div class="activity-dot ${escapeHtml(
                            activity.className
                        )}">
                            ${escapeHtml(
                                activity.icon
                            )}
                        </div>

                        <div>

                            <strong>
                                ${escapeHtml(
                                    activity.title
                                )}
                            </strong>

                            <p>
                                ${escapeHtml(
                                    activity.message
                                )}
                            </p>

                            <small class="activity-time">
                                ${escapeHtml(
                                    activity.time
                                )}
                            </small>

                        </div>

                    </div>

                `
            )
            .join("");

}


/* =========================================================
   STATUS FORMATTER
   ========================================================= */

function formatStatus(
    status
) {

    if (!status) {

        return "processing";

    }


    return String(status)
        .toLowerCase()
        .replaceAll("_", " ");

}


/* =========================================================
   API MONITORING
   ========================================================= */

function updateApiMonitoring(
    responseTime,
    cases,
    requests,
    health
) {

    const responseElement =
        document.getElementById(
            "apiResponseTime"
        );

    const casesElement =
        document.getElementById(
            "apiCases"
        );

    const requestsElement =
        document.getElementById(
            "apiRequests"
        );

    const statusElement =
        document.getElementById(
            "apiStatus"
        );

    const overallElement =
        document.getElementById(
            "apiOverallStatus"
        );


    if (responseElement) {

        responseElement.textContent =
            `${responseTime} ms`;

    }


    if (casesElement) {

        casesElement.textContent =
            cases.length;

    }


    if (requestsElement) {

        requestsElement.textContent =
            requests.length;

    }


    const operational =
        health &&
        health.success === true;


    if (statusElement) {

        statusElement.textContent =
            operational
                ? "Operational"
                : "Unavailable";

    }


    if (overallElement) {

        overallElement.textContent =
            operational
                ? "● Operational"
                : "● Unavailable";

    }

}


/* =========================================================
   ERROR STATE
   ========================================================= */

function showSystemError(
    error
) {

    const title =
        document.getElementById(
            "systemStatusTitle"
        );

    const pill =
        document.getElementById(
            "systemStatusPill"
        );

    const message =
        document.getElementById(
            "systemStatusMessage"
        );

    const backendStatus =
        document.getElementById(
            "backendStatus"
        );


    if (title) {

        title.textContent =
            "System Status Unavailable";

    }


    if (pill) {

        pill.textContent =
            "Unavailable";

    }


    if (message) {

        message.textContent =
            error.message ||
            "Unable to load T-REX system information.";

    }


    if (backendStatus) {

        backendStatus.textContent =
            "ERROR";

    }

}


/* =========================================================
   STATUS REFRESH
   ========================================================= */

async function simulateSystemRefresh() {

    console.log(
        "Refreshing T-REX System Overview..."
    );

    await loadSystemData();

}


/* =========================================================
   RELATIVE TIME
   ========================================================= */

function formatRelativeTime(
    timestamp
) {

    if (!timestamp) {

        return "Unknown time";

    }


    const date =
        new Date(timestamp);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Unknown time";

    }


    const difference =
        Date.now() -
        date.getTime();


    const seconds =
        Math.floor(
            difference / 1000
        );


    if (seconds < 60) {

        return "Just now";

    }


    const minutes =
        Math.floor(
            seconds / 60
        );


    if (minutes < 60) {

        return `${minutes} min ago`;

    }


    const hours =
        Math.floor(
            minutes / 60
        );


    if (hours < 24) {

        return `${hours} hr ago`;

    }


    const days =
        Math.floor(
            hours / 24
        );


    return `${days} day${days === 1 ? "" : "s"} ago`;

}


/* =========================================================
   HTML ESCAPING
   ========================================================= */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

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


    clearSession();


    window.location.href =
        "../Login/Login.html";


    return false;

}


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "Initializing T-REX System Overview..."
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


        loadSystemData();

    }
);


/* =========================================================
   AUTOMATIC REFRESH
   ========================================================= */

setInterval(
    simulateSystemRefresh,
    30000
);
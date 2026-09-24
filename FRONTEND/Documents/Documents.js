/* =====================================================
   T-REX DOCUMENTS
   Backend Connected + Profile Synchronized Version
===================================================== */

const API_BASE_URL = "http://localhost:5000/api";

let selectedDocument = "";
let currentCases = [];
let currentNotifications = [];
let currentProfile = null;


/* =========================================
   AUTHENTICATION
========================================= */

function getAuthToken() {

    return sessionStorage.getItem("trexToken");

}


function redirectToLogin() {

    sessionStorage.removeItem("trexToken");
    sessionStorage.removeItem("verificationId");
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("trexVerificationId");
    sessionStorage.removeItem("trexUserId");

    window.location.href =
        "../Login/Login.html";

}


/* =========================================
   API HELPER
========================================= */

async function apiRequest(
    endpoint,
    options = {}
) {

    const token =
        getAuthToken();


    if (!token) {

        console.warn(
            "No T-REX authentication token found."
        );

        redirectToLogin();

        return null;

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


    /* =====================================
       SESSION EXPIRED
    ===================================== */

    if (
        response.status === 401
    ) {

        console.warn(
            "T-REX session expired or is invalid."
        );

        redirectToLogin();

        return null;

    }


    const text =
        await response.text();


    let result = {};


    if (text) {

        try {

            result =
                JSON.parse(text);

        } catch (error) {

            console.error(
                "Invalid backend JSON response:",
                text
            );

            throw new Error(
                "The backend returned an invalid response."
            );

        }

    }


    if (
        !response.ok ||
        result.success === false
    ) {

        throw new Error(
            result.message ||
            "Backend request failed."
        );

    }


    return result;

}


/* =========================================
   NAVIGATION
========================================= */

function goDashboard() {

    window.location.href =
        "../Dashboard/Dashboard.html";

}


function goTracking() {

    window.location.href =
        "../Tracking/Tracking.html";

}


function goProfile() {

    /*
        Open the actual Profile page.
        If Profile is a separate folder, use that
        location. Otherwise fall back to Dashboard.
    */

    window.location.href =
        "../Profile/Profile.html";

}


function goSystem() {

    window.location.href =
        "../System/System.html";

}


/* =========================================
   PROFILE HELPERS
========================================= */

function getInitials(name) {

    const safeName =
        String(
            name || ""
        ).trim();


    if (!safeName) {

        return "TR";

    }


    const parts =
        safeName
            .split(/\s+/)
            .filter(Boolean);


    if (
        parts.length === 1
    ) {

        return parts[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();

}


/* =========================================
   LOAD PROFILE
========================================= */

async function loadProfile() {

    try {

        const result =
            await apiRequest(
                "/profile"
            );


        if (!result) {

            return;

        }


        currentProfile =
            result.profile || null;


        if (currentProfile) {

            updateProfileUI(
                currentProfile
            );

        }


    } catch (error) {

        console.error(
            "Failed to load profile:",
            error
        );

    }

}


/* =========================================
   UPDATE PROFILE UI
========================================= */

function updateProfileUI(
    profile
) {

    if (!profile) {

        return;

    }


    const userName =
        String(
            profile.name ||
            "Verified Requester"
        ).trim();


    const initials =
        getInitials(
            userName
        );


    /* =====================================
       COMMON NAME ELEMENTS
    ===================================== */

    const nameSelectors = [

        ".user strong",

        ".profile-mini strong",

        ".user-profile strong",

        "#sidebarProfileName",

        "#topProfileName",

        "#dashboardProfileName",

        "#dashboardProfileFullName",

        "#profileName"

    ];


    const processed =
        new Set();


    nameSelectors.forEach(
        function(selector) {

            document
                .querySelectorAll(selector)
                .forEach(
                    function(element) {

                        if (
                            processed.has(
                                element
                            )
                        ) {

                            return;

                        }


                        element.textContent =
                            userName;


                        processed.add(
                            element
                        );

                    }
                );

        }
    );


    /* =====================================
       AVATAR ELEMENTS
    ===================================== */

    const avatarSelectors = [

        ".avatar",

        ".profile-avatar",

        ".large-avatar",

        "#sidebarProfileAvatar",

        "#topProfileAvatar",

        "#dashboardProfileAvatar"

    ];


    const processedAvatars =
        new Set();


    avatarSelectors.forEach(
        function(selector) {

            document
                .querySelectorAll(selector)
                .forEach(
                    function(element) {

                        if (
                            processedAvatars.has(
                                element
                            )
                        ) {

                            return;

                        }


                        element.textContent =
                            initials;


                        processedAvatars.add(
                            element
                        );

                    }
                );

        }
    );


    /* =====================================
       WELCOME TEXT
    ===================================== */

    const welcomeUserName =
        document.getElementById(
            "welcomeUserName"
        );


    if (welcomeUserName) {

        welcomeUserName.textContent =
            userName.split(" ")[0];

    }


    /* =====================================
       MOBILE
    ===================================== */

    const mobileElement =
        document.getElementById(
            "dashboardProfileMobile"
        );


    if (mobileElement) {

        mobileElement.textContent =
            profile.phone ||
            "Not provided";

    }


    /* =====================================
       AADHAAR LAST FOUR
    ===================================== */

    const aadhaarElement =
        document.getElementById(
            "dashboardProfileAadhaar"
        );


    if (aadhaarElement) {

        if (profile.aadhaarLast4) {

            aadhaarElement.textContent =
                `XXXX XXXX ${profile.aadhaarLast4}`;

        } else {

            aadhaarElement.textContent =
                "Protected";

        }

    }


    /* =====================================
       VERIFICATION STATUS
    ===================================== */

    const verificationElement =
        document.getElementById(
            "dashboardVerificationStatus"
        );


    if (verificationElement) {

        verificationElement.textContent =
            profile.verified
                ? "Verified"
                : "Pending Verification";

    }


    console.log(
        "T-REX Documents profile synchronized:",
        {
            name: userName,
            initials
        }
    );

}


/* =========================================
   LOAD CASES
========================================= */

async function loadCases() {

    try {

        const result =
            await apiRequest(
                "/cases"
            );


        if (!result) {

            return;

        }


        currentCases =
            Array.isArray(
                result.cases
            )
                ? result.cases
                : [];


        console.log(
            "T-REX documents page cases:",
            currentCases
        );


        updateCaseBasedUI();


    } catch (error) {

        console.error(
            "Failed to load cases:",
            error
        );

    }

}


/* =========================================
   LOAD NOTIFICATIONS
========================================= */

async function loadNotifications() {

    try {

        const result =
            await apiRequest(
                "/notifications"
            );


        if (!result) {

            return;

        }


        currentNotifications =
            Array.isArray(
                result.notifications
            )
                ? result.notifications
                : [];


        console.log(
            "T-REX documents page notifications:",
            currentNotifications
        );


        updateNotificationBadges();


    } catch (error) {

        console.error(
            "Failed to load notifications:",
            error
        );

    }

}


/* =========================================
   UPDATE NOTIFICATION BADGES
========================================= */

function updateNotificationBadges() {

    const unreadCount =
        currentNotifications.filter(
            notification =>
                notification.read !== true
        ).length;


    const badges =
        document.querySelectorAll(
            ".menu-badge"
        );


    /*
        Existing Documents.html contains
        sidebar badges for Requests and
        Notifications.
    */

    if (
        badges.length >= 1
    ) {

        badges[0].textContent =
            currentCases.length;

    }


    if (
        badges.length >= 2
    ) {

        badges[1].textContent =
            unreadCount;

    }


    const notificationButtons =
        document.querySelectorAll(
            ".notification b"
        );


    notificationButtons.forEach(
        function(element) {

            element.textContent =
                unreadCount;

        }
    );


    const notificationCount =
        document.getElementById(
            "notificationCount"
        );


    if (notificationCount) {

        notificationCount.textContent =
            unreadCount;

    }


    const sidebarNotificationCount =
        document.getElementById(
            "sidebarNotificationCount"
        );


    if (sidebarNotificationCount) {

        sidebarNotificationCount.textContent =
            unreadCount;

    }

}


/* =========================================
   UPDATE CASE-BASED DOCUMENT UI
========================================= */

function updateCaseBasedUI() {

    const cards =
        document.querySelectorAll(
            ".document-card"
        );


    cards.forEach(
        card => {

            const serviceName =
                card.dataset.name;


            if (!serviceName) {

                return;

            }


            const matchingCases =
                currentCases.filter(
                    caseItem =>
                        String(
                            caseItem.documentName || ""
                        ).toLowerCase() ===
                        serviceName.toLowerCase()
                );


            if (
                matchingCases.length === 0
            ) {

                /*
                    No T-REX request exists
                    for this service yet.
                */

                return;

            }


            const latestCase =
                [...matchingCases]
                    .sort(
                        (a, b) =>
                            new Date(
                                b.createdAt
                            ) -
                            new Date(
                                a.createdAt
                            )
                    )[0];


            updateCardFromCase(
                card,
                latestCase
            );

        }
    );


    updateDocumentStats();

}


/* =========================================
   UPDATE INDIVIDUAL CARD
========================================= */

function updateCardFromCase(
    card,
    caseItem
) {

    if (
        !card ||
        !caseItem
    ) {

        return;

    }


    const statusLabel =
        caseItem.statusLabel ||
        formatCaseStatus(
            caseItem.status
        );


    /* =====================================
       STATUS PILL
    ===================================== */

    const statusPill =
        card.querySelector(
            ".status-pill"
        );


    if (statusPill) {

        statusPill.innerHTML =
            "";


        const icon =
            document.createElement(
                "i"
            );


        statusPill.appendChild(
            icon
        );


        statusPill.appendChild(
            document.createTextNode(
                ` ${statusLabel}`
            )
        );


        statusPill.className =
            "status-pill";


        if (
            caseItem.status ===
            "UNDER_VERIFICATION"
        ) {

            statusPill.classList.add(
                "action-pill"
            );

        } else if (
            caseItem.status ===
            "CLOSED"
        ) {

            statusPill.classList.add(
                "verified-pill"
            );

        } else {

            statusPill.classList.add(
                "active-pill"
            );

        }

    }


    /* =====================================
       PROTECTION STATUS
    ===================================== */

    const protectionStrong =
        card.querySelector(
            ".protection-bar strong"
        );


    if (protectionStrong) {

        protectionStrong.textContent =
            statusLabel;


        protectionStrong.className =
            caseItem.status ===
            "UNDER_VERIFICATION"
                ? "warning-text"
                : "success-text";

    }


    /* =====================================
       PROGRESS
    ===================================== */

    const progress =
        card.querySelector(
            ".progress span"
        );


    if (progress) {

        if (
            caseItem.status ===
            "CLOSED"
        ) {

            progress.style.width =
                "100%";

        } else if (
            caseItem.status ===
            "UNDER_VERIFICATION"
        ) {

            progress.style.width =
                "50%";

        } else {

            progress.style.width =
                "100%";

        }

    }


    card.dataset.caseId =
        caseItem.caseId || "";

}


/* =========================================
   CASE STATUS FORMATTER
========================================= */

function formatCaseStatus(
    status
) {

    const statusMap = {

        UNDER_VERIFICATION:
            "Under Verification",

        SENT_TO_DEPARTMENT:
            "Sent to Department",

        DEPARTMENT_ACTION:
            "Department Action",

        FINAL_APPROVAL:
            "Final Approval",

        CLOSED:
            "Closed",

        COMPLETED:
            "Completed",

        REJECTED:
            "Rejected"

    };


    if (
        statusMap[status]
    ) {

        return statusMap[status];

    }


    if (!status) {

        return "Unknown";

    }


    return String(status)
        .toLowerCase()
        .replace(
            /_/g,
            " "
        )
        .replace(
            /\b\w/g,
            char =>
                char.toUpperCase()
        );

}


/* =========================================
   DOCUMENT STATISTICS
========================================= */

function updateDocumentStats() {

    const cards =
        document.querySelectorAll(
            ".document-card"
        );


    const totalRecords =
        cards.length;


    /*
        These are actual T-REX protection
        cases, not externally verified
        service records.
    */

    const protectedRecords =
        currentCases.length;


    const actionRequired =
        currentCases.filter(
            caseItem =>
                caseItem.status !== "CLOSED" &&
                caseItem.status !== "COMPLETED"
        ).length;


    const verifiedCases =
        currentCases.filter(
            caseItem =>
                caseItem.status === "CLOSED" ||
                caseItem.status === "COMPLETED"
        ).length;


    const statCards =
        document.querySelectorAll(
            ".stat-card"
        );


    if (
        statCards.length >= 4
    ) {

        const linkedStrong =
            statCards[0].querySelector(
                "strong"
            );


        const verifiedStrong =
            statCards[1].querySelector(
                "strong"
            );


        const protectedStrong =
            statCards[2].querySelector(
                "strong"
            );


        const actionStrong =
            statCards[3].querySelector(
                "strong"
            );


        if (linkedStrong) {

            linkedStrong.textContent =
                String(
                    totalRecords
                ).padStart(
                    2,
                    "0"
                );

        }


        if (verifiedStrong) {

            verifiedStrong.textContent =
                `${String(
                    verifiedCases
                ).padStart(
                    2,
                    "0"
                )} / ${String(
                    currentCases.length
                ).padStart(
                    2,
                    "0"
                )}`;

        }


        if (protectedStrong) {

            protectedStrong.textContent =
                String(
                    protectedRecords
                ).padStart(
                    2,
                    "0"
                );

        }


        if (actionStrong) {

            actionStrong.textContent =
                String(
                    actionRequired
                ).padStart(
                    2,
                    "0"
                );

        }

    }


    const documentCountStrong =
        document.querySelector(
            ".document-count strong"
        );


    if (documentCountStrong) {

        documentCountStrong.textContent =
            String(
                totalRecords
            ).padStart(
                2,
                "0"
            );

    }

}


/* =========================================
   DOCUMENT DETAILS
========================================= */

function viewDetails(
    documentName
) {

    selectedDocument =
        documentName;


    const title =
        document.getElementById(
            "modalTitle"
        );


    const service =
        document.getElementById(
            "modalService"
        );


    const description =
        document.getElementById(
            "modalDescription"
        );


    if (title) {

        title.innerText =
            documentName;

    }


    if (service) {

        service.innerText =
            documentName;

    }


    const matchingCases =
        currentCases.filter(
            caseItem =>
                String(
                    caseItem.documentName || ""
                ).toLowerCase() ===
                documentName.toLowerCase()
        );


    const latestCase =
        [...matchingCases]
            .sort(
                (a, b) =>
                    new Date(
                        b.createdAt
                    ) -
                    new Date(
                        a.createdAt
                    )
            )[0];


    if (description) {

        if (latestCase) {

            description.innerText =
                `A protection request for this service is currently ${formatCaseStatus(
                    latestCase.status
                )}.`;

        } else {

            description.innerText =
                "Service information is displayed from the current T-REX service catalogue.";

        }

    }


    const modalStatus =
        document.getElementById(
            "modalStatus"
        );


    if (modalStatus) {

        if (latestCase) {

            modalStatus.innerText =
                latestCase.statusLabel ||
                formatCaseStatus(
                    latestCase.status
                );


            modalStatus.className =
                latestCase.status === "CLOSED" ||
                latestCase.status === "COMPLETED"
                    ? "success-text"
                    : "warning-text";

        } else {

            modalStatus.innerText =
                "No T-REX request submitted";


            modalStatus.className =
                "warning-text";

        }

    }


    const modalDate =
        document.getElementById(
            "modalDate"
        );


    if (
        modalDate &&
        latestCase &&
        latestCase.createdAt
    ) {

        modalDate.innerText =
            formatDate(
                latestCase.createdAt
            );

    } else if (modalDate) {

        modalDate.innerText =
            "No request submitted";

    }


    const modal =
        document.getElementById(
            "detailsModal"
        );


    if (modal) {

        modal.classList.add(
            "show"
        );

    }

}


/* =========================================
   CLOSE MODAL
========================================= */

function closeModal() {

    const modal =
        document.getElementById(
            "detailsModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }

}


/* =========================================
   REQUEST ACTION
========================================= */

function requestAction(
    documentName
) {

    selectedDocument =
        documentName;


    localStorage.setItem(
        "selectedDocument",
        documentName
    );


    localStorage.setItem(
        "selectedAction",
        "Request Protection Action"
    );


    window.location.href =
        "../Request/Request.html";

}


/* =========================================
   REQUEST FROM MODAL
========================================= */

function requestFromModal() {

    if (
        !selectedDocument
    ) {

        return;

    }


    localStorage.setItem(
        "selectedDocument",
        selectedDocument
    );


    localStorage.setItem(
        "selectedAction",
        "Request Protection Action"
    );


    window.location.href =
        "../Request/Request.html";

}


/* =========================================
   SEARCH + FILTER
========================================= */

function filterDocuments() {

    const searchInput =
        document.getElementById(
            "documentSearch"
        );


    const categoryFilter =
        document.getElementById(
            "categoryFilter"
        );


    const statusFilter =
        document.getElementById(
            "statusFilter"
        );


    if (
        !searchInput ||
        !categoryFilter ||
        !statusFilter
    ) {

        return;

    }


    const search =
        searchInput.value
            .toLowerCase()
            .trim();


    const category =
        categoryFilter.value;


    const status =
        statusFilter.value;


    const cards =
        document.querySelectorAll(
            ".document-card"
        );


    let visibleCount = 0;


    cards.forEach(
        card => {

            const name =
                String(
                    card.dataset.name || ""
                ).toLowerCase();


            const cardCategory =
                card.dataset.category || "";


            const cardStatus =
                card.dataset.status || "";


            const matchesSearch =
                name.includes(
                    search
                );


            const matchesCategory =
                category === "all" ||
                cardCategory === category;


            const matchesStatus =
                status === "all" ||
                cardStatus === status;


            if (
                matchesSearch &&
                matchesCategory &&
                matchesStatus
            ) {

                card.style.display =
                    "";

                visibleCount++;

            } else {

                card.style.display =
                    "none";

            }

        }
    );


    const noResults =
        document.getElementById(
            "noResults"
        );


    if (!noResults) {

        return;

    }


    noResults.style.display =
        visibleCount === 0
            ? "block"
            : "none";

}


/* =========================================
   UPDATE DETAILS
========================================= */

function updateDetails() {

    localStorage.setItem(
        "selectedDocument",
        "General Document Update"
    );


    localStorage.setItem(
        "selectedAction",
        "Update Details"
    );


    window.location.href =
        "../Request/Request.html";

}


/* =========================================
   RAISE QUERY
========================================= */

function raiseQuery() {

    localStorage.setItem(
        "selectedDocument",
        "General Query"
    );


    localStorage.setItem(
        "selectedAction",
        "Raise Query"
    );


    window.location.href =
        "../Request/Request.html";

}


/* =========================================
   DOWNLOAD REPORT
========================================= */

function downloadReport() {

    const reportLines = [];


    reportLines.push(
        "T-REX / SafePin Verification Report"
    );


    reportLines.push(
        "===================================="
    );


    reportLines.push(
        `Generated: ${new Date().toLocaleString()}`
    );


    if (currentProfile) {

        reportLines.push(
            `Requester: ${
                currentProfile.name ||
                "Verified Requester"
            }`
        );

    }


    reportLines.push("");


    reportLines.push(
        `Services in prototype catalogue: ${
            document.querySelectorAll(
                ".document-card"
            ).length
        }`
    );


    reportLines.push(
        `T-REX protection cases: ${
            currentCases.length
        }`
    );


    reportLines.push("");


    if (
        currentCases.length === 0
    ) {

        reportLines.push(
            "No protection cases have been created."
        );

    } else {

        reportLines.push(
            "Protection Requests:"
        );


        currentCases.forEach(
            caseItem => {

                reportLines.push(
                    `- Case ${
                        caseItem.caseId
                    }: ${
                        caseItem.documentName
                    } | ${
                        caseItem.action
                    } | ${
                        caseItem.statusLabel ||
                        formatCaseStatus(
                            caseItem.status
                        )
                    }`
                );

            }
        );

    }


    reportLines.push("");


    reportLines.push(
        "Note: External service verification and final deactivation are handled by the respective authorized service provider."
    );


    const blob =
        new Blob(
            [
                reportLines.join("\n")
            ],
            {
                type: "text/plain"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        "trex-verification-report.txt";


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
        url
    );

}


/* =========================================
   SHOW NOTIFICATIONS
========================================= */

async function showNotifications() {

    try {

        const result =
            await apiRequest(
                "/notifications"
            );


        if (!result) {

            return;

        }


        const notifications =
            Array.isArray(
                result.notifications
            )
                ? result.notifications
                : [];


        if (
            notifications.length === 0
        ) {

            alert(
                "You have no notifications."
            );

            return;

        }


        const unread =
            notifications.filter(
                notification =>
                    notification.read !== true
            );


        if (
            unread.length === 0
        ) {

            alert(
                `You have ${
                    notifications.length
                } notification${
                    notifications.length === 1
                        ? ""
                        : "s"
                }. All notifications have been read.`
            );

            return;

        }


        const latest =
            unread
                .slice(0, 3)
                .map(
                    notification =>
                        `• ${
                            notification.title ||
                            "Notification"
                        }\n  ${
                            notification.message ||
                            ""
                        }`
                )
                .join("\n\n");


        alert(
            `You have ${
                unread.length
            } unread notification${
                unread.length === 1
                    ? ""
                    : "s"
            }.\n\n${latest}`
        );


    } catch (error) {

        console.error(
            "Failed to load notifications:",
            error
        );


        alert(
            error.message ||
            "Unable to load notifications."
        );

    }

}


/* =========================================
   LOGOUT
========================================= */

function logout() {

    const confirmLogout =
        confirm(
            "Are you sure you want to logout from T-REX?"
        );


    if (!confirmLogout) {

        return;

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


    /*
        These are workflow selections,
        not authentication data.
    */

    localStorage.removeItem(
        "selectedDocument"
    );


    localStorage.removeItem(
        "selectedAction"
    );


    localStorage.removeItem(
        "caseId"
    );


    window.location.href =
        "../Login/Login.html";

}


/* =========================================
   CLOSE MODAL ON OUTSIDE CLICK
========================================= */

window.addEventListener(
    "click",
    function(event) {

        const modal =
            document.getElementById(
                "detailsModal"
            );


        if (
            modal &&
            event.target === modal
        ) {

            closeModal();

        }

    }
);


/* =========================================
   ESCAPE KEY
========================================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape"
        ) {

            closeModal();

        }

    }
);


/* =========================================
   DATE FORMATTER
========================================= */

function formatDate(
    dateValue
) {

    if (!dateValue) {

        return "-";

    }


    const date =
        new Date(
            dateValue
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "-";

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* =========================================
   INITIALIZATION
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        console.log(
            "Loading T-REX Documents page..."
        );


        /*
            Apply existing UI filters immediately.
        */

        filterDocuments();


        /*
            Load all authenticated backend
            information.

            Profile is the single source of truth
            for the user's identity.
        */

        await Promise.all([
            loadProfile(),
            loadCases(),
            loadNotifications()
        ]);


        /*
            Re-apply filters after backend
            information has loaded.
        */

        filterDocuments();


        console.log(
            "T-REX Documents page loaded successfully."
        );

    }
);
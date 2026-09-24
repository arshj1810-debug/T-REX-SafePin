/* =====================================================
   T-REX DASHBOARD
   Backend Connected + Profile Synchronized Version
===================================================== */

const API_BASE_URL = "/api";


/* =====================================================
   AUTHENTICATION
===================================================== */

function getAuthToken() {

    return sessionStorage.getItem("trexToken");

}


/* =====================================================
   AUTHENTICATED API REQUEST
===================================================== */

async function apiRequest(endpoint, options = {}) {

    const token = getAuthToken();

    if (!token) {

        console.warn(
            "No T-REX authentication token found."
        );

        window.location.href =
            "../Login/Login.html";

        return null;
    }


    const headers = {

        ...(options.headers || {}),

        "Authorization":
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

        response = await fetch(
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


    /* =================================================
       SESSION EXPIRED
    ================================================= */

    if (response.status === 401) {

        sessionStorage.removeItem("trexToken");
        sessionStorage.removeItem("verificationId");
        sessionStorage.removeItem("userId");
        sessionStorage.removeItem("trexVerificationId");
        sessionStorage.removeItem("trexUserId");

        alert(
            "Your session has expired. Please log in again."
        );

        window.location.href =
            "../Login/Login.html";

        return null;
    }


    const text = await response.text();

    let result = {};


    if (text) {

        try {

            result = JSON.parse(text);

        } catch (error) {

            console.error(
                "Invalid backend response:",
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


/* =====================================================
   PROFILE HELPERS
===================================================== */

/*
    Dashboard.html contains some older hardcoded
    profile values.

    Instead of changing the visual design, this function
    replaces those values with the authenticated user's
    actual backend profile.
*/

function getInitials(name) {

    const safeName =
        String(name || "").trim();

    if (!safeName) {
        return "VR";
    }

    const parts =
        safeName
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


function updateDashboardProfile(profile) {

    if (!profile) {
        return;
    }


    const name =
        String(
            profile.name ||
            "Verified Requester"
        ).trim();


    const initials =
        getInitials(name);


    /* =================================================
       SIDEBAR PROFILE
    ================================================= */

    const sidebarName =
        document.querySelector(
            ".profile-mini strong"
        );

    if (sidebarName) {

        sidebarName.textContent =
            name;

    }


    const sidebarAvatar =
        document.querySelector(
            ".profile-mini .profile-avatar"
        );

    if (sidebarAvatar) {

        sidebarAvatar.textContent =
            initials;

    }


    /* =================================================
       TOP PROFILE
    ================================================= */

    const topProfileName =
        document.querySelector(
            ".user-profile strong"
        );

    if (topProfileName) {

        topProfileName.textContent =
            name;

    }


    const topAvatar =
        document.querySelector(
            ".user-profile .avatar"
        );

    if (topAvatar) {

        topAvatar.textContent =
            initials;

    }


    /* =================================================
       WELCOME MESSAGE
    ================================================= */

    const welcomeHeading =
        document.querySelector(
            ".welcome-content h2"
        );

    if (welcomeHeading) {

        welcomeHeading.textContent =
            `Welcome back, ${name.split(" ")[0]}`;

    }


    /* =================================================
       PROFILE PAGE INSIDE DASHBOARD
    ================================================= */

    const largeAvatar =
        document.querySelector(
            ".profile-card-main .large-avatar"
        );

    if (largeAvatar) {

        largeAvatar.textContent =
            initials;

    }


    const profileCardName =
        document.querySelector(
            ".profile-card-main h2"
        );

    if (profileCardName) {

        profileCardName.textContent =
            name;

    }


    /*
        The first profile row is Full Name.
    */

    const profileRows =
        document.querySelectorAll(
            ".profile-information .profile-row"
        );

    if (profileRows.length > 0) {

        const fullNameValue =
            profileRows[0].querySelector("strong");

        if (fullNameValue) {

            fullNameValue.textContent =
                name;

        }
    }


    /* =================================================
       DASHBOARD PREVIEW
    ================================================= */

    const previewUser =
        document.querySelector(
            ".preview-user"
        );

    if (previewUser) {

        const previewInitials =
            previewUser.querySelector("span");

        if (previewInitials) {

            previewInitials.textContent =
                initials;

        }

        /*
            Keep the preview layout but replace only
            the user's name.
        */

        const textNodes =
            Array.from(
                previewUser.childNodes
            ).filter(
                node =>
                    node.nodeType === Node.TEXT_NODE &&
                    node.textContent.trim()
            );

        textNodes.forEach(
            node => {
                node.textContent =
                    ` ${name}`;
            }
        );

    }


    console.log(
        "Dashboard profile synchronized:",
        {
            name,
            initials
        }
    );

}


/* =====================================================
   PAGE NAVIGATION
===================================================== */

function showPage(page) {

    const pages = {

        dashboard:
            document.getElementById(
                "dashboardPage"
            ),

        notifications:
            document.getElementById(
                "notificationsPage"
            ),

        profile:
            document.getElementById(
                "profilePage"
            )

    };


    Object.values(pages).forEach(
        function(section) {

            if (section) {

                section.classList.add(
                    "hidden-page"
                );

            }

        }
    );


    const menuItems =
        document.querySelectorAll(
            ".menu-item"
        );


    menuItems.forEach(
        function(item) {

            item.classList.remove(
                "active"
            );

        }
    );


    /* =================================================
       DASHBOARD
    ================================================= */

    if (
        page === "dashboard" &&
        pages.dashboard
    ) {

        pages.dashboard.classList.remove(
            "hidden-page"
        );


        setPageHeader(
            "Dashboard",
            "Secure identity protection overview",
            "Dashboard"
        );


        activateMenuItem(0);

    }


    /* =================================================
       NOTIFICATIONS
    ================================================= */

    if (
        page === "notifications" &&
        pages.notifications
    ) {

        pages.notifications.classList.remove(
            "hidden-page"
        );


        setPageHeader(
            "Notifications",
            "Updates about your records and protection requests",
            "Notifications"
        );


        activateMenuItem(3);

        loadNotifications();

    }


    /* =================================================
       PROFILE
    ================================================= */

    if (
        page === "profile" &&
        pages.profile
    ) {

        pages.profile.classList.remove(
            "hidden-page"
        );


        setPageHeader(
            "Profile",
            "Your verified profile information",
            "Profile"
        );


        activateMenuItem(4);

        loadProfile();

    }

}


/* =====================================================
   PAGE HEADER
===================================================== */

function setPageHeader(
    title,
    subtitle,
    breadcrumb
) {

    const pageTitle =
        document.getElementById(
            "pageTitle"
        );

    const pageSubtitle =
        document.getElementById(
            "pageSubtitle"
        );

    const breadcrumbPage =
        document.getElementById(
            "breadcrumbPage"
        );


    if (pageTitle) {

        pageTitle.innerText =
            title;

    }


    if (pageSubtitle) {

        pageSubtitle.innerText =
            subtitle;

    }


    if (breadcrumbPage) {

        breadcrumbPage.innerText =
            breadcrumb;

    }

}


/* =====================================================
   MENU ACTIVE STATE
===================================================== */

function activateMenuItem(index) {

    const items =
        document.querySelectorAll(
            ".menu-item"
        );


    if (items[index]) {

        items[index].classList.add(
            "active"
        );

    }

}


/* =====================================================
   LOAD PROFILE
===================================================== */

async function loadProfile() {

    try {

        const result =
            await apiRequest(
                "/profile"
            );


        if (!result || !result.profile) {

            throw new Error(
                "Profile information was not returned by the backend."
            );

        }


        updateDashboardProfile(
            result.profile
        );


        updateProfileInformation(
            result.profile
        );


    } catch (error) {

        console.error(
            "Dashboard profile loading failed:",
            error
        );

    }

}


/* =====================================================
   UPDATE PROFILE INFORMATION
===================================================== */

function updateProfileInformation(profile) {

    if (!profile) {
        return;
    }


    const name =
        profile.name ||
        "Verified Requester";


    const email =
        profile.email ||
        "Not provided";


    const phone =
        profile.phone ||
        "Not provided";


    const profileRows =
        document.querySelectorAll(
            ".profile-information .profile-row"
        );


    if (profileRows.length >= 5) {

        /*
            Row 1 = Full Name
        */

        const nameValue =
            profileRows[0].querySelector(
                "strong"
            );

        if (nameValue) {

            nameValue.textContent =
                name;

        }


        /*
            Row 2 = Verification Status
        */

        const verificationValue =
            profileRows[1].querySelector(
                "strong"
            );

        if (verificationValue) {

            verificationValue.textContent =
                profile.verified
                    ? "✓ Verified"
                    : "Pending";

        }


        /*
            Row 3 = Aadhaar
        */

        const aadhaarValue =
            profileRows[2].querySelector(
                "strong"
            );

        if (
            aadhaarValue &&
            profile.aadhaarLast4
        ) {

            aadhaarValue.textContent =
                `XXXX XXXX ${profile.aadhaarLast4}`;

        }


        /*
            Row 4 = Mobile
        */

        const mobileValue =
            profileRows[3].querySelector(
                "strong"
            );

        if (mobileValue) {

            mobileValue.textContent =
                phone;

        }


        /*
            Row 5 = Account Security
        */

        const securityValue =
            profileRows[4].querySelector(
                "strong"
            );

        if (securityValue) {

            securityValue.textContent =
                "Secure";

        }

    }


    /*
        Email is not currently displayed by the
        Dashboard HTML, so we don't create a new
        visual element here.
    */

    console.log(
        "Dashboard profile information updated:",
        {
            name,
            email,
            phone
        }
    );

}


/* =====================================================
   LOAD REAL DASHBOARD DATA
===================================================== */

async function loadDashboardData() {

    try {

        console.log(
            "Loading T-REX dashboard data..."
        );


        const [
            profile,
            cases,
            notifications,
            security
        ] = await Promise.all([

            apiRequest(
                "/profile"
            ),

            apiRequest(
                "/cases"
            ),

            apiRequest(
                "/notifications"
            ),

            apiRequest(
                "/security/protection"
            )

        ]);


        console.log(
            "Profile:",
            profile
        );


        console.log(
            "Cases:",
            cases
        );


        console.log(
            "Notifications:",
            notifications
        );


        console.log(
            "Security:",
            security
        );


        if (profile?.profile) {

            updateDashboardProfile(
                profile.profile
            );

            updateProfileInformation(
                profile.profile
            );

        }


        updateDashboard(
            profile,
            cases,
            notifications,
            security
        );


        renderRecentRequests(
            cases?.cases || []
        );


        renderDashboardActivity(
            cases?.cases || [],
            notifications?.notifications || []
        );


        renderDashboardNotifications(
            notifications?.notifications || []
        );


    } catch (error) {

        console.error(
            "Dashboard data loading failed:",
            error
        );

    }

}


/* =====================================================
   UPDATE DASHBOARD STATISTICS
===================================================== */

function updateDashboard(
    profile,
    cases,
    notifications,
    security
) {

    console.log(
        "T-REX dashboard data received successfully."
    );


    const caseList =
        Array.isArray(
            cases?.cases
        )
            ? cases.cases
            : [];


    const notificationList =
        Array.isArray(
            notifications?.notifications
        )
            ? notifications.notifications
            : [];


    const unreadNotifications =
        notificationList.filter(
            notification =>
                notification.read !== true
        ).length;


    const securityActive =
        security?.active === true;


    const totalCases =
        caseList.length;


    /* =================================================
       PROTECTED RECORDS
    ================================================= */

    const protectedRecords =
        document.getElementById(
            "protectedRecordsCount"
        );


    if (protectedRecords) {

        protectedRecords.innerText =
            String(totalCases).padStart(
                2,
                "0"
            );

    }


    /* =================================================
       ACTIVE REQUESTS
    ================================================= */

    const activeRequests =
        document.getElementById(
            "activeRequestsCount"
        );


    if (activeRequests) {

        const activeCaseCount =
            caseList.filter(
                item =>
                    item.status !== "CLOSED" &&
                    item.status !== "COMPLETED"
            ).length;


        activeRequests.innerText =
            String(activeCaseCount).padStart(
                2,
                "0"
            );

    }


    /* =================================================
       VERIFIED RECORDS
    ================================================= */

    const verifiedRecords =
        document.getElementById(
            "verifiedRecordsCount"
        );


    if (verifiedRecords) {

        const verifiedCount =
            caseList.filter(
                item =>
                    item.status !== "REJECTED"
            ).length;


        verifiedRecords.innerText =
            `${String(
                verifiedCount
            ).padStart(2, "0")}/` +
            `${String(
                totalCases
            ).padStart(2, "0")}`;

    }


    /* =================================================
       SECURITY STATUS
    ================================================= */

    const securityStatus =
        document.getElementById(
            "securityStatus"
        );


    if (securityStatus) {

        securityStatus.innerText =
            securityActive
                ? "Protected"
                : "Secure";

    }


    /* =================================================
       PROTECTION SCORE
    ================================================= */

    const protectionScore =
        document.getElementById(
            "protectionScore"
        );


    if (protectionScore) {

        protectionScore.innerText =
            securityActive
                ? "100%"
                : "0%";

    }


    /* =================================================
       NOTIFICATION COUNTERS
    ================================================= */

    updateNotificationCounters(
        unreadNotifications
    );


    /*
        Update static dashboard text that previously
        claimed there were always 6 records / 2 requests.
    */

    updateDashboardProtectionDetails(
        totalCases,
        caseList
    );

}


/* =====================================================
   UPDATE NOTIFICATION COUNTERS
===================================================== */

function updateNotificationCounters(
    unreadCount
) {

    const ids = [
        "notificationCount",
        "sideNotificationCount"
    ];


    ids.forEach(
        function(id) {

            const element =
                document.getElementById(id);

            if (element) {

                element.innerText =
                    String(unreadCount);

            }

        }
    );


    /*
        Dashboard.html currently has notification
        buttons without IDs, so update them safely.
    */

    const notificationButton =
        document.querySelector(
            ".notification-button b"
        );


    if (notificationButton) {

        notificationButton.textContent =
            String(unreadCount);

    }


    const notificationMenuCount =
        document.querySelector(
            ".menu-item .notification-count"
        );


    if (notificationMenuCount) {

        notificationMenuCount.textContent =
            String(unreadCount);

    }


    const notificationQuickAction =
        document.querySelector(
            ".quick-actions button:nth-child(3) small"
        );


    if (notificationQuickAction) {

        notificationQuickAction.textContent =
            unreadCount === 1
                ? "1 new update"
                : `${unreadCount} new updates`;

    }

}


/* =====================================================
   UPDATE PROTECTION DETAILS
===================================================== */

function updateDashboardProtectionDetails(
    totalCases,
    caseList
) {

    const linkedRecordText =
        document.querySelector(
            ".protection-item:nth-child(2) span"
        );


    if (linkedRecordText) {

        linkedRecordText.textContent =
            `${totalCases} record${totalCases === 1 ? "" : "s"} identified`;

    }


    const requestText =
        document.querySelector(
            ".protection-item:nth-child(3) span"
        );


    if (requestText) {

        const activeCount =
            caseList.filter(
                item =>
                    item.status !== "CLOSED" &&
                    item.status !== "COMPLETED"
            ).length;


        requestText.textContent =
            `${activeCount} request${activeCount === 1 ? "" : "s"} in progress`;

    }

}


/* =====================================================
   RENDER RECENT REQUESTS
===================================================== */

function renderRecentRequests(
    cases
) {

    const panel =
        document.querySelector(
            ".requests-panel"
        );


    if (!panel) {
        return;
    }


    const safeCases =
        Array.isArray(cases)
            ? cases
            : [];


    /*
        Keep the existing column header.
    */

    const heading =
        panel.querySelector(
            ".request-heading"
        );


    /*
        Remove old hardcoded request rows.
    */

    panel
        .querySelectorAll(
            ".request-row:not(.request-heading)"
        )
        .forEach(
            row => row.remove()
        );


    if (safeCases.length === 0) {

        const emptyRow =
            document.createElement(
                "div"
            );

        emptyRow.className =
            "request-row";


        emptyRow.innerHTML = `
            <span>
                No cases
            </span>

            <span>
                No protection requests submitted
            </span>

            <span>
                —
            </span>

            <span>
                —
            </span>

            <span class="request-status">
                No activity
            </span>
        `;


        panel.appendChild(
            emptyRow
        );

        return;
    }


    safeCases
        .slice(0, 5)
        .forEach(
            function(caseItem) {

                const row =
                    document.createElement(
                        "div"
                    );

                row.className =
                    "request-row";


                const date =
                    formatDate(
                        caseItem.createdAt
                    );


                const status =
                    caseItem.statusLabel ||
                    formatStatus(
                        caseItem.status
                    );


                const statusClass =
                    getStatusClass(
                        caseItem.status
                    );


                row.innerHTML = `
                    <span class="case-id">
                        #${escapeHtml(caseItem.caseId || "—")}
                    </span>

                    <span>
                        ${escapeHtml(
                            caseItem.action ||
                            "Protection Request"
                        )}
                    </span>

                    <span>
                        ${escapeHtml(
                            caseItem.documentName ||
                            "—"
                        )}
                    </span>

                    <span>
                        ${escapeHtml(date)}
                    </span>

                    <span class="request-status ${statusClass}">
                        ● ${escapeHtml(status)}
                    </span>
                `;


                panel.appendChild(
                    row
                );

            }
        );

}


/* =====================================================
   RENDER DASHBOARD ACTIVITY
===================================================== */

function renderDashboardActivity(
    cases,
    notifications
) {

    const timeline =
        document.querySelector(
            ".activity-timeline"
        );


    if (!timeline) {
        return;
    }


    timeline.innerHTML = "";


    const events = [];


    /*
        Convert actual cases into dashboard activity.
    */

    if (Array.isArray(cases)) {

        cases
            .slice(0, 3)
            .forEach(
                function(caseItem) {

                    events.push({

                        icon: "✓",

                        title:
                            "Protection request submitted",

                        description:
                            `${caseItem.action || "Request"} request for ${caseItem.documentName || "service"} was submitted.`,

                        time:
                            caseItem.createdAt,

                        warning:
                            false

                    });

                }
            );

    }


    /*
        Add actual notifications.
    */

    if (Array.isArray(notifications)) {

        notifications
            .slice(0, 3)
            .forEach(
                function(notification) {

                    events.push({

                        icon:
                            notification.icon ||
                            "✓",

                        title:
                            notification.title ||
                            "Notification received",

                        description:
                            notification.message ||
                            "A new notification was received.",

                        time:
                            notification.createdAt,

                        warning:
                            notification.priority === "high"

                    });

                }
            );

    }


    if (events.length === 0) {

        const empty =
            document.createElement(
                "div"
            );

        empty.className =
            "activity-item";


        empty.innerHTML = `
            <div class="activity-dot">
                ✓
            </div>

            <div>
                <strong>
                    No recent activity
                </strong>

                <p>
                    Your T-REX activity will appear here.
                </p>

                <small>
                    No activity recorded
                </small>
            </div>
        `;


        timeline.appendChild(
            empty
        );

        return;
    }


    events
        .slice(0, 5)
        .forEach(
            function(event) {

                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    "activity-item";


                item.innerHTML = `
                    <div class="activity-dot ${event.warning ? "warning-dot" : ""}">
                        ${escapeHtml(event.icon)}
                    </div>

                    <div>

                        <strong>
                            ${escapeHtml(event.title)}
                        </strong>

                        <p>
                            ${escapeHtml(event.description)}
                        </p>

                        <small>
                            ${escapeHtml(
                                formatDateTime(event.time)
                            )}
                        </small>

                    </div>
                `;


                timeline.appendChild(
                    item
                );

            }
        );

}


/* =====================================================
   DASHBOARD NOTIFICATIONS
===================================================== */

function renderDashboardNotifications(
    notifications
) {

    const list =
        document.querySelector(
            "#notificationsPage .notification-list"
        );


    if (!list) {
        return;
    }


    list.innerHTML = "";


    if (
        !Array.isArray(notifications) ||
        notifications.length === 0
    ) {

        list.innerHTML = `
            <div class="notification-item">
                <div class="notification-icon">
                    ✓
                </div>

                <div>
                    <strong>
                        No notifications
                    </strong>

                    <p>
                        New T-REX updates will appear here.
                    </p>

                    <small>
                        No notifications available
                    </small>
                </div>
            </div>
        `;

        return;
    }


    notifications
        .slice(0, 10)
        .forEach(
            function(notification) {

                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    notification.read
                        ? "notification-item"
                        : "notification-item unread";


                item.innerHTML = `
                    <div class="notification-icon">
                        ${escapeHtml(
                            notification.icon ||
                            "✓"
                        )}
                    </div>

                    <div>

                        <strong>
                            ${escapeHtml(
                                notification.title ||
                                "T-REX Notification"
                            )}
                        </strong>

                        <p>
                            ${escapeHtml(
                                notification.message ||
                                ""
                            )}
                        </p>

                        <small>
                            ${escapeHtml(
                                formatDateTime(
                                    notification.createdAt
                                )
                            )}
                        </small>

                    </div>
                `;


                list.appendChild(
                    item
                );

            }
        );

}


/* =====================================================
   LOAD NOTIFICATIONS
===================================================== */

async function loadNotifications() {

    try {

        const result =
            await apiRequest(
                "/notifications"
            );


        const notifications =
            Array.isArray(
                result?.notifications
            )
                ? result.notifications
                : [];


        renderDashboardNotifications(
            notifications
        );


        updateNotificationCounters(
            notifications.filter(
                item =>
                    item.read !== true
            ).length
        );


    } catch (error) {

        console.error(
            "Unable to load notifications:",
            error
        );

    }

}


/* =====================================================
   DOCUMENTS
===================================================== */

function openDocuments() {

    window.location.href =
        "../Documents/Documents.html";

}


/* =====================================================
   REQUESTS / TRACKING
===================================================== */

function openRequests() {

    window.location.href =
        "../Tracking/Tracking.html";

}


/* =====================================================
   SYSTEM OVERVIEW
===================================================== */

function openSystemOverview() {

    window.location.href =
        "../System/System.html";

}


/* =====================================================
   REQUEST DOCUMENT
===================================================== */

function requestDocument(
    documentName
) {

    localStorage.setItem(
        "selectedDocument",
        documentName
    );


    window.location.href =
        "../Request/Request.html";

}


/* =====================================================
   LOGOUT
===================================================== */

function logout() {

    const confirmLogout =
        confirm(
            "Are you sure you want to logout?"
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
        Do not remove caseId here.
        It is not an authentication credential.
    */

    window.location.href =
        "../Login/Login.html";

}


/* =====================================================
   BACKEND CONNECTION TEST
===================================================== */

async function testBackendConnection() {

    try {

        const result =
            await apiRequest(
                "/health"
            );


        if (result) {

            console.log(
                "T-REX backend connected:",
                result
            );

        }

    } catch (error) {

        console.error(
            "T-REX backend connection failed:",
            error
        );

    }

}


/* =====================================================
   FORMATTERS
===================================================== */

function formatDate(value) {

    if (!value) {
        return "—";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";

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


function formatDateTime(value) {

    if (!value) {
        return "—";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";

    }


    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


function formatStatus(status) {

    const map = {

        UNDER_VERIFICATION:
            "Under Verification",

        IN_PROGRESS:
            "In Progress",

        COMPLETED:
            "Completed",

        CLOSED:
            "Closed",

        REJECTED:
            "Rejected"

    };


    return (
        map[status] ||
        status ||
        "Pending"
    );

}


function getStatusClass(status) {

    if (
        status === "COMPLETED" ||
        status === "CLOSED"
    ) {

        return "complete";

    }


    if (
        status === "UNDER_VERIFICATION"
    ) {

        return "review";

    }


    return "progress";

}


/* =====================================================
   HTML ESCAPE
===================================================== */

function escapeHtml(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =====================================================
   DASHBOARD INITIALIZATION
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        console.log(
            "Initializing T-REX Dashboard..."
        );


        /*
            Dashboard opens first.
        */

        showPage(
            "dashboard"
        );


        /*
            Check backend separately.
        */

        testBackendConnection();


        /*
            Load profile, cases,
            notifications and security.
        */

        await loadDashboardData();


        console.log(
            "T-REX Dashboard initialized successfully."
        );

    }
);
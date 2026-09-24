/* =========================================================
   T-REX - NOTIFICATION SYSTEM
   Backend Connected Version
   Profile + Notifications Synchronized
========================================================= */

const API_BASE_URL = "http://localhost:5000/api";

let notifications = [];
let currentFilter = "all";
let currentProfile = null;


/* =========================================================
   AUTHENTICATION
========================================================= */

function getAuthToken() {
    return sessionStorage.getItem("trexToken");
}


function redirectToLogin() {
    sessionStorage.removeItem("trexToken");
    sessionStorage.removeItem("trexVerificationId");
    sessionStorage.removeItem("trexUserId");

    window.location.href = "../Login/Login.html";
}


/* =========================================================
   API REQUEST
========================================================= */

async function apiRequest(endpoint, options = {}) {

    const token = getAuthToken();

    if (!token) {
        console.warn("No T-REX authentication token found.");
        redirectToLogin();
        return null;
    }

    const headers = {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
    };

    if (
        options.body &&
        !headers["Content-Type"]
    ) {
        headers["Content-Type"] = "application/json";
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

    if (response.status === 401) {

        console.warn(
            "T-REX session expired or is invalid."
        );

        redirectToLogin();
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


/* =========================================================
   PROFILE
========================================================= */

async function loadProfile() {

    try {

        console.log(
            "Loading T-REX profile for Notifications page..."
        );

        const result =
            await apiRequest("/profile");

        if (!result) {
            return;
        }

        currentProfile =
            result.user ||
            result.profile ||
            result.data ||
            null;

        if (!currentProfile) {

            console.warn(
                "No profile object returned by backend."
            );

            return;
        }

        console.log(
            "T-REX notification profile loaded:",
            currentProfile
        );

        updateProfileUI();

    } catch (error) {

        console.error(
            "Failed to load T-REX profile:",
            error
        );
    }
}


/* =========================================================
   PROFILE UI
========================================================= */

function getInitials(name) {

    const value =
        String(name || "").trim();

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


function updateProfileUI() {

    if (!currentProfile) {
        return;
    }

    const name =
        String(
            currentProfile.name ||
            currentProfile.fullName ||
            currentProfile.userName ||
            "Verified Requester"
        ).trim();

    const initials =
        getInitials(name);


    /* =====================================================
       SIDEBAR PROFILE
    ===================================================== */

    const sidebarName =
        document.getElementById(
            "notificationsProfileName"
        );

    if (sidebarName) {
        sidebarName.textContent = name;
    }


    const sidebarAvatar =
        document.getElementById(
            "notificationsProfileAvatar"
        );

    if (sidebarAvatar) {
        sidebarAvatar.textContent = initials;
    }


    /* =====================================================
       TOPBAR PROFILE
    ===================================================== */

    const topName =
        document.getElementById(
            "notificationsTopProfileName"
        );

    if (topName) {
        topName.textContent = name;
    }


    const topAvatar =
        document.getElementById(
            "notificationsTopProfileAvatar"
        );

    if (topAvatar) {
        topAvatar.textContent = initials;
    }


    /* =====================================================
       FALLBACK / GENERIC PROFILE SELECTORS
       Keeps compatibility with older HTML versions.
    ===================================================== */

    document
        .querySelectorAll(
            ".user strong, .profile-mini strong, .user-profile strong"
        )
        .forEach(element => {
            element.textContent = name;
        });


    document
        .querySelectorAll(
            ".avatar, .profile-avatar"
        )
        .forEach(element => {
            element.textContent = initials;
        });
}


/* =========================================================
   LOAD NOTIFICATIONS
========================================================= */

async function loadNotifications() {

    try {

        console.log(
            "Loading T-REX notifications..."
        );

        const result =
            await apiRequest(
                "/notifications"
            );

        if (!result) {
            return;
        }

        notifications =
            Array.isArray(
                result.notifications
            )
                ? result.notifications
                : [];

        console.log(
            "T-REX notifications loaded:",
            notifications
        );

        renderNotifications(
            currentFilter
        );

    } catch (error) {

        console.error(
            "Failed to load T-REX notifications:",
            error
        );

        notifications = [];

        renderNotifications(
            currentFilter
        );

        showBackendError(
            error.message
        );
    }
}


/* =========================================================
   RENDER NOTIFICATIONS
========================================================= */

function renderNotifications(filter = "all") {

    const list =
        document.getElementById(
            "notificationList"
        );

    const empty =
        document.getElementById(
            "emptyState"
        );

    if (!list || !empty) {
        return;
    }

    let filtered =
        [...notifications];


    /* ================= FILTER ================= */

    if (filter === "unread") {

        filtered =
            notifications.filter(
                item =>
                    item.read !== true
            );
    }


    if (
        filter === "request" ||
        filter === "security" ||
        filter === "system"
    ) {

        filtered =
            notifications.filter(
                item =>
                    item.type === filter
            );
    }


    /* ================= EMPTY STATE ================= */

    if (filtered.length === 0) {

        list.innerHTML = "";

        empty.style.display = "block";

        updateStatistics();

        return;
    }

    empty.style.display = "none";


    /* ================= SORT ================= */

    filtered.sort(
        (a, b) => {

            if (a.read !== b.read) {

                return a.read
                    ? 1
                    : -1;
            }

            return (
                new Date(
                    b.createdAt || 0
                ) -
                new Date(
                    a.createdAt || 0
                )
            );
        }
    );


    /* ================= CREATE HTML ================= */

    list.innerHTML =
        filtered
            .map(
                notification =>
                    createNotificationHTML(
                        notification
                    )
            )
            .join("");


    updateStatistics();
}


/* =========================================================
   CREATE NOTIFICATION CARD
========================================================= */

function createNotificationHTML(notification) {

    const unreadClass =
        notification.read
            ? "read"
            : "unread";

    const priority =
        notification.priority ||
        "normal";

    const priorityText =
        priority.toUpperCase();

    const icon =
        notification.icon ||
        getNotificationIcon(
            notification.type
        );

    const caseHTML =
        notification.caseId
            ? `
                <span class="case">
                    ${escapeHTML(
                        notification.caseId
                    )}
                </span>
            `
            : "";

    const time =
        formatNotificationTime(
            notification
        );

    const title =
        escapeHTML(
            notification.title ||
            "Notification"
        );

    const message =
        escapeHTML(
            notification.message ||
            ""
        );

    return `

        <div
            class="notification-card ${unreadClass}"
            data-id="${escapeHTML(
                notification.id
            )}"
        >

            <div
                class="notification-icon ${escapeHTML(
                    notification.type || "system"
                )}"
            >
                ${icon}
            </div>


            <div class="notification-body">

                <div class="notification-top">

                    <h3>
                        ${title}
                    </h3>

                    <span
                        class="priority ${escapeHTML(
                            priority
                        )}"
                    >
                        ${priorityText}
                    </span>

                </div>


                <p>
                    ${message}
                </p>


                <div class="notification-meta">

                    <span>
                        ${escapeHTML(time)}
                    </span>

                    ${caseHTML}

                </div>

            </div>


            <div
                class="notification-card-actions"
            >

                ${
                    !notification.read
                        ? `<span class="unread-dot"></span>`
                        : ""
                }


                <button
                    class="read-btn"
                    onclick="toggleRead('${escapeJS(
                        notification.id
                    )}')"
                >

                    ${
                        notification.read
                            ? "Mark unread"
                            : "Mark as read"
                    }

                </button>

            </div>

        </div>

    `;
}


/* =========================================================
   NOTIFICATION ICON
========================================================= */

function getNotificationIcon(type) {

    const icons = {
        request: "📋",
        success: "✓",
        security: "🔐",
        system: "⚙"
    };

    return (
        icons[type] ||
        "🔔"
    );
}


/* =========================================================
   READ / UNREAD
========================================================= */

async function toggleRead(notificationId) {

    const notification =
        notifications.find(
            item =>
                String(item.id) ===
                String(notificationId)
        );

    if (!notification) {

        console.warn(
            "Notification not found:",
            notificationId
        );

        return;
    }


    /*
       Current backend provides the
       "mark as read" endpoint.

       An already-read notification
       cannot currently be changed back
       to unread from the backend.
    */

    if (notification.read) {

        alert(
            "This notification is already marked as read."
        );

        return;
    }


    try {

        const result =
            await apiRequest(
                `/notifications/${encodeURIComponent(
                    notification.id
                )}/read`,
                {
                    method: "PATCH"
                }
            );

        if (!result) {
            return;
        }


        if (result.notification) {

            const index =
                notifications.findIndex(
                    item =>
                        String(item.id) ===
                        String(
                            result.notification.id
                        )
                );

            if (index !== -1) {

                notifications[index] =
                    result.notification;
            }

        } else {

            notification.read = true;
        }


        renderNotifications(
            currentFilter
        );

    } catch (error) {

        console.error(
            "Failed to mark notification as read:",
            error
        );

        alert(
            error.message ||
            "Unable to update notification."
        );
    }
}


/* =========================================================
   MARK ALL AS READ
========================================================= */

async function markAllRead() {

    const unread =
        notifications.filter(
            notification =>
                notification.read !== true
        );

    if (unread.length === 0) {
        return;
    }

    try {

        await Promise.all(
            unread.map(
                notification =>
                    apiRequest(
                        `/notifications/${encodeURIComponent(
                            notification.id
                        )}/read`,
                        {
                            method: "PATCH"
                        }
                    )
            )
        );


        /*
           Reload from backend so the page
           always reflects actual server state.
        */

        await loadNotifications();

    } catch (error) {

        console.error(
            "Failed to mark all notifications as read:",
            error
        );

        alert(
            error.message ||
            "Unable to mark all notifications as read."
        );
    }
}


/* =========================================================
   CLEAR READ
========================================================= */

function clearReadNotifications() {

    /*
       There is currently no backend endpoint
       for permanently deleting notifications.

       Do not remove them locally because that
       would make the UI disagree with the backend.
    */

    const readCount =
        notifications.filter(
            notification =>
                notification.read === true
        ).length;

    if (readCount === 0) {

        alert(
            "There are no read notifications to clear."
        );

        return;
    }

    alert(
        "Read notifications are retained in the T-REX audit history. A delete endpoint is not enabled in the current backend."
    );
}


/* =========================================================
   FILTER
========================================================= */

function filterNotifications(
    filter,
    button
) {

    currentFilter =
        filter;

    document
        .querySelectorAll(
            ".filter"
        )
        .forEach(
            item =>
                item.classList.remove(
                    "active"
                )
        );

    if (button) {

        button.classList.add(
            "active"
        );
    }

    renderNotifications(
        filter
    );
}


/* =========================================================
   STATISTICS
========================================================= */

function updateStatistics() {

    const total =
        notifications.length;

    const unread =
        notifications.filter(
            item =>
                item.read !== true
        ).length;

    const security =
        notifications.filter(
            item =>
                item.type === "security"
        ).length;

    const requests =
        notifications.filter(
            item =>
                item.type === "request"
        ).length;


    const totalCount =
        document.getElementById(
            "totalCount"
        );

    const unreadCount =
        document.getElementById(
            "unreadCount"
        );

    const pendingCount =
        document.getElementById(
            "pendingCount"
        );

    const securityCount =
        document.getElementById(
            "securityCount"
        );

    const requestCount =
        document.getElementById(
            "requestCount"
        );

    const allBadge =
        document.getElementById(
            "allBadge"
        );

    const unreadBadge =
        document.getElementById(
            "unreadBadge"
        );


    if (totalCount) {
        totalCount.textContent = total;
    }

    if (unreadCount) {
        unreadCount.textContent = unread;
    }

    /*
       "Pending" currently represents
       unread notifications because the
       backend does not have a separate
       pending-notification state.
    */

    if (pendingCount) {
        pendingCount.textContent = unread;
    }

    if (securityCount) {
        securityCount.textContent = security;
    }

    if (requestCount) {
        requestCount.textContent = requests;
    }

    if (allBadge) {
        allBadge.textContent = total;
    }

    if (unreadBadge) {
        unreadBadge.textContent = unread;
    }


    /* ================= SIDEBAR BADGE ================= */

    const sideCount =
        document.getElementById(
            "sideCount"
        );

    if (!sideCount) {
        return;
    }

    if (unread === 0) {

        sideCount.textContent = "";

        sideCount.style.display =
            "none";

    } else {

        sideCount.textContent =
            unread;

        sideCount.style.display =
            "flex";
    }
}


/* =========================================================
   REFRESH
========================================================= */

async function refreshNotifications(button) {

    if (!button) {
        return;
    }

    const oldText =
        button.textContent;

    button.textContent =
        "↻ Refreshing...";

    button.disabled = true;

    try {

        /*
           Refresh both profile and
           notification data so the page
           stays synchronized with backend.
        */

        await Promise.all([
            loadProfile(),
            loadNotifications()
        ]);

    } catch (error) {

        console.error(
            "Refresh failed:",
            error
        );

    } finally {

        button.textContent =
            oldText;

        button.disabled = false;
    }
}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

    sessionStorage.removeItem(
        "trexToken"
    );

    sessionStorage.removeItem(
        "trexVerificationId"
    );

    sessionStorage.removeItem(
        "trexUserId"
    );


    localStorage.removeItem(
        "selectedDocument"
    );

    localStorage.removeItem(
        "selectedAction"
    );

    localStorage.removeItem(
        "caseId"
    );


    /*
       Explicitly return to login page.
    */

    window.location.href =
        "../Login/Login.html";
}


/* =========================================================
   BACKEND ERROR DISPLAY
========================================================= */

function showBackendError(message) {

    const list =
        document.getElementById(
            "notificationList"
        );

    const empty =
        document.getElementById(
            "emptyState"
        );

    if (!list || !empty) {
        return;
    }

    list.innerHTML = `

        <div
            class="notification-card unread"
        >

            <div
                class="notification-icon security"
            >
                ⚠
            </div>


            <div class="notification-body">

                <div class="notification-top">

                    <h3>
                        Unable to load notifications
                    </h3>

                </div>


                <p>
                    ${escapeHTML(
                        message ||
                        "Please try again."
                    )}
                </p>

            </div>

        </div>

    `;

    empty.style.display =
        "none";
}


/* =========================================================
   TIME FORMATTER
========================================================= */

function formatNotificationTime(
    notification
) {

    if (notification.createdAt) {

        const date =
            new Date(
                notification.createdAt
            );

        if (
            !Number.isNaN(
                date.getTime()
            )
        ) {

            const now =
                new Date();

            const difference =
                now.getTime() -
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

                return `${minutes} minute${
                    minutes === 1
                        ? ""
                        : "s"
                } ago`;
            }

            const hours =
                Math.floor(
                    minutes / 60
                );

            if (hours < 24) {

                return `${hours} hour${
                    hours === 1
                        ? ""
                        : "s"
                } ago`;
            }

            const days =
                Math.floor(
                    hours / 24
                );

            if (days === 1) {
                return "Yesterday";
            }

            return `${days} days ago`;
        }
    }

    return "Recently";
}


/* =========================================================
   HTML ESCAPING
========================================================= */

function escapeHTML(value) {

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


/* =========================================================
   JAVASCRIPT STRING ESCAPING
========================================================= */

function escapeJS(value) {

    return String(
        value ?? ""
    )
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /'/g,
            "\\'"
        )
        .replace(
            /"/g,
            '\\"'
        );
}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        console.log(
            "Loading T-REX Notifications page..."
        );


        /*
           Load profile and notifications
           from the same authenticated backend
           session.
        */

        await Promise.all([
            loadProfile(),
            loadNotifications()
        ]);


        console.log(
            "T-REX Notifications page loaded successfully."
        );
    }
);
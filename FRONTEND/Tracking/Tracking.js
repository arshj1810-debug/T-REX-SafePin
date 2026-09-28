/* =========================================================
   SAFEPIN - REQUEST TRACKING
   Backend Connected + Dynamic Timeline
   ========================================================= */

const API_BASE_URL = "/api";

let caseId = "";
let documentName = "";
let actionName = "";
let reason = "";
let status = "";
let currentCase = null;
let currentProfile = null;


/* =========================================================
   AUTHENTICATION
   ========================================================= */

function getAuthToken() {
    return sessionStorage.getItem("trexToken");
}


/* =========================================================
   SESSION CLEANUP
   ========================================================= */

function clearSession() {

    sessionStorage.removeItem("trexToken");
    sessionStorage.removeItem("verificationId");
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("trexVerificationId");
    sessionStorage.removeItem("trexUserId");

}


/* =========================================================
   API REQUEST
   ========================================================= */

async function apiRequest(endpoint, options = {}) {

    const token = getAuthToken();

    if (!token) {

        clearSession();

        alert(
            "Your session has expired. Please login again."
        );

        window.location.href =
            "../Login/Login.html";

        throw new Error(
            "Authentication required."
        );
    }

    const headers = {
        ...(options.headers || {}),
        "Authorization": `Bearer ${token}`
    };

    if (options.body) {
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

    const rawResponse =
        await response.text();

    let result = {};

    try {

        result = rawResponse
            ? JSON.parse(rawResponse)
            : {};

    } catch (error) {

        console.error(
            "Invalid backend response:",
            rawResponse
        );

        throw new Error(
            "Invalid response received from the backend."
        );
    }

    if (response.status === 401) {

        clearSession();

        alert(
            "Your session has expired. Please login again."
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

        const result =
            await apiRequest("/profile");

        currentProfile =
            result?.user ||
            result?.profile ||
            result?.data ||
            null;

        updateProfileUI();

    } catch (error) {

        console.error(
            "Failed to load profile:",
            error
        );
    }
}


/* =========================================================
   PROFILE UI
   ========================================================= */

function updateProfileUI() {

    const name =
        String(
            currentProfile?.name ||
            "Verified Requester"
        ).trim();

    const role =
        String(
            currentProfile?.role ||
            "Verified Requester"
        ).trim();

    const initials =
        getInitials(name);

    const profileName =
        document.getElementById(
            "trackingProfileName"
        );

    if (profileName) {
        profileName.textContent = name;
    }

    const profileRole =
        document.getElementById(
            "trackingProfileRole"
        );

    if (profileRole) {
        profileRole.textContent = role;
    }

    const profileAvatar =
        document.getElementById(
            "trackingProfileAvatar"
        );

    if (profileAvatar) {
        profileAvatar.textContent = initials;
    }

    const applicant =
        document.getElementById(
            "detailApplicant"
        );

    if (applicant) {
        applicant.textContent = name;
    }
}


/* =========================================================
   INITIALS
   ========================================================= */

function getInitials(name) {

    return String(name || "")
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
   NOTIFICATIONS
   ========================================================= */

async function loadNotificationBadge() {

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

        const unreadCount =
            notifications.filter(
                notification =>
                    !notification.read
            ).length;

        const topBadge =
            document.getElementById(
                "trackingNotificationBadge"
            );

        if (topBadge) {
            topBadge.textContent =
                unreadCount;
        }

        const sidebarBadge =
            document.getElementById(
                "trackingSidebarNotificationBadge"
            );

        if (sidebarBadge) {
            sidebarBadge.textContent =
                unreadCount;
        }

    } catch (error) {

        console.error(
            "Failed to load notification count:",
            error
        );
    }
}


/* =========================================================
   CASE DOCUMENTS
   ========================================================= */

async function loadCaseDocuments(
    requestedCaseId
) {

    if (!requestedCaseId) {

        console.warn(
            "Cannot load case documents without a Case ID."
        );

        return [];
    }

    try {

        console.log(
            "Loading documents for case:",
            requestedCaseId
        );

        const result =
            await apiRequest(
                `/documents/${encodeURIComponent(
                    requestedCaseId
                )}`
            );

        const documents =
            Array.isArray(
                result?.documents
            )
                ? result.documents
                : [];

        console.log(
            "Case documents loaded:",
            documents
        );

        if (currentCase) {
            currentCase.documents =
                documents;
        }

        return documents;

    } catch (error) {

        console.warn(
            "Failed to load case documents:",
            error
        );

        if (currentCase) {
            currentCase.documents = [];
        }

        return [];
    }
}


/* =========================================================
   LOAD REQUEST
   ========================================================= */

async function loadRequest() {

    try {

        console.log(
            "Loading current T-REX cases..."
        );

        const casesResult =
            await apiRequest(
                "/cases"
            );

        const cases =
            Array.isArray(
                casesResult?.cases
            )
                ? casesResult.cases
                : [];

        console.log(
            "Current backend cases:",
            cases
        );

        if (cases.length === 0) {

            console.log(
                "No cases currently exist for this user."
            );

            localStorage.removeItem(
                "caseId"
            );

            showNoCaseMessage();

            return;
        }

        const savedCaseId =
            localStorage.getItem(
                "caseId"
            );

        let selectedCase =
            savedCaseId
                ? cases.find(
                    item =>
                        String(item.caseId) ===
                        String(savedCaseId)
                )
                : null;

        if (!selectedCase) {

            console.warn(
                "Saved case ID is missing or stale:",
                savedCaseId
            );

            selectedCase =
                [...cases].sort(
                    (a, b) =>
                        new Date(
                            b.createdAt || 0
                        ) -
                        new Date(
                            a.createdAt || 0
                        )
                )[0];

            if (selectedCase?.caseId) {

                console.log(
                    "Using latest valid backend case:",
                    selectedCase.caseId
                );
            }
        }

        if (
            !selectedCase ||
            !selectedCase.caseId
        ) {

            localStorage.removeItem(
                "caseId"
            );

            showNoCaseMessage();

            return;
        }

        caseId =
            selectedCase.caseId;

        console.log(
            "Loading verified T-REX case:",
            caseId
        );

        const result =
            await apiRequest(
                `/cases/${encodeURIComponent(
                    caseId
                )}`
            );

        const backendCase =
            result?.case;

        console.log(
            "FULL BACKEND CASE:",
            backendCase
        );

        console.log(
            "BACKEND CASE STATUS:",
            backendCase?.status
        );

        console.log(
            "BACKEND CASE STATUS LABEL:",
            backendCase?.statusLabel
        );

        console.log(
            "BACKEND CASE TIMELINE:",
            backendCase?.timeline
        );

        if (!backendCase) {

            throw new Error(
                "Case information was not returned by the backend."
            );
        }

        setCurrentCase(
            backendCase
        );

        await loadCaseDocuments(
            backendCase.caseId
        );

        updatePage();

    } catch (error) {

        console.error(
            "Failed to load case:",
            error
        );

        showNoCaseMessage();
    }
}


/* =========================================================
   SET CURRENT CASE
   ========================================================= */

function setCurrentCase(
    backendCase
) {

    currentCase =
        backendCase;

    caseId =
        backendCase.caseId ||
        caseId;

    documentName =
        backendCase.documentName ||
        backendCase.service ||
        "";

    actionName =
        backendCase.action ||
        "";

    reason =
        backendCase.reason ||
        "";

    status =
        backendCase.statusLabel ||
        backendCase.status ||
        "Under Verification";

    if (caseId) {

        localStorage.setItem(
            "caseId",
            caseId
        );
    }

    localStorage.setItem(
        "requestDocument",
        documentName
    );

    localStorage.setItem(
        "requestAction",
        actionName
    );

    localStorage.setItem(
        "requestReason",
        reason
    );

    localStorage.setItem(
        "requestStatus",
        status
    );
}


/* =========================================================
   NO CASE STATE
   ========================================================= */

function showNoCaseMessage() {

    currentCase = null;

    caseId = "";
    documentName = "";
    actionName = "";
    reason = "";
    status = "No Active Case";

    const caseIdElement =
        document.getElementById(
            "caseId"
        );

    if (caseIdElement) {
        caseIdElement.textContent =
            "No Case";
    }

    const caseSearch =
        document.getElementById(
            "caseSearch"
        );

    if (caseSearch) {
        caseSearch.value = "";
    }

    const documentElement =
        document.getElementById(
            "documentName"
        );

    if (documentElement) {
        documentElement.textContent =
            "No request found";
    }

    const actionElement =
        document.getElementById(
            "actionName"
        );

    if (actionElement) {
        actionElement.textContent = "-";
    }

    const submittedDate =
        document.getElementById(
            "submittedDate"
        );

    if (submittedDate) {
        submittedDate.textContent = "-";
    }

    const referenceNumber =
        document.getElementById(
            "referenceNumber"
        );

    if (referenceNumber) {
        referenceNumber.textContent = "-";
    }

    const detailDocument =
        document.getElementById(
            "detailDocument"
        );

    if (detailDocument) {
        detailDocument.textContent = "-";
    }

    const detailAction =
        document.getElementById(
            "detailAction"
        );

    if (detailAction) {
        detailAction.textContent = "-";
    }

    const detailReason =
        document.getElementById(
            "detailReason"
        );

    if (detailReason) {
        detailReason.textContent =
            "No active request.";
    }

    const currentStatus =
        document.getElementById(
            "currentStatus"
        );

    if (currentStatus) {
        currentStatus.textContent =
            "No Active Case";
    }

    const caseDescription =
        document.getElementById(
            "caseDescription"
        );

    if (caseDescription) {
        caseDescription.textContent =
            "No active request.";
    }

    const submittedTime =
        document.getElementById(
            "submittedTime"
        );

    if (submittedTime) {
        submittedTime.textContent =
            "No request selected";
    }

    resetTimeline();
}


/* =========================================================
   UPDATE PAGE
   ========================================================= */

function updatePage() {

    const caseIdElement =
        document.getElementById(
            "caseId"
        );

    if (caseIdElement) {
        caseIdElement.textContent =
            caseId || "-";
    }

    const caseSearch =
        document.getElementById(
            "caseSearch"
        );

    if (caseSearch) {
        caseSearch.value =
            caseId || "";
    }

    const documentElement =
        document.getElementById(
            "documentName"
        );

    if (documentElement) {
        documentElement.textContent =
            documentName || "-";
    }

    const actionElement =
        document.getElementById(
            "actionName"
        );

    if (actionElement) {
        actionElement.textContent =
            formatActionName(
                actionName
            );
    }

    const detailDocument =
        document.getElementById(
            "detailDocument"
        );

    if (detailDocument) {
        detailDocument.textContent =
            documentName || "-";
    }

    const detailAction =
        document.getElementById(
            "detailAction"
        );

    if (detailAction) {
        detailAction.textContent =
            formatActionName(
                actionName
            );
    }

    const detailReason =
        document.getElementById(
            "detailReason"
        );

    if (detailReason) {
        detailReason.textContent =
            reason ||
            "No reason provided.";
    }

    const currentStatus =
        document.getElementById(
            "currentStatus"
        );

    if (currentStatus) {
        currentStatus.textContent =
            status ||
            "Under Verification";
    }

    const referenceNumber =
        document.getElementById(
            "referenceNumber"
        );

    if (referenceNumber) {

        referenceNumber.textContent =
            caseId
                ? "TRX-" +
                  caseId.replace(
                      /-/g,
                      ""
                  )
                : "-";
    }

    const caseDescription =
        document.getElementById(
            "caseDescription"
        );

    if (caseDescription) {

        if (
            actionName &&
            documentName
        ) {

            caseDescription.textContent =
                formatActionName(
                    actionName
                ) +
                " request for " +
                documentName;

        } else {

            caseDescription.textContent =
                "No active request.";
        }
    }

    updateSubmittedDate();
    updateApplicant();
    updateTimeline();
}


/* =========================================================
   SUBMITTED DATE
   ========================================================= */

function updateSubmittedDate() {

    const element =
        document.getElementById(
            "submittedDate"
        );

    if (!element) {
        return;
    }

    const timestamp =
        currentCase?.createdAt;

    if (!timestamp) {

        element.textContent = "-";

        return;
    }

    element.textContent =
        formatDate(timestamp);
}


/* =========================================================
   APPLICANT
   ========================================================= */

function updateApplicant() {

    const element =
        document.getElementById(
            "detailApplicant"
        );

    if (!element) {
        return;
    }

    const name =
        currentProfile?.name ||
        "Verified Requester";

    element.textContent =
        name;
}


/* =========================================================
   ACTION DISPLAY NAME
   ========================================================= */

function formatActionName(action) {

    const actionMap = {

        Deactivate:
            "Deactivation",

        Freeze:
            "Freeze / Hold",

        Update:
            "Update Details",

        Other:
            "Other / Query"
    };

    return (
        actionMap[action] ||
        action ||
        "-"
    );
}


/* =========================================================
   STATUS DISPLAY
   ========================================================= */

function formatStatus(value) {

    if (!value) {
        return "PENDING";
    }

    const normalized =
        String(value)
            .toUpperCase()
            .replaceAll(" ", "_");

    const statusMap = {

        COMPLETED:
            "COMPLETED",

        CLOSED:
            "COMPLETED",

        UNDER_VERIFICATION:
            "IN PROGRESS",

        DEPARTMENT:
            "IN PROGRESS",

        ACTION:
            "IN PROGRESS",

        APPROVAL:
            "IN PROGRESS",

        PENDING:
            "PENDING"
    };

    return (
        statusMap[normalized] ||
        String(value).toUpperCase()
    );
}


/* =========================================================
   NORMALIZE TIMELINE STATE
   ========================================================= */

/*
 * Backend timeline structure:
 *
 * {
 *     status: "SUBMITTED",
 *     title: "Request Submitted",
 *     step: "COMPLETED",
 *     timestamp: "..."
 * }
 *
 * Older records may contain:
 *
 * {
 *     status: "SUBMITTED",
 *     state: "COMPLETED"
 * }
 *
 * Therefore we support both.
 */

function getTimelineState(step) {

    if (!step) {
        return "PENDING";
    }

    const rawState =
        step.step ||
        step.state ||
        step.progress ||
        "";

    const normalized =
        String(rawState)
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "_");

    if (
        normalized === "COMPLETED" ||
        normalized === "COMPLETE" ||
        normalized === "CLOSED" ||
        normalized === "DONE"
    ) {

        return "COMPLETED";
    }

    if (
        normalized === "IN_PROGRESS" ||
        normalized === "INPROGRESS" ||
        normalized === "CURRENT" ||
        normalized === "PROCESSING"
    ) {

        return "IN_PROGRESS";
    }

    return "PENDING";
}


/* =========================================================
   TIMELINE
   ========================================================= */

function updateTimeline() {

    if (!currentCase) {

        resetTimeline();

        return;
    }

    const timeline =
        Array.isArray(
            currentCase.timeline
        )
            ? currentCase.timeline
            : [];

    console.log(
        "Updating timeline:",
        timeline
    );

    const timelineItems =
        document.querySelectorAll(
            ".timeline-item"
        );

    console.log(
        "Timeline DOM items found:",
        timelineItems.length
    );

    /*
     * If the backend contains a timeline,
     * always use it.
     */

    if (timeline.length) {

        timelineItems.forEach(
            (element, index) => {

                const backendStep =
                    timeline[index];

                /*
                 * If there are fewer backend
                 * entries than UI entries,
                 * keep the extra UI entries pending.
                 */

                if (!backendStep) {

                    setTimelineItemPending(
                        element,
                        index
                    );

                    return;
                }

                updateTimelineItem(
                    element,
                    backendStep
                );
            }
        );

        return;
    }

    /*
     * If backend does not provide a timeline,
     * calculate it from the case status.
     */

    console.warn(
        "Backend case has no timeline. Using status fallback."
    );

    updateTimelineFromStatus();
}


/* =========================================================
   TIMELINE ITEM
   ========================================================= */

function updateTimelineItem(
    element,
    step
) {

    if (!element) {
        return;
    }

    /*
     * IMPORTANT:
     *
     * step.status = stage name
     * step.step   = actual progress state
     *
     * Example:
     *
     * status: "SUBMITTED"
     * step:   "COMPLETED"
     *
     * Therefore we MUST NOT use step.status
     * as the progress state.
     */

    const state =
        getTimelineState(step);

    console.log(
        "Timeline item:",
        {
            status: step.status,
            title: step.title,
            step: step.step,
            state: step.state,
            resolvedState: state,
            timestamp: step.timestamp
        }
    );

    element.classList.remove(
        "completed",
        "current",
        "pending"
    );

    if (state === "COMPLETED") {

        element.classList.add(
            "completed"
        );

    } else if (
        state === "IN_PROGRESS"
    ) {

        element.classList.add(
            "current"
        );

    } else {

        element.classList.add(
            "pending"
        );
    }

    const marker =
        element.querySelector(
            ".timeline-marker"
        );

    if (marker) {

        marker.textContent =
            state === "COMPLETED"
                ? "✓"
                : state === "IN_PROGRESS"
                    ? "●"
                    : String(
                        Array.from(
                            document.querySelectorAll(
                                ".timeline-item"
                            )
                        ).indexOf(element) + 1
                    );
    }

    const statusElement =
        element.querySelector(
            ".timeline-top > strong"
        );

    if (statusElement) {

        statusElement.textContent =
            state === "COMPLETED"
                ? "COMPLETED"
                : state === "IN_PROGRESS"
                    ? "IN PROGRESS"
                    : "PENDING";
    }

    const timeElement =
        element.querySelector(
            ".time"
        );

    if (timeElement) {

        if (step.timestamp) {

            timeElement.textContent =
                formatDateTime(
                    step.timestamp
                );

        } else if (
            state === "IN_PROGRESS"
        ) {

            timeElement.textContent =
                "Current processing stage";

        } else {

            timeElement.textContent =
                "Awaiting previous stage";
        }
    }

    const processing =
        element.querySelector(
            ".processing"
        );

    if (processing) {
        processing.remove();
    }

    if (
        state === "IN_PROGRESS"
    ) {

        const content =
            element.querySelector(
                ".timeline-content"
            );

        if (content) {

            const processingElement =
                document.createElement(
                    "div"
                );

            processingElement.className =
                "processing";

            processingElement.innerHTML =
                `
                    <span class="loader"></span>
                    Request processing is in progress
                `;

            const time =
                content.querySelector(
                    ".time"
                );

            if (time) {

                content.insertBefore(
                    processingElement,
                    time
                );

            } else {

                content.appendChild(
                    processingElement
                );
            }
        }
    }
}


/* =========================================================
   SET PENDING TIMELINE ITEM
   ========================================================= */

function setTimelineItemPending(
    element,
    index
) {

    if (!element) {
        return;
    }

    element.classList.remove(
        "completed",
        "current",
        "pending"
    );

    element.classList.add(
        "pending"
    );

    const marker =
        element.querySelector(
            ".timeline-marker"
        );

    if (marker) {

        marker.textContent =
            String(index + 1);
    }

    const statusElement =
        element.querySelector(
            ".timeline-top > strong"
        );

    if (statusElement) {

        statusElement.textContent =
            "PENDING";
    }

    const time =
        element.querySelector(
            ".time"
        );

    if (time) {

        time.textContent =
            "Awaiting previous stage";
    }

    const processing =
        element.querySelector(
            ".processing"
        );

    if (processing) {
        processing.remove();
    }
}


/* =========================================================
   FALLBACK TIMELINE
   ========================================================= */

function updateTimelineFromStatus() {

    const items =
        document.querySelectorAll(
            ".timeline-item"
        );

    if (!items.length) {
        return;
    }

    let activeIndex = 1;

    const normalizedStatus =
        String(status)
            .toUpperCase()
            .replace(/\s+/g, "_");

    switch (normalizedStatus) {

        case "UNDER_VERIFICATION":
        case "UNDER_VERIFICATION_REVIEW":
            activeIndex = 2;
            break;

        case "DEPARTMENT":
            activeIndex = 3;
            break;

        case "ACTION":
            activeIndex = 4;
            break;

        case "APPROVAL":
            activeIndex = 5;
            break;

        case "CLOSED":
        case "COMPLETED":
            activeIndex = 6;
            break;

        default:
            activeIndex = 2;
    }

    items.forEach(
        (item, index) => {

            const stepNumber =
                index + 1;

            item.classList.remove(
                "completed",
                "current",
                "pending"
            );

            const marker =
                item.querySelector(
                    ".timeline-marker"
                );

            const statusElement =
                item.querySelector(
                    ".timeline-top > strong"
                );

            const time =
                item.querySelector(
                    ".time"
                );

            if (
                stepNumber <
                activeIndex
            ) {

                item.classList.add(
                    "completed"
                );

                if (marker) {
                    marker.textContent =
                        "✓";
                }

                if (statusElement) {
                    statusElement.textContent =
                        "COMPLETED";
                }

                if (time) {
                    time.textContent =
                        currentCase?.createdAt
                            ? formatDateTime(
                                currentCase.createdAt
                            )
                            : "Completed";
                }

            } else if (
                stepNumber ===
                activeIndex
            ) {

                item.classList.add(
                    "current"
                );

                if (marker) {
                    marker.textContent =
                        "●";
                }

                if (statusElement) {
                    statusElement.textContent =
                        "IN PROGRESS";
                }

                if (time) {
                    time.textContent =
                        "Current processing stage";
                }

            } else {

                item.classList.add(
                    "pending"
                );

                if (marker) {
                    marker.textContent =
                        String(stepNumber);
                }

                if (statusElement) {
                    statusElement.textContent =
                        "PENDING";
                }

                if (time) {
                    time.textContent =
                        "Awaiting previous stage";
                }
            }

            const processing =
                item.querySelector(
                    ".processing"
                );

            if (processing) {
                processing.remove();
            }

            if (
                stepNumber ===
                activeIndex
            ) {

                const content =
                    item.querySelector(
                        ".timeline-content"
                    );

                if (content) {

                    const processingElement =
                        document.createElement(
                            "div"
                        );

                    processingElement.className =
                        "processing";

                    processingElement.innerHTML =
                        `
                            <span class="loader"></span>
                            Request processing is in progress
                        `;

                    const timeElement =
                        content.querySelector(
                            ".time"
                        );

                    if (timeElement) {

                        content.insertBefore(
                            processingElement,
                            timeElement
                        );

                    } else {

                        content.appendChild(
                            processingElement
                        );
                    }
                }
            }
        }
    );
}


/* =========================================================
   RESET TIMELINE
   ========================================================= */

function resetTimeline() {

    const items =
        document.querySelectorAll(
            ".timeline-item"
        );

    items.forEach(
        (item, index) => {

            item.classList.remove(
                "completed",
                "current",
                "pending"
            );

            item.classList.add(
                "pending"
            );

            const marker =
                item.querySelector(
                    ".timeline-marker"
                );

            if (marker) {

                marker.textContent =
                    String(index + 1);
            }

            const statusElement =
                item.querySelector(
                    ".timeline-top > strong"
                );

            if (statusElement) {

                statusElement.textContent =
                    "PENDING";
            }

            const time =
                item.querySelector(
                    ".time"
                );

            if (time) {

                time.textContent =
                    "Awaiting request";
            }

            const processing =
                item.querySelector(
                    ".processing"
                );

            if (processing) {
                processing.remove();
            }
        }
    );
}


/* =========================================================
   SEARCH CASE
   ========================================================= */

async function searchCase() {

    const searchInput =
        document.getElementById(
            "caseSearch"
        );

    if (!searchInput) {
        return;
    }

    const searchValue =
        searchInput.value.trim();

    if (!searchValue) {

        alert(
            "Please enter a Case ID."
        );

        return;
    }

    try {

        console.log(
            "Searching for case:",
            searchValue
        );

        const result =
            await apiRequest(
                `/cases/${encodeURIComponent(
                    searchValue
                )}`
            );

        const backendCase =
            result?.case;

        if (!backendCase) {

            alert(
                "No request found for this Case ID."
            );

            return;
        }

        console.log(
            "SEARCHED BACKEND CASE:",
            backendCase
        );

        console.log(
            "SEARCHED CASE TIMELINE:",
            backendCase.timeline
        );

        setCurrentCase(
            backendCase
        );

        updatePage();

    } catch (error) {

        console.error(
            "Case search failed:",
            error
        );

        alert(
            error.message ||
            "No request found for this Case ID."
        );
    }
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function goDashboard() {

    window.location.href =
        "../Dashboard/Dashboard.html";
}


function goDocuments() {

    window.location.href =
        "../Documents/Documents.html";
}


function goRequest() {

    window.location.href =
        "../Request/Request.html";
}


function goProfile() {

    window.location.href =
        "../Profile/Profile.html";
}


function goSystem() {

    window.location.href =
        "../System/System.html";
}


/* =========================================================
   NOTIFICATIONS
   ========================================================= */

function showNotifications() {

    window.location.href =
        "../Notifications/Notifications.html";
}


/* =========================================================
   RAISE QUERY
   ========================================================= */

function raiseQuery() {

    if (!documentName) {

        alert(
            "No active request is available."
        );

        return;
    }

    localStorage.setItem(
        "selectedDocument",
        documentName
    );

    localStorage.setItem(
        "selectedAction",
        "Raise Query"
    );

    window.location.href =
        "../Request/Request.html";
}


/* =========================================================
   LOGOUT
   ========================================================= */

function logout(event) {

    if (event) {
        event.preventDefault();
    }

    if (
        !confirm(
            "Are you sure you want to logout?"
        )
    ) {

        return false;
    }

    clearSession();

    window.location.href =
        "../Login/Login.html";

    return false;
}


/* =========================================================
   DATE FORMAT
   ========================================================= */

function formatDate(timestamp) {

    const date =
        new Date(timestamp);

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


/* =========================================================
   DATE + TIME FORMAT
   ========================================================= */

function formatDateTime(timestamp) {

    const date =
        new Date(timestamp);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Unknown time";
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


/* =========================================================
   INITIALIZATION
   ========================================================= */

window.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "Initializing SafePin Request Tracking..."
        );

        if (!getAuthToken()) {

            window.location.href =
                "../Login/Login.html";

            return;
        }

        await Promise.all([
            loadProfile(),
            loadNotificationBadge(),
            loadRequest()
        ]);

        console.log(
            "SafePin Request Tracking initialized successfully."
        );
    }
);
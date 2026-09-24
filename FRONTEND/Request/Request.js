/* =========================================================
   T-REX - REQUEST
   Backend Connected Version
   Profile + Notifications + Cases + Request Creation
========================================================= */


/* =========================================================
   CONFIGURATION
========================================================= */

const API_BASE_URL = "/api";
/* =========================================================
   STATE
========================================================= */

let selectedAction = "";

let selectedFile = null;

let currentProfile = null;

let isSubmitting = false;


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

    /*
       Clear older session keys as well.
    */

    sessionStorage.removeItem(
        "verificationId"
    );

    sessionStorage.removeItem(
        "userId"
    );

}


/* =========================================================
   LOGIN REDIRECT
========================================================= */

function redirectToLogin() {

    window.location.href =
        "../Login/Login.html";

}


/* =========================================================
   API HELPER
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
        !headers["Content-Type"] &&
        !(options.body instanceof FormData)
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
                "Invalid T-REX backend response:",
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
            "Your session has expired. Please login again."
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
   LOAD SELECTED DOCUMENT / ACTION
========================================================= */

function loadSavedRequestSelection() {

    const savedDocument =
        localStorage.getItem(
            "selectedDocument"
        );


    const savedAction =
        localStorage.getItem(
            "selectedAction"
        );


    if (savedDocument) {

        const documentSelect =
            document.getElementById(
                "documentSelect"
            );


        if (documentSelect) {

            /*
               Only restore a saved value when it
               exists in the current service list.
            */

            const matchingOption =
                Array.from(
                    documentSelect.options
                ).find(
                    option =>
                        option.value ===
                        savedDocument
                );


            if (matchingOption) {

                documentSelect.value =
                    savedDocument;

                updateSummary();

            }

        }

    }


    if (savedAction) {

        if (
            savedAction ===
            "Update Details"
        ) {

            selectActionByName(
                "Update"
            );

        }

        else if (
            savedAction ===
            "Raise Query"
        ) {

            selectActionByName(
                "Other"
            );

        }

        else if (
            savedAction ===
            "Request Protection Action"
        ) {

            selectActionByName(
                "Deactivate"
            );

        }

    }

}


/* =========================================================
   DOCUMENT CHANGE
========================================================= */

function initializeDocumentSelection() {

    const documentSelect =
        document.getElementById(
            "documentSelect"
        );


    if (!documentSelect) {
        return;
    }


    documentSelect.addEventListener(
        "change",
        updateSummary
    );

}


/* =========================================================
   SELECT ACTION
========================================================= */

function selectAction(
    element,
    action
) {

    if (!element) {
        return;
    }


    const options =
        document.querySelectorAll(
            ".action-option"
        );


    options.forEach(
        function(option) {

            option.classList.remove(
                "selected"
            );

        }
    );


    element.classList.add(
        "selected"
    );


    selectedAction =
        action;


    const selectedActionInput =
        document.getElementById(
            "selectedAction"
        );


    if (selectedActionInput) {

        selectedActionInput.value =
            action;

    }


    const summaryAction =
        document.getElementById(
            "summaryAction"
        );


    if (summaryAction) {

        summaryAction.innerText =
            getActionDisplayName(
                action
            );

    }

}


/* =========================================================
   ACTION DISPLAY NAME
========================================================= */

function getActionDisplayName(
    action
) {

    if (
        action ===
        "Deactivate"
    ) {

        return "Protection / Deactivation";

    }


    if (
        action ===
        "Freeze"
    ) {

        return "Freeze / Hold";

    }


    if (
        action ===
        "Update"
    ) {

        return "Update Details";

    }


    if (
        action ===
        "Other"
    ) {

        return "Other / Query";

    }


    return action;

}


/* =========================================================
   SELECT ACTION BY NAME
========================================================= */

function selectActionByName(
    action
) {

    const options =
        document.querySelectorAll(
            ".action-option"
        );


    options.forEach(
        function(option) {

            const text =
                option.innerText
                    .toLowerCase();


            if (

                (
                    action === "Update" &&
                    text.includes("update")
                )

                ||

                (
                    action === "Other" &&
                    text.includes("other")
                )

                ||

                (
                    action === "Deactivate" &&
                    text.includes("protection")
                )

                ||

                (
                    action === "Freeze" &&
                    text.includes("freeze")
                )

            ) {

                selectAction(
                    option,
                    action
                );

            }

        }
    );

}


/* =========================================================
   UPDATE SUMMARY
========================================================= */

function updateSummary() {

    const documentSelect =
        document.getElementById(
            "documentSelect"
        );


    if (!documentSelect) {
        return;
    }


    const selected =
        documentSelect.value;


    const summaryDocument =
        document.getElementById(
            "summaryDocument"
        );


    if (summaryDocument) {

        summaryDocument.innerText =
            selected ||
            "Not selected";

    }

}


/* =========================================================
   CHARACTER COUNT
========================================================= */

function initializeCharacterCounter() {

    const reason =
        document.getElementById(
            "reason"
        );


    if (!reason) {
        return;
    }


    reason.addEventListener(
        "input",
        function() {

            const counter =
                document.getElementById(
                    "characterCount"
                );


            if (counter) {

                counter.innerText =
                    this.value.length;

            }

        }
    );


    /*
       Initialize count in case
       text already exists.
    */

    const counter =
        document.getElementById(
            "characterCount"
        );


    if (counter) {

        counter.innerText =
            reason.value.length;

    }

}


/* =========================================================
   FILE UPLOAD
========================================================= */

function showFile() {

    const input =
        document.getElementById(
            "supportingFile"
        );


    if (
        !input ||
        !input.files ||
        input.files.length === 0
    ) {

        selectedFile =
            null;

        return;

    }


    const file =
        input.files[0];


    /*
       Maximum size:
       5 MB
    */

    if (
        file.size >
        5 * 1024 * 1024
    ) {

        alert(
            "File size must be less than 5 MB."
        );


        input.value =
            "";


        selectedFile =
            null;


        const fileName =
            document.getElementById(
                "fileName"
            );


        if (fileName) {

            fileName.innerText =
                "";

            fileName.classList.add(
                "hidden"
            );

        }


        return;

    }


    /*
       Allowed file types.
    */

    const allowedTypes = [

        "application/pdf",

        "image/jpeg",

        "image/png"

    ];


    const allowedExtensions = [

        ".pdf",

        ".jpg",

        ".jpeg",

        ".png"

    ];


    const fileNameLower =
        file.name.toLowerCase();


    const validType =
        allowedTypes.includes(
            file.type
        );


    const validExtension =
        allowedExtensions.some(
            extension =>
                fileNameLower.endsWith(
                    extension
                )
        );


    if (
        !validType &&
        !validExtension
    ) {

        alert(
            "Please select a PDF, JPG, JPEG or PNG file."
        );


        input.value =
            "";


        selectedFile =
            null;


        return;

    }


    selectedFile =
        file;


    const fileName =
        document.getElementById(
            "fileName"
        );


    if (fileName) {

        fileName.innerText =
            "✓ " +
            selectedFile.name;


        fileName.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   LOAD PROFILE
========================================================= */

async function loadProfile() {

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


        updateProfileUI(
            profile
        );


        console.log(
            "T-REX Request profile loaded:",
            profile
        );


    } catch (error) {

        console.error(
            "Unable to load Request profile:",
            error
        );


        /*
           Do not insert fake identity information.
        */

        updateRequestIdentity(
            "Verified Requester",
            "TR",
            false
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


    const role =
        profile.role ||
        (
            profile.verified === false
                ? "Verification Pending"
                : "Verified Requester"
        );


    updateRequestIdentity(
        name,
        initials,
        profile.verified !== false,
        role
    );

}


/* =========================================================
   UPDATE REQUEST IDENTITY
========================================================= */

function updateRequestIdentity(
    name,
    initials,
    verified,
    role
) {

    const profileAvatar =
        document.getElementById(
            "requestProfileAvatar"
        );


    if (profileAvatar) {

        profileAvatar.textContent =
            initials;

    }


    const profileName =
        document.getElementById(
            "requestProfileName"
        );


    if (profileName) {

        profileName.textContent =
            name;

    }


    const profileRole =
        document.getElementById(
            "requestProfileRole"
        );


    if (profileRole) {

        profileRole.textContent =
            role ||
            "Verified Requester";

    }


    const summaryApplicant =
        document.getElementById(
            "summaryApplicant"
        );


    if (summaryApplicant) {

        summaryApplicant.textContent =
            name;

    }


    const summaryIdentityStatus =
        document.getElementById(
            "summaryIdentityStatus"
        );


    if (summaryIdentityStatus) {

        summaryIdentityStatus.textContent =
            verified
                ? "Verified"
                : "Verification Pending";


        summaryIdentityStatus.classList.toggle(
            "verified-text",
            verified
        );

    }

}


/* =========================================================
   LOAD NOTIFICATIONS
========================================================= */

async function loadNotificationBadge() {

    try {

        const result =
            await apiRequest(
                "/notifications"
            );


        const notifications =
            Array.isArray(
                result.notifications
            )
                ? result.notifications
                : [];


        const unreadCount =
            notifications.filter(
                notification =>
                    !notification.read
            ).length;


        const notificationBadge =
            document.getElementById(
                "notificationBadge"
            );


        if (notificationBadge) {

            notificationBadge.textContent =
                unreadCount;

        }


        console.log(
            "T-REX unread notifications:",
            unreadCount
        );


    } catch (error) {

        console.error(
            "Unable to load notification count:",
            error
        );


        const notificationBadge =
            document.getElementById(
                "notificationBadge"
            );


        if (notificationBadge) {

            notificationBadge.textContent =
                "0";

        }

    }

}


/* =========================================================
   LOAD TRACKING / REQUEST COUNT
========================================================= */

async function loadTrackingBadge() {

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


        /*
           Count cases that are not closed.
        */

        const activeCases =
            cases.filter(
                item =>
                    String(
                        item.status || ""
                    ).toUpperCase() !==
                    "CLOSED"
            );


        const trackingBadge =
            document.getElementById(
                "trackingBadge"
            );


        if (trackingBadge) {

            trackingBadge.textContent =
                activeCases.length;

        }


    } catch (error) {

        console.error(
            "Unable to load tracking count:",
            error
        );


        const trackingBadge =
            document.getElementById(
                "trackingBadge"
            );


        if (trackingBadge) {

            trackingBadge.textContent =
                "0";

        }

    }

}


/* =========================================================
   UPLOAD SUPPORTING DOCUMENT
========================================================= */

async function uploadSupportingDocument(caseId) {

    if (!selectedFile) {
        return null;
    }

    if (!caseId) {
        throw new Error(
            "A Case ID is required before uploading the supporting document."
        );
    }

    const formData = new FormData();

    formData.append(
        "file",
        selectedFile,
        selectedFile.name
    );

    console.log(
        "Uploading supporting document for Case:",
        caseId
    );

    const result = await apiRequest(
        `/documents/${encodeURIComponent(caseId)}`,
        {
            method: "POST",
            body: formData
        }
    );

    const document = result?.document;

    if (!document) {
        throw new Error(
            "The case was created, but the supporting document was not returned by the backend."
        );
    }

    console.log(
        "Supporting document uploaded successfully:",
        document
    );

    return document;
}


/* =========================================================
   SUBMIT REQUEST TO T-REX BACKEND
========================================================= */

async function submitRequest() {

    if (isSubmitting) {
        return;
    }


    const documentSelect =
        document.getElementById(
            "documentSelect"
        );


    const reasonInput =
        document.getElementById(
            "reason"
        );


    const documentName =
        documentSelect
            ? documentSelect.value.trim()
            : "";


    const reason =
        reasonInput
            ? reasonInput.value.trim()
            : "";


    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!documentName) {

        alert(
            "Please select a document or service."
        );

        return;

    }


    if (!selectedAction) {

        alert(
            "Please select an action."
        );

        return;

    }


    if (!reason) {

        alert(
            "Please enter the reason for your request."
        );

        return;

    }


    if (reason.length > 500) {

        alert(
            "Reason must be 500 characters or less."
        );

        return;

    }


    const token =
        getAuthToken();


    if (!token) {

        alert(
            "Your session has expired. Please login again."
        );

        redirectToLogin();

        return;

    }


    /* =====================================================
       PREVENT DOUBLE SUBMISSION
    ===================================================== */

    isSubmitting =
        true;


    const submitButton =
        document.querySelector(
            ".submit-button"
        );


    if (submitButton) {

        submitButton.disabled =
            true;


        submitButton.innerHTML =
            "Submitting Secure Request...";

    }


    try {

        /* =================================================
           SEND CASE TO BACKEND
        ================================================= */

        const result =
            await apiRequest(
                "/cases",
                {
                    method: "POST",

                    body:
                        JSON.stringify({

                            service:
                                documentName,

                            action:
                                getActionDisplayName(
                                    selectedAction
                                ),

                            reason:
                                reason

                        })

                }
            );


        console.log(
            "Create Case API Response:",
            result
        );


        /* =================================================
           GET REAL CASE DATA
        ================================================= */

        const createdCase =
            result.case ||
            result.data ||
            result;


        const caseId =
            createdCase.caseId ||
            createdCase.id;


        if (!caseId) {

            console.error(
                "Backend response did not contain Case ID:",
                result
            );


            throw new Error(
                "Request was created, but no Case ID was returned by the backend."
            );

        }


        /* =================================================
           UPLOAD SUPPORTING DOCUMENT AFTER CASE CREATION
        ================================================= */

        let uploadedDocument = null;

        if (selectedFile) {

            uploadedDocument =
                await uploadSupportingDocument(
                    caseId
                );

        }


        /* =================================================
           SAVE FOR EXISTING FRONTEND
        ================================================= */

        localStorage.setItem(
            "caseId",
            caseId
        );


        localStorage.setItem(
            "requestDocument",
            documentName
        );


        localStorage.setItem(
            "requestAction",
            getActionDisplayName(
                selectedAction
            )
        );


        localStorage.setItem(
            "requestReason",
            reason
        );


        localStorage.setItem(
            "requestStatus",
            "Under Verification"
        );


        /*
           Also preserve the selected service/action
           values used by other SafePin pages.
        */

        localStorage.setItem(
            "selectedDocument",
            documentName
        );


        localStorage.setItem(
            "selectedAction",
            getActionDisplayName(
                selectedAction
            )
        );


        if (uploadedDocument) {

            localStorage.setItem(
                "requestDocumentId",
                uploadedDocument.documentId || ""
            );

            localStorage.setItem(
                "requestUploadedFile",
                uploadedDocument.originalName || selectedFile.name
            );

        }


        /* =================================================
           UPDATE SUCCESS SCREEN
        ================================================= */

        const generatedCaseId =
            document.getElementById(
                "generatedCaseId"
            );


        if (generatedCaseId) {

            generatedCaseId.innerText =
                caseId;

        }


        const successDocument =
            document.getElementById(
                "successDocument"
            );


        if (successDocument) {

            successDocument.innerText =
                documentName;

        }


        const successAction =
            document.getElementById(
                "successAction"
            );


        if (successAction) {

            successAction.innerText =
                getActionDisplayName(
                    selectedAction
                );

        }


        /* =================================================
           CHANGE PROGRESS
        ================================================= */

        updateProgressToSuccess();


        /* =================================================
           SHOW SUCCESS SCREEN
        ================================================= */

        const requestForm =
            document.getElementById(
                "requestForm"
            );


        const successSection =
            document.getElementById(
                "successSection"
            );


        if (requestForm) {

            requestForm.classList.add(
                "hidden"
            );

        }


        if (successSection) {

            successSection.classList.remove(
                "hidden"
            );

        }


        selectedFile = null;


        /*
           Refresh tracking count after
           successful case creation.
        */

        await loadTrackingBadge();


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });


        console.log(
            "T-REX case created successfully:",
            caseId
        );


    } catch (error) {

        console.error(
            "Request submission failed:",
            error
        );


        alert(
            error.message ||
            "Something went wrong while submitting your request."
        );


        /*
           Restore button.
        */

        if (submitButton) {

            submitButton.disabled =
                false;


            submitButton.innerHTML =
                `
                Submit Secure Request
                <span>→</span>
                `;

        }


        isSubmitting =
            false;


        return;

    }


    /*
       Submission completed successfully.
    */

    isSubmitting =
        false;

}


/* =========================================================
   SUCCESS PROGRESS
========================================================= */

function updateProgressToSuccess() {

    const steps =
        document.querySelectorAll(
            ".progress-step"
        );


    steps.forEach(
        function(step) {

            step.classList.remove(
                "active"
            );

        }
    );


    if (steps.length >= 3) {

        steps[0].classList.add(
            "active"
        );

        steps[1].classList.add(
            "active"
        );

        steps[2].classList.add(
            "active"
        );

    }

}


/* =========================================================
   COPY CASE ID
========================================================= */

function copyCaseId() {

    const generatedCaseId =
        document.getElementById(
            "generatedCaseId"
        );


    if (!generatedCaseId) {
        return;
    }


    const caseId =
        generatedCaseId.innerText.trim();


    if (!caseId) {
        return;
    }


    if (
        navigator.clipboard &&
        navigator.clipboard.writeText
    ) {

        navigator.clipboard
            .writeText(
                caseId
            )
            .then(
                function() {

                    alert(
                        "Case ID copied: " +
                        caseId
                    );

                }
            )
            .catch(
                function() {

                    alert(
                        "Case ID: " +
                        caseId
                    );

                }
            );

    } else {

        alert(
            "Case ID: " +
            caseId
        );

    }

}


/* =========================================================
   RAISE QUERY
========================================================= */

function raiseQuery() {

    localStorage.setItem(
        "selectedAction",
        "Raise Query"
    );


    /*
       Do not store "General Query" as a
       documentSelect value because that option
       does not exist in the current Request.html.

       The user can select the appropriate
       service after arriving on the page.
    */

    window.location.href =
        "../Request/Request.html";

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


function goTracking() {

    window.location.href =
        "../Tracking/Tracking.html";

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
   LOGOUT
========================================================= */

function logout() {

    if (
        confirm(
            "Are you sure you want to logout from SafePin?"
        )
    ) {

        clearAuthentication();


        /*
           Keep profile preferences,
           but remove temporary request
           selections.
        */

        localStorage.removeItem(
            "selectedDocument"
        );


        localStorage.removeItem(
            "selectedAction"
        );


        window.location.href =
            "../Login/Login.html";

    }

}


/* =========================================================
   INITIALIZE REQUEST PAGE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function() {

        console.log(
            "Initializing T-REX Request page..."
        );


        /*
           Require authentication before
           displaying the request page.
        */

        if (!getAuthToken()) {

            redirectToLogin();

            return;

        }


        initializeDocumentSelection();

        initializeCharacterCounter();

        loadSavedRequestSelection();


        /*
           Load backend information in parallel.
        */

        await Promise.all([

            loadProfile(),

            loadNotificationBadge(),

            loadTrackingBadge()

        ]);


        console.log(
            "T-REX Request page initialized successfully."
        );

    }
);
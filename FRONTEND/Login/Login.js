// =========================================================
// T-REX / SAFEPIN LOGIN PAGE
// Backend-connected 2Factor SMS OTP authentication flow
// =========================================================

const API_BASE_URL = "/api";


// =========================================================
// SAFE PIN LANDING PAGE → LOGIN PORTAL
// =========================================================

function openSafePinPortal() {

    const intro =
        document.getElementById("safepinIntro");

    const portal =
        document.getElementById("portalBackground");

    if (!intro || !portal) {
        console.error(
            "SafePin portal elements were not found."
        );

        return;
    }

    intro.style.opacity = "0";
    intro.style.transform = "scale(0.98)";

    setTimeout(function () {

        intro.style.display = "none";

        portal.style.display = "flex";

        startVaultAnimation();

    }, 350);
}


// =========================================================
// VAULT ANIMATION
// =========================================================

function startVaultAnimation() {

    const splash =
        document.getElementById("vaultSplash");

    const statusText =
        document.getElementById("vaultStatus");

    const lockIcon =
        document.querySelector(".lock-icon");

    const mainContainer =
        document.getElementById("mainContainer");

    if (
        !splash ||
        !statusText ||
        !lockIcon ||
        !mainContainer
    ) {

        console.warn(
            "Vault animation elements not found."
        );

        return;
    }

    splash.style.display = "flex";
    splash.style.opacity = "1";
    splash.style.transform = "scale(1)";

    mainContainer.classList.remove(
        "visible-container"
    );

    mainContainer.classList.add(
        "hidden-container"
    );

    splash.classList.remove(
        "vault-unlocked"
    );

    lockIcon.innerText = "🔒";

    statusText.innerText =
        "SECURE PORTAL INITIALIZING...";

    statusText.style.color =
        "#aab8ca";


    setTimeout(function () {

        statusText.innerText =
            "ALIGNING ENCRYPTION KEYS...";

        statusText.style.color =
            "#00f2fe";

    }, 1000);


    setTimeout(function () {

        statusText.innerText =
            "ACCESS PORTAL READY";

        statusText.style.color =
            "#00ff88";

        lockIcon.innerText =
            "🔓";

        splash.classList.add(
            "vault-unlocked"
        );

    }, 2200);


    setTimeout(function () {

        splash.style.opacity = "0";

        splash.style.transform =
            "scale(1.3)";

        setTimeout(function () {

            splash.style.display = "none";

            mainContainer.classList.remove(
                "hidden-container"
            );

            mainContainer.classList.add(
                "visible-container"
            );

        }, 500);

    }, 2800);
}


// =========================================================
// API RESPONSE HELPER
// =========================================================

async function parseApiResponse(response) {

    const rawResponse =
        await response.text();

    if (!rawResponse) {
        return {};
    }

    try {

        return JSON.parse(rawResponse);

    } catch (error) {

        console.error(
            "Invalid backend JSON response:",
            rawResponse
        );

        throw new Error(
            "The T-REX backend returned an invalid response."
        );
    }
}


// =========================================================
// UI HELPER
// =========================================================

function showOnlySection(sectionId) {

    const sections = [
        "loginSection",
        "phoneSection",
        "deathSection",
        "otpSection",
        "successSection"
    ];

    sections.forEach(function (id) {

        const element =
            document.getElementById(id);

        if (!element) {
            return;
        }

        if (id === sectionId) {

            element.classList.remove(
                "hidden"
            );

        } else {

            element.classList.add(
                "hidden"
            );
        }
    });
}


// =========================================================
// START PHONE VERIFICATION
// =========================================================

async function startVerification() {

    const phoneElement =
        document.getElementById("phone") ||
        document.getElementById("mobile");

    const deathCertificateElement =
        document.getElementById(
            "deathCertificate"
        );

    if (
        !phoneElement ||
        !deathCertificateElement
    ) {

        console.error(
            "Phone or Death Certificate form elements were not found."
        );

        alert(
            "Login form elements were not found. Please check Login.html."
        );

        return;
    }


    const phone =
        phoneElement.value.trim();

    const deathCertificate =
        deathCertificateElement.value.trim();


    // =====================================================
    // PHONE VALIDATION
    // =====================================================

    const phoneDigits =
        phone.replace(/\D/g, "");

    const validPhone =
        /^\d{10}$/.test(phoneDigits) ||
        /^91\d{10}$/.test(phoneDigits);


    if (!validPhone) {

        alert(
            "Please enter a valid 10-digit Indian mobile number."
        );

        return;
    }


    // =====================================================
    // DEATH CERTIFICATE VALIDATION
    // =====================================================

    if (!deathCertificate) {

        alert(
            "Please enter the Death Certificate number."
        );

        return;
    }


    // =====================================================
    // BUTTON
    // =====================================================

    const continueButton =
        document.querySelector(
            "#loginSection button"
        );

    const originalButtonText =
        continueButton
            ? continueButton.innerText
            : "Send Secure OTP →";


    if (continueButton) {

        continueButton.disabled = true;

        continueButton.innerText =
            "Sending secure OTP...";
    }


    try {

        // =================================================
        // CALL BACKEND
        // =================================================

        const response =
            await fetch(
                `${API_BASE_URL}/auth/start`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        phone:
                            phone,

                        deathCertificate:
                            deathCertificate
                    })
                }
            );


        const result =
            await parseApiResponse(
                response
            );


        console.log(
            "T-REX /auth/start response:",
            result
        );


        // =================================================
        // BACKEND ERROR
        // =================================================

        if (
            !response.ok ||
            !result.success
        ) {

            console.error(
                "Phone verification start failed:",
                result
            );

            alert(
                result.message ||
                "Unable to send the verification OTP."
            );

            return;
        }


        // =================================================
        // GET VERIFICATION SESSION
        // =================================================
        //
        // New backend may return:
        //
        // sessionId
        //
        // Older auth.service.js may return:
        //
        // verificationId
        //
        // Support both so the frontend does not break
        // during the transition.
        // =================================================

        const verificationId =
            result.verificationId ||
            result.sessionId ||
            result.data?.verificationId ||
            result.data?.sessionId ||
            null;


        if (!verificationId) {

            console.error(
                "Backend did not return a verification session ID:",
                result
            );

            alert(
                "Verification session could not be created."
            );

            return;
        }


        // =================================================
        // USER ID
        // =================================================

        const userId =
            result.userId ||
            result.data?.userId ||
            null;


        // =================================================
        // PROVIDER CHECK
        // =================================================

        const providerConnected =
            result.providerConnected === true ||
            result.data?.providerConnected === true;


        if (!providerConnected) {

            console.error(
                "2Factor provider was not confirmed:",
                result
            );

            alert(
                result.message ||
                "The SMS OTP provider is not connected."
            );

            return;
        }


        // =================================================
        // SAVE SESSION
        // =================================================

        sessionStorage.setItem(
            "verificationId",
            verificationId
        );


        /*
         * Also store sessionId because the new
         * phone OTP service calls it sessionId.
         */
        sessionStorage.setItem(
            "otpSessionId",
            verificationId
        );


        if (userId) {

            sessionStorage.setItem(
                "userId",
                userId
            );

        } else {

            sessionStorage.removeItem(
                "userId"
            );
        }


        // Save the phone number locally only for
        // the current login flow.
        sessionStorage.setItem(
            "verificationPhone",
            phone
        );


        console.log(
            "T-REX phone verification started successfully:",
            {
                verificationId,
                userId,
                provider:
                    result.provider ||
                    result.data?.provider,
                providerConnected
            }
        );


        // =================================================
        // PHONE STATUS
        // =================================================

        showOnlySection(
            "phoneSection"
        );


        const phoneStatus =
            document.getElementById(
                "phoneStatus"
            );


        if (phoneStatus) {

            phoneStatus.innerText =
                result.message ||
                result.data?.message ||
                "Secure SMS OTP has been sent to your registered mobile number.";
        }


        // =================================================
        // DEATH CERTIFICATE STATUS
        // =================================================

        setTimeout(function () {

            showOnlySection(
                "deathSection"
            );


            const deathStatus =
                document.getElementById(
                    "deathStatus"
                );


            if (deathStatus) {

                deathStatus.innerText =
                    "Death Certificate verification workflow initiated.";
            }

        }, 1800);


        // =================================================
        // OTP SCREEN
        // =================================================

        setTimeout(function () {

            showOnlySection(
                "otpSection"
            );


            const otpStatus =
                document.getElementById(
                    "otpStatus"
                );


            const maskedMobile =
                result.maskedMobile ||
                result.data?.maskedMobile ||
                null;


            if (otpStatus) {

                if (maskedMobile) {

                    otpStatus.innerText =
                        `Enter the 6-digit OTP sent to ${maskedMobile}.`;

                } else {

                    otpStatus.innerText =
                        "Enter the 6-digit OTP sent to your registered mobile number.";
                }
            }


            const otpInput =
                document.getElementById(
                    "otp"
                );


            if (otpInput) {

                otpInput.value = "";

                otpInput.focus();
            }

        }, 3600);


    } catch (error) {

        console.error(
            "Phone verification error:",
            error
        );

        alert(
            error.message ||
            "Unable to connect to T-REX backend."
        );

    } finally {

        if (continueButton) {

            continueButton.disabled = false;

            continueButton.innerText =
                originalButtonText;
        }
    }
}


// =========================================================
// OTP VERIFICATION
// =========================================================

async function verifyOTP() {

    const otpElement =
        document.getElementById(
            "otp"
        );


    if (!otpElement) {

        console.error(
            "OTP input element was not found."
        );

        return;
    }


    const otp =
        otpElement.value.trim();


    // =====================================================
    // GET SESSION
    // =====================================================

    const verificationId =
        sessionStorage.getItem(
            "verificationId"
        ) ||
        sessionStorage.getItem(
            "otpSessionId"
        );


    const userId =
        sessionStorage.getItem(
            "userId"
        );


    // =====================================================
    // OTP VALIDATION
    // =====================================================

    if (!/^\d{6}$/.test(otp)) {

        alert(
            "Please enter the 6-digit OTP."
        );

        return;
    }


    if (!verificationId) {

        alert(
            "Verification session expired. Please start again."
        );

        return;
    }


    // =====================================================
    // VERIFY BUTTON
    // =====================================================

    const verifyButton =
        document.querySelector(
            "#otpSection button"
        );


    const originalButtonText =
        verifyButton
            ? verifyButton.innerText
            : "Verify OTP →";


    if (verifyButton) {

        verifyButton.disabled = true;

        verifyButton.innerText =
            "Verifying...";
    }


    try {

        // =================================================
        // PREPARE BACKEND BODY
        // =================================================

        const requestBody = {

            /*
             * New auth flow.
             *
             * auth.service.js can use verificationId
             * as the application OTP session.
             */
            verificationId,

            otp
        };


        /*
         * Include userId only if the backend created one.
         *
         * This keeps compatibility with the previous
         * authentication implementation.
         */
        if (userId) {

            requestBody.userId =
                userId;
        }


        console.log(
            "Sending OTP verification request."
        );


        // =================================================
        // CALL BACKEND
        // =================================================

        const response =
            await fetch(
                `${API_BASE_URL}/auth/verify-otp`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            requestBody
                        )
                }
            );


        const result =
            await parseApiResponse(
                response
            );


        console.log(
            "T-REX /auth/verify-otp response:",
            result
        );


        // =================================================
        // OTP ERROR
        // =================================================

        if (
            !response.ok ||
            !result.success
        ) {

            console.error(
                "OTP verification failed:",
                result
            );

            alert(
                result.message ||
                "OTP verification failed."
            );

            return;
        }


        // =================================================
        // TOKEN
        // =================================================

        const token =
            result.token ||
            result.data?.token;


        if (!token) {

            console.error(
                "OTP verification succeeded but no JWT token was returned:",
                result
            );

            alert(
                "Authentication token was not received."
            );

            return;
        }


        // =================================================
        // SAVE JWT
        // =================================================

        sessionStorage.setItem(
            "trexToken",
            token
        );


        console.log(
            "T-REX phone authentication successful."
        );


        // =================================================
        // LOAD AUTHENTICATED PROFILE
        // =================================================

        try {

            const profileResponse =
                await fetch(
                    `${API_BASE_URL}/profile`,
                    {
                        method: "GET",

                        headers: {
                            "Authorization":
                                `Bearer ${token}`
                        }
                    }
                );


            const profileResult =
                await parseApiResponse(
                    profileResponse
                );


            if (
                profileResponse.ok &&
                profileResult.success
            ) {

                const profile =
                    profileResult.user ||
                    profileResult.profile ||
                    profileResult.data ||
                    null;


                if (profile) {

                    sessionStorage.setItem(
                        "trexProfileName",
                        profile.name ||
                        "Verified Requester"
                    );


                    console.log(
                        "T-REX authenticated profile:",
                        profile
                    );
                }

            } else {

                console.warn(
                    "Authentication succeeded, but profile could not be loaded:",
                    profileResult
                );
            }

        } catch (profileError) {

            /*
             * Do not invalidate successful authentication
             * just because profile loading failed.
             */

            console.warn(
                "Unable to load authenticated profile:",
                profileError
            );
        }


        // =================================================
        // CLEAN OTP SESSION
        // =================================================

        sessionStorage.removeItem(
            "verificationId"
        );

        sessionStorage.removeItem(
            "otpSessionId"
        );

        sessionStorage.removeItem(
            "userId"
        );

        sessionStorage.removeItem(
            "verificationPhone"
        );


        // =================================================
        // SHOW SUCCESS
        // =================================================

        showOnlySection(
            "successSection"
        );


    } catch (error) {

        console.error(
            "OTP verification error:",
            error
        );

        alert(
            error.message ||
            "Unable to connect to T-REX backend."
        );

    } finally {

        if (verifyButton) {

            verifyButton.disabled = false;

            verifyButton.innerText =
                originalButtonText;
        }
    }
}


// =========================================================
// DASHBOARD
// =========================================================

function openDashboard() {

    const token =
        sessionStorage.getItem(
            "trexToken"
        );


    if (!token) {

        alert(
            "Your login session is not active. Please log in again."
        );

        return;
    }


    window.location.href =
        "../Dashboard/Dashboard.html";
}


// =========================================================
// DOM READY
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        // =================================================
        // OTP INPUT
        // =================================================

        const otpInput =
            document.getElementById(
                "otp"
            );


        if (otpInput) {

            otpInput.addEventListener(
                "keydown",
                function (event) {

                    if (
                        event.key === "Enter"
                    ) {

                        event.preventDefault();

                        verifyOTP();
                    }
                }
            );


            otpInput.addEventListener(
                "input",
                function () {

                    this.value =
                        this.value
                            .replace(/\D/g, "")
                            .slice(0, 6);
                }
            );
        }


        // =================================================
        // PHONE INPUT
        // =================================================

        const phoneInput =
            document.getElementById("phone") ||
            document.getElementById("mobile");


        if (phoneInput) {

            phoneInput.addEventListener(
                "input",
                function () {

                    this.value =
                        this.value
                            .replace(/[^\d+]/g, "")
                            .slice(0, 13);
                }
            );
        }
    }
);
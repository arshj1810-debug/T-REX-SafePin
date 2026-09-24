# T-REX / SafePin Integration Fixes

The project has been connected so the authenticated user, cases, requests, documents, notifications, security state, and tracking use the same backend identity and Case ID flow.

## Main fixes

- Request creation now creates a backend Case and then uploads the selected supporting document to `/api/documents/:caseId`.
- `FormData` uploads no longer receive an incorrect JSON Content-Type header.
- Supporting document uploads create a notification and audit entry.
- Tracking validates the saved Case ID against the authenticated user's current backend cases before loading `/cases/:caseId`.
- Tracking also loads documents for the active case.
- Security protection state now lives in the shared repository rather than a controller-local Map.
- Security activation creates a notification and audit entry.
- Case creation and lookup use normalized user/Case IDs and enforce ownership.
- Request.html now accepts General Query and General Document Update selections used by Documents.js.
- New authenticated users have a stable `requester` role.
- Existing UI and navigation were preserved.

## Run

Backend:

```bash
cd trex-backend
npm install
npm run dev
```

Serve `FRONTEND` through a local HTTP server. Do not open the HTML files directly with `file://` if the browser blocks API requests.

## Test flow

1. Open Login.
2. Complete SMS OTP login.
3. Open Dashboard.
4. Open Documents or Request.
5. Select a service, action, reason, and optionally a supporting PDF/JPG/PNG under 5 MB.
6. Submit the request.
7. Confirm a Case ID is shown.
8. Open Tracking and confirm the same Case ID and timeline appear.
9. Open Notifications and confirm request/document notifications.
10. Open Security and activate protection; confirm the status becomes active and a security notification appears.
11. Open Profile and System and confirm they show the same authenticated user and case/request counts.

## Important MVP limitation

The current backend repository is intentionally in-memory. Restarting Node clears cases, documents, requests, notifications, and security state. The frontend now handles stale Case IDs safely, but durable persistence requires the database repository integration later.

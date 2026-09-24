# T-REX / SafePin Backend MVP

This backend is designed to sit behind the existing SafePin/T-REX HTML/CSS/JS frontend. It deliberately does **not** own the database layer. For now it uses an in-memory repository so the API can be developed and tested while another teammate builds the database.

## Stack
- Node.js
- Express
- JWT authentication
- Multer file uploads
- In-memory repository (temporary)

## Run
```bash
npm install
copy .env.example .env   # Windows
# or: cp .env.example .env
npm run dev
```

API: `http://localhost:5000`

Health check: `GET /api/health`

## Demo authentication
`POST /api/auth/start`
```json
{"aadhaar":"123456789012","deathCertificate":"DC-001"}
```

The backend returns a `verificationId` and requires OTP.

`POST /api/auth/verify-otp`
```json
{"verificationId":"...","userId":"...","otp":"123456"}
```

The OTP is configurable through `DEMO_OTP`. This is a demo flow, not a live UIDAI/CRS integration.

## Main endpoints
- `POST /api/auth/start`
- `POST /api/auth/verify-otp`
- `GET /api/auth/me`
- `POST /api/cases`
- `GET /api/cases`
- `GET /api/cases/:caseId`
- `POST /api/requests`
- `GET /api/requests`
- `GET /api/requests/:caseId`
- `POST /api/documents/:caseId` (multipart field: `file`)
- `GET /api/documents/:caseId`
- `GET /api/notifications`
- `PATCH /api/notifications/:notificationId/read`
- `GET /api/profile`
- `PATCH /api/profile`
- `GET /api/security/protection`
- `POST /api/security/protection`

## Important
The `repositories/memory.repository.js` file is the seam for the database teammate. Replace its implementation with PostgreSQL/MongoDB/etc. without changing the frontend API contract.

Uploaded files are stored locally only for this prototype. Do not deploy this storage model with real sensitive identity documents.

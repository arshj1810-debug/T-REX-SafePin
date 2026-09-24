require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { notFound, errorHandler } = require('./middleware/error');

// --------------------------------------------------
// Environment
// --------------------------------------------------

const isVercel = Boolean(process.env.VERCEL);

if (!process.env.JWT_SECRET) {
    if (isVercel) {
        console.warn(
            'WARNING: JWT_SECRET is not configured in Vercel environment variables.'
        );
    } else {
        process.env.JWT_SECRET = 'dev-only-secret-change-me';

        console.warn(
            'WARNING: JWT_SECRET is not set. Using development secret.'
        );
    }
}

// --------------------------------------------------
// App
// --------------------------------------------------

const app = express();

// --------------------------------------------------
// Paths
// --------------------------------------------------

/*
T-REX
├── FRONTEND
│   ├── Login
│   ├── Dashboard
│   ├── Documents
│   └── ...
│
└── trex-backend
    └── src
        └── server.js
*/

const frontendPath = path.resolve(
    __dirname,
    '..',
    '..',
    'FRONTEND'
);

/*
Vercel serverless functions cannot use the deployment
filesystem as persistent writable storage.

Local:
    ./uploads

Vercel:
    /tmp/uploads

IMPORTANT:
Vercel /tmp storage is temporary and should not be treated
as permanent document storage.
*/

const uploadsPath = isVercel
    ? path.join('/tmp', 'trex-uploads')
    : path.join(process.cwd(), 'uploads');

// --------------------------------------------------
// Verify Frontend Directory
// --------------------------------------------------

if (!fs.existsSync(frontendPath)) {
    console.warn(
        `WARNING: FRONTEND directory was not found at: ${frontendPath}`
    );
} else {
    console.log(
        `Frontend directory: ${frontendPath}`
    );
}

// --------------------------------------------------
// CORS
// --------------------------------------------------

const frontendOrigin = process.env.FRONTEND_ORIGIN;

app.use(
    cors({
        origin: frontendOrigin || true,
        credentials: true
    })
);

// --------------------------------------------------
// Body Parsers
// --------------------------------------------------

app.use(
    express.json({
        limit: '1mb'
    })
);

app.use(
    express.urlencoded({
        extended: true
    })
);

// --------------------------------------------------
// Upload Directory
// --------------------------------------------------

/*
Only create the directory when necessary.

On Vercel this uses /tmp, which is writable during
the lifetime of the serverless function.
*/

try {
    if (!fs.existsSync(uploadsPath)) {
        fs.mkdirSync(uploadsPath, {
            recursive: true
        });
    }

    console.log(
        `Upload directory: ${uploadsPath}`
    );
} catch (error) {
    console.error(
        'WARNING: Could not initialize upload directory:',
        error
    );
}

// --------------------------------------------------
// Health Check
// --------------------------------------------------

app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        service: 'T-REX backend',
        status: 'ok',
        environment: isVercel
            ? 'vercel'
            : 'local',
        time: new Date().toISOString()
    });
});

// --------------------------------------------------
// API Routes
// --------------------------------------------------

app.use(
    '/api/auth',
    require('./routes/auth.routes')
);

app.use(
    '/api/cases',
    require('./routes/case.routes')
);

app.use(
    '/api/requests',
    require('./routes/request.routes')
);

app.use(
    '/api/documents',
    require('./routes/document.routes')
);

app.use(
    '/api/notifications',
    require('./routes/notification.routes')
);

app.use(
    '/api/profile',
    require('./routes/profile.routes')
);

app.use(
    '/api/security',
    require('./routes/security.routes')
);

// --------------------------------------------------
// Uploaded Files
// --------------------------------------------------

if (fs.existsSync(uploadsPath)) {
    app.use(
        '/uploads',
        express.static(uploadsPath)
    );
}

// --------------------------------------------------
// FRONTEND
// --------------------------------------------------

/*
Serve the complete FRONTEND directory when it is
available in the deployment package.
*/

if (fs.existsSync(frontendPath)) {

    app.use(
        express.static(frontendPath)
    );

    // --------------------------------------------------
    // Login Page
    // --------------------------------------------------

    app.get('/', (req, res) => {
        const loginPath = path.join(
            frontendPath,
            'Login',
            'Login.html'
        );

        if (!fs.existsSync(loginPath)) {
            return res.status(404).send(
                'T-REX Login page was not found.'
            );
        }

        return res.sendFile(loginPath);
    });

} else {

    /*
    If Vercel did not package FRONTEND, return a useful
    diagnostic instead of crashing the function.
    */

    app.get('/', (req, res) => {
        return res.status(500).json({
            success: false,
            error: 'FRONTEND directory is not available in the deployment.',
            frontendPath
        });
    });
}

// --------------------------------------------------
// Error Handling
// --------------------------------------------------

app.use(notFound);

app.use(errorHandler);

// --------------------------------------------------
// Local Server
// --------------------------------------------------

const PORT = Number(
    process.env.PORT || 5000
);

/*
Vercel imports this file as a serverless function.

Therefore app.listen() must NOT run on Vercel.

Locally:
    npm run dev
    or
    npm start

will still start the Express server normally.
*/

if (!isVercel && require.main === module) {

    app.listen(PORT, () => {

        console.log(
            `T-REX server running on http://localhost:${PORT}`
        );

        console.log(
            `T-REX API available at http://localhost:${PORT}/api`
        );

        console.log(
            `T-REX website available at http://localhost:${PORT}/`
        );

    });
}

// --------------------------------------------------
// Vercel / Express Export
// --------------------------------------------------

module.exports = app;
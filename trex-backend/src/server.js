require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { notFound, errorHandler } = require('./middleware/error');

// --------------------------------------------------
// Environment
// --------------------------------------------------

if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'dev-only-secret-change-me';

    console.warn(
        'WARNING: JWT_SECRET is not set. Using development secret.'
    );
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
│   ├── Request
│   ├── Tracking
│   ├── Notifications
│   ├── Profile
│   ├── Security
│   └── System
│
└── trex-backend
    ├── src
    │   └── server.js
    └── uploads
*/

const frontendPath = path.resolve(
    __dirname,
    '..',
    '..',
    'FRONTEND'
);

const uploadsPath = path.resolve(
    __dirname,
    '..',
    'uploads'
);

// --------------------------------------------------
// Verify Directories
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
        environment: 'server',
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

if (fs.existsSync(frontendPath)) {

    // Serve all frontend files
    app.use(
        express.static(frontendPath)
    );

    // --------------------------------------------------
    // Home → Login
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

    app.get('/', (req, res) => {
        res.status(500).send(
            'T-REX frontend directory was not found.'
        );
    });
}

// --------------------------------------------------
// Error Handling
// --------------------------------------------------

app.use(notFound);

app.use(errorHandler);

// --------------------------------------------------
// Start Server
// --------------------------------------------------

const PORT = Number(
    process.env.PORT || 5000
);

app.listen(
    PORT,
    '0.0.0.0',
    () => {

        console.log('');
        console.log('======================================');
        console.log('       T-REX / SafePin SERVER');
        console.log('======================================');
        console.log(
            `Website: http://localhost:${PORT}/`
        );
        console.log(
            `API:     http://localhost:${PORT}/api`
        );
        console.log(
            `Health:  http://localhost:${PORT}/api/health`
        );
        console.log('======================================');
        console.log('');
    }
);
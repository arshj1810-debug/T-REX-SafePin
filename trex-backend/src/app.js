require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { notFound, errorHandler } = require('./middleware/error');

// ==================================================
// ENVIRONMENT
// ==================================================

if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'dev-only-secret-change-me';

    console.warn(
        'WARNING: JWT_SECRET is not set. Using development secret.'
    );
}

// ==================================================
// APP
// ==================================================

const app = express();

// ==================================================
// PATHS
// ==================================================

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

// ==================================================
// VERIFY FRONTEND DIRECTORY
// ==================================================

if (fs.existsSync(frontendPath)) {
    console.log(
        `Frontend directory: ${frontendPath}`
    );
} else {
    console.warn(
        `WARNING: FRONTEND directory was not found at: ${frontendPath}`
    );
}

// ==================================================
// CORS
// ==================================================

const frontendOrigin = process.env.FRONTEND_ORIGIN;

app.use(
    cors({
        origin: frontendOrigin || true,
        credentials: true,
        methods: [
            'GET',
            'POST',
            'PUT',
            'PATCH',
            'DELETE',
            'OPTIONS'
        ],
        allowedHeaders: [
            'Content-Type',
            'Authorization'
        ]
    })
);

// ==================================================
// BODY PARSERS
// ==================================================

app.use(
    express.json({
        limit: '1mb'
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: '1mb'
    })
);

// ==================================================
// UPLOAD DIRECTORY
// ==================================================

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

// ==================================================
// HEALTH CHECK
// ==================================================

// Supports:
// GET http://localhost:5000/api/health

app.get('/api/health', (req, res) => {
    return res.status(200).json({
        success: true,
        service: 'T-REX backend',
        status: 'ok',
        environment: 'server',
        time: new Date().toISOString()
    });
});

// Optional compatibility route:
// GET http://localhost:5000/health

app.get('/health', (req, res) => {
    return res.status(200).json({
        success: true,
        service: 'T-REX backend',
        status: 'ok',
        environment: 'server',
        time: new Date().toISOString()
    });
});

// ==================================================
// API ROUTES
// ==================================================

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

// ==================================================
// UPLOADED FILES
// ==================================================

if (fs.existsSync(uploadsPath)) {
    app.use(
        '/uploads',
        express.static(uploadsPath)
    );
}

// ==================================================
// FRONTEND STATIC FILES
// ==================================================

if (fs.existsSync(frontendPath)) {

    console.log(
        `Serving frontend from: ${frontendPath}`
    );

    app.use(
        express.static(frontendPath)
    );

    // ------------------------------------------------
    // ROOT → LOGIN PAGE
    // ------------------------------------------------

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

    // ------------------------------------------------
    // FRONTEND NOT FOUND
    // ------------------------------------------------

    app.get('/', (req, res) => {

        return res.status(500).json({
            success: false,
            message: 'T-REX frontend directory was not found.',
            frontendPath
        });
    });
}

// ==================================================
// 404 HANDLER
// ==================================================

app.use(notFound);

// ==================================================
// GLOBAL ERROR HANDLER
// ==================================================

app.use(errorHandler);

// ==================================================
// EXPORT APP
// ==================================================

module.exports = app;

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

// T-REX
// ├── FRONTEND
// └── trex-backend
//     └── src
//         └── server.js

const frontendPath = path.join(
    __dirname,
    '..',
    '..',
    'FRONTEND'
);

const uploadsPath = path.join(
    process.cwd(),
    'uploads'
);

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

if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, {
        recursive: true
    });
}

// --------------------------------------------------
// Health Check
// --------------------------------------------------

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        service: 'T-REX backend',
        status: 'ok',
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

app.use(
    '/uploads',
    express.static(uploadsPath)
);

// --------------------------------------------------
// FRONTEND
// --------------------------------------------------

// Serve the complete FRONTEND folder.
if (fs.existsSync(frontendPath)) {
    app.use(
        express.static(frontendPath)
    );

    // Open the T-REX website at:
    // http://localhost:5000/
    //
    // The current login page is located at:
    // FRONTEND/Login/Login.html

    app.get('/', (req, res) => {
        res.sendFile(
            path.join(
                frontendPath,
                'Login',
                'Login.html'
            )
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

if (require.main === module) {
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

module.exports = app;
require('dotenv').config();

const app = require('./app');

// ==================================================
// SERVER CONFIGURATION
// ==================================================

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// ==================================================
// START SERVER
// ==================================================

const server = app.listen(
    PORT,
    HOST,
    () => {

        console.log('');
        console.log('======================================');
        console.log('          T-REX BACKEND SERVER');
        console.log('======================================');

        console.log(
            `Server:  http://localhost:${PORT}`
        );

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
        console.log('T-REX backend started successfully.');
        console.log('');
    }
);

// ==================================================
// SERVER ERROR HANDLING
// ==================================================

server.on('error', (error) => {

    console.error('');
    console.error('======================================');
    console.error('       T-REX SERVER ERROR');
    console.error('======================================');

    if (error.code === 'EADDRINUSE') {

        console.error(
            `Port ${PORT} is already in use.`
        );

        console.error(
            'Stop the other server using this port and try again.'
        );

    } else {

        console.error(
            'Server error:',
            error
        );
    }

    console.error('======================================');
    console.error('');

    process.exit(1);
});

// ==================================================
// PROCESS ERROR HANDLING
// ==================================================

process.on('unhandledRejection', (reason) => {

    console.error('');
    console.error(
        'Unhandled Promise Rejection:',
        reason
    );
});

process.on('uncaughtException', (error) => {

    console.error('');
    console.error(
        'Uncaught Exception:',
        error
    );

    process.exit(1);
});

// ==================================================
// GRACEFUL SHUTDOWN
// ==================================================

const shutdown = (signal) => {

    console.log('');
    console.log(
        `${signal} received. Shutting down T-REX server...`
    );

    server.close(() => {

        console.log(
            'T-REX server stopped successfully.'
        );

        process.exit(0);
    });
};

process.on('SIGINT', () => {
    shutdown('SIGINT');
});

process.on('SIGTERM', () => {
    shutdown('SIGTERM');
});
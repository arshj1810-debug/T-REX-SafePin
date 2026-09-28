require('dotenv').config();

const {
    testDatabaseConnection
} = require('./database');

async function main() {
    try {
        const result =
            await testDatabaseConnection();

        console.log('');
        console.log(
            '======================================'
        );
        console.log(
            ' PostgreSQL connection successful!'
        );
        console.log(
            '======================================'
        );
        console.log(
            `Database: ${result.database}`
        );
        console.log(
            `Server time: ${result.time}`
        );
        console.log(
            '======================================'
        );
        console.log('');

        process.exit(0);
    } catch (error) {
        console.error('');
        console.error(
            'PostgreSQL connection FAILED.'
        );
        console.error(
            error.message
        );
        console.error('');

        process.exit(1);
    }
}

main();
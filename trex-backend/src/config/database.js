
const { Pool } = require('pg');

const isProduction =
    process.env.NODE_ENV === 'production';

const databaseUrl = process.env.DATABASE_URL;

const poolConfig = databaseUrl
    ? {
          connectionString: databaseUrl,
          ssl: {
              rejectUnauthorized: false
          }
      }
    : {
          host: process.env.DB_HOST || 'localhost',
          port: Number(process.env.DB_PORT || 5433),
          database: process.env.DB_NAME || 'trex_safepin',
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || '',
          ssl: false
      };

const pool = new Pool({
    ...poolConfig,

    // Explicitly select the schema used by T-REX.
    options: '-c search_path=public',

    max: Number(process.env.DB_POOL_MAX || 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
});

pool.on('error', (error) => {
    console.error(
        'Unexpected PostgreSQL pool error:',
        error.message
    );
});

async function testDatabaseConnection() {
    const client = await pool.connect();

    try {
        const result = await client.query(`
            SELECT
                current_database() AS database,
                current_schema() AS schema,
                current_user AS connected_user,
                NOW() AS time
        `);

        return result.rows[0];
    } finally {
        client.release();
    }
}

async function query(text, params = []) {
    return pool.query(text, params);
}

async function getClient() {
    return pool.connect();
}

module.exports = {
    pool,
    query,
    getClient,
    testDatabaseConnection
};
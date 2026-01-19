const { Pool } = require('pg');

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  pool.on('error', err => {
    process.stderr.write(`Postgres pool error: ${err.message}\n`);
  });
  return pool;
}

module.exports = { createPool };


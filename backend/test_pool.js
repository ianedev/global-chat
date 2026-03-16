const mariadb = require('mariadb');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL
  .replace(/^mysql:\/\//, 'mariadb://')
  .replace(/:@/, '@')
  .replace(/localhost/, '127.0.0.1');

console.log('Testing pool to:', connectionString);

const pool = mariadb.createPool(connectionString);

async function test() {
  let conn;
  try {
    console.log('Attempting to get connection from pool...');
    conn = await pool.getConnection();
    console.log('✅ Successfully got connection!');
    const rows = await conn.query('SELECT 1 as val');
    console.log('Query result:', rows);
  } catch (err) {
    console.error('❌ Pool connection failed:', err);
  } finally {
    if (conn) conn.release();
    await pool.end();
  }
}

test();

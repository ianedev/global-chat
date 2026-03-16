const mariadb = require('mariadb');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL
  .replace(/^mysql:\/\//, 'mariadb://')
  .replace(/:@/, '@')
  .replace(/localhost/, '127.0.0.1');

console.log('Testing connection to:', connectionString);

async function test() {
  let conn;
  try {
    conn = await mariadb.createConnection(connectionString);
    console.log('✅ Successfully connected!');
    const rows = await conn.query('SELECT 1 as val');
    console.log('Query result:', rows);
  } catch (err) {
    console.error('❌ Connection failed:', err);
  } finally {
    if (conn) conn.end();
  }
}

test();

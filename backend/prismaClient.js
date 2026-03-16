const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');
const mariadb = require('mariadb');
require('dotenv').config();

// Production-ready MariaDB connection handling
const connectionString = process.env.DATABASE_URL
  ? process.env.DATABASE_URL
      .replace(/^mysql:\/\//, 'mariadb://')
      .replace(/:@/, '@') // Handle empty passwords if needed
  : 'mariadb://root:@127.0.0.1:3306/map_chat';

console.log('🔗 Database connection string:', connectionString.replace(/:.*@/, ':****@'));

const pool = mariadb.createPool(connectionString);
const adapter = new PrismaMariaDb(pool);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;

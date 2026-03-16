const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDB } = require('@prisma/adapter-mariadb');
const mariadb = require('mariadb');

const connectionString = process.env.DATABASE_URL;
const pool = mariadb.createPool(connectionString);
const adapter = new PrismaMariaDB(pool);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;

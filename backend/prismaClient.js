const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// Determine the database URL with proper fallbacks and protocol mapping
const getDatabaseUrl = () => {
  // Common Railway/Render/Vercel keys
  const url = process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.MARIADB_URL;
  
  if (!url) {
    console.warn('⚠️ No DATABASE_URL found in environment. Falling back to localhost.');
    return 'mysql://root:@127.0.0.1:3306/map_chat';
  }

  // Ensure mysql:// protocol for Prisma's native connector
  let correctedUrl = url.replace('mariadb://', 'mysql://').replace(/localhost/g, '127.0.0.1');
  
  // Ensure the URL is properly formatted for Prisma if missing protocol entirely (unlikely but safe)
  if (!correctedUrl.includes('://')) {
    correctedUrl = `mysql://${correctedUrl}`;
  }

  return correctedUrl;
};

const databaseUrl = getDatabaseUrl();

// Debugging: Log the connection URL (masked for security)
const maskedUrl = databaseUrl.replace(/:[^:@]*@/, ':****@').split('?')[0];
console.log(`🔗 Prisma connecting to: ${maskedUrl}`);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
  log: ['error', 'warn'],
});

module.exports = prisma;

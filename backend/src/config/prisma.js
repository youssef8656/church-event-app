const { PrismaClient } = require('@prisma/client');
const env = require('./env');

// Single shared Prisma instance across the app (recommended pattern).
const prisma = new PrismaClient({
  log: env.nodeEnv === 'development' ? ['warn', 'error'] : ['error'],
});

module.exports = prisma;

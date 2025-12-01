const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Export a single prisma client instance for the app to use
module.exports = prisma;

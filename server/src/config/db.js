const { PrismaClient } = require("@prisma/client");

// Singleton Prisma client to avoid multiple connections in development
const prisma = new PrismaClient();

module.exports = prisma;

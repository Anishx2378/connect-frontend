const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst();
  if (user) {
    const token = jwt.sign({ userId: user.id }, 'coderaxo-connect-jwt-secret-dev-2024', { expiresIn: '1d' });
    console.log(token);
    
    // Also get their workspace
    const member = await prisma.workspaceMember.findFirst({ where: { userId: user.id } });
    console.log("Workspace:", member ? member.workspaceId : 'none');
  } else {
    console.log("No user found");
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'admin@coderaxo.dev';
  const password = 'Admin@123';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create or update the user
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      emailVerified: true,
      name: 'Super Admin',
      firstName: 'Super',
      lastName: 'Admin',
      designation: 'Super Admin',
    },
    create: {
      email,
      password: hashedPassword,
      emailVerified: true,
      name: 'Super Admin',
      firstName: 'Super',
      lastName: 'Admin',
      designation: 'Super Admin',
    }
  });

  console.log(`✅ User ${email} created/updated successfully.`);

  // Get all workspaces
  const workspaces = await prisma.workspace.findMany();
  
  if (workspaces.length === 0) {
    console.log('ℹ️ No workspaces found. Creating a default workspace...');
    const newWs = await prisma.workspace.create({
      data: {
        name: 'Main Workspace',
        slug: 'main-workspace',
        createdById: user.id,
      }
    });
    
    await prisma.workspaceMember.create({
      data: {
        userId: user.id,
        workspaceId: newWs.id,
        role: 'OWNER'
      }
    });
    console.log(`✅ Default workspace created and user assigned as OWNER.`);
  } else {
    // Add user as OWNER to all existing workspaces
    let addedCount = 0;
    for (const ws of workspaces) {
      const existingMember = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId: user.id, workspaceId: ws.id } }
      });
      
      if (existingMember) {
        await prisma.workspaceMember.update({
          where: { id: existingMember.id },
          data: { role: 'OWNER' }
        });
      } else {
        await prisma.workspaceMember.create({
          data: {
            userId: user.id,
            workspaceId: ws.id,
            role: 'OWNER'
          }
        });
        addedCount++;
      }
    }
    console.log(`✅ User assigned as OWNER to ${workspaces.length} workspaces (${addedCount} newly added).`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

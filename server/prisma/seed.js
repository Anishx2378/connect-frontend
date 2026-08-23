const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // ─── 1. Create Workspace ─────────────────────────────
  const workspace = await prisma.workspace.upsert({
    where: { slug: "coderaxo" },
    update: {},
    create: {
      name: "Coderaxo",
      slug: "coderaxo",
    },
  });
  console.log(`✅ Workspace: ${workspace.name} (${workspace.id})`);

  // ─── 2. Create Admin User ────────────────────────────
  const hashedPassword = await bcrypt.hash("Admin@123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@coderaxo.dev" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@coderaxo.dev",
      password: hashedPassword,
      role: "ADMIN",
      workspaceId: workspace.id,
    },
  });
  console.log(`✅ Admin: ${admin.name} (${admin.email})`);

  // ─── 3. Create Default Channels ──────────────────────
  const channelConfigs = [
    { name: "general", description: "General team discussion", isAdminOnly: false },
    { name: "announcements", description: "Company announcements (admin only)", isAdminOnly: true },
    { name: "projects", description: "Project updates and collaboration", isAdminOnly: false },
    { name: "interns", description: "Intern discussions and resources", isAdminOnly: false },
  ];

  const channels = [];
  for (const config of channelConfigs) {
    const channel = await prisma.channel.upsert({
      where: {
        name_workspaceId: { name: config.name, workspaceId: workspace.id },
      },
      update: {},
      create: {
        name: config.name,
        description: config.description,
        isAdminOnly: config.isAdminOnly,
        workspaceId: workspace.id,
      },
    });
    channels.push(channel);
    console.log(`✅ Channel: #${channel.name}${config.isAdminOnly ? " (admin only)" : ""}`);
  }

  // ─── 4. Add Admin to All Channels ────────────────────
  for (const channel of channels) {
    await prisma.channelMember.upsert({
      where: {
        userId_channelId: { userId: admin.id, channelId: channel.id },
      },
      update: {},
      create: {
        userId: admin.id,
        channelId: channel.id,
      },
    });
  }
  console.log(`✅ Admin added to all ${channels.length} channels`);

  console.log("\n🎉 Seed completed successfully!");
  console.log(`\n📋 Login with:\n   Email: admin@coderaxo.dev\n   Password: Admin@123\n`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

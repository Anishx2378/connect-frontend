const prisma = require("../config/db");

async function fix() {
  const users = await prisma.user.findMany();
  const channels = await prisma.channel.findMany({ where: { isPrivate: false } });

  for (const channel of channels) {
    for (const user of users) {
      const existing = await prisma.channelMember.findUnique({
        where: { userId_channelId: { userId: user.id, channelId: channel.id } }
      });
      if (!existing) {
        await prisma.channelMember.create({
          data: { userId: user.id, channelId: channel.id }
        });
        console.log(`Added ${user.name} to ${channel.name}`);
      }
    }
  }
}

fix().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });

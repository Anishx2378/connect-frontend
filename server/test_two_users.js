const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

async function run() {
  try {
    const user1 = await prisma.user.create({
      data: {
        firstName: 'Test1', lastName: 'User1', name: 'Test User1',
        email: 'test1@example.com', password: 'password',
        emailVerified: false, verificationToken: 'token-1',
      }
    });
    const user2 = await prisma.user.create({
      data: {
        firstName: 'Test2', lastName: 'User2', name: 'Test User2',
        email: 'test2@example.com', password: 'password',
        emailVerified: false, verificationToken: 'token-2',
      }
    });

    console.log('Created users');

    const res1 = await axios.post("http://localhost:4000/api/auth/verify-email", { token: 'token-1' });
    console.log('Res1:', res1.status);

    const res2 = await axios.post("http://localhost:4000/api/auth/verify-email", { token: 'token-2' });
    console.log('Res2:', res2.status);
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  } finally {
    await prisma.user.deleteMany({
      where: { email: { in: ['test1@example.com', 'test2@example.com'] } }
    });
  }
}
run();

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

async function run() {
  try {
    const res = await axios.post("http://localhost:4000/api/auth/verify-email", { token: null });
    console.log('Status:', res.status);
  } catch (err) {
    console.log('Status:', err.response ? err.response.status : err.message);
    console.log('Data:', err.response ? err.response.data : '');
  }
}
run();

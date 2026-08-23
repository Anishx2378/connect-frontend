const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    const deletedUser = await prisma.user.delete({
      where: { email: 'anishhamayoon08@gmail.com' }
    })
    console.log('User deleted successfully:', deletedUser.email)
  } catch (error) {
    if (error.code === 'P2025') {
      console.log('User not found in DB.')
    } else {
      console.error('Error deleting user:', error)
    }
  }
}
main().finally(() => prisma.$disconnect())

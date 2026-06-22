const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🔒 Hashing passwords for existing users...');
  
  // Fetch all users
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users in database.`);
  
  const defaultPassword = 'changeme123';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);
  
  let updatedCount = 0;
  for (const user of users) {
    // Only set if password is not set or we want to overwrite
    await prisma.user.update({
      where: { user_id: user.user_id },
      data: {
        password: hashedPassword
      }
    });
    updatedCount++;
  }
  
  console.log(`✅ Successfully updated ${updatedCount} users with password: '${defaultPassword}'`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

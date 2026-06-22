const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🔒 Hashing passwords for existing users...');
  
  // Fetch all users
  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users in database.`);
  
  let updatedCount = 0;
  for (const user of users) {
    const passwordToHash = user.role.toLowerCase() === 'admin' ? 'password123' : 'test123';
    const hashedPassword = await bcrypt.hash(passwordToHash, 10);
    
    await prisma.user.update({
      where: { user_id: user.user_id },
      data: {
        password: hashedPassword
      }
    });
    updatedCount++;
  }
  
  console.log(`✅ Successfully updated ${updatedCount} users.`);
  console.log(`🔑 Admin accounts password is set to 'password123'`);
  console.log(`🔑 Other accounts password is set to 'test123'`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

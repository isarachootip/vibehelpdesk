import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Simple security check
    if (secret !== 'vfix999') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔒 Hashing passwords for existing users...');
    const users = await prisma.user.findMany();
    
    let updatedCount = 0;
    for (const user of users) {
      const passwordToHash = user.email === 'admin@company.com' ? 'password123' : 'changeme123';
      const hashedPassword = await bcrypt.hash(passwordToHash, 10);
      
      await prisma.user.update({
        where: { user_id: user.user_id },
        data: {
          password: hashedPassword
        }
      });
      updatedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully hashed passwords for ${updatedCount} users.`,
      admin: 'admin@company.com -> password123',
      others: 'changeme123'
    });

  } catch (error) {
    console.error('Setup passwords error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

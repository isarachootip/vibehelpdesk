import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get('email');
    const passParam = searchParams.get('password');

    // 1. Fetch all users for debugging
    const users = await prisma.user.findMany({
      select: {
        user_id: true,
        email: true,
        full_name: true,
        role: true,
        is_active: true,
        password: true // we'll just check if it is null or not
      }
    });

    const userList = users.map(u => ({
      user_id: u.user_id,
      email: u.email,
      email_length: u.email ? u.email.length : 0,
      role: u.role,
      is_active: u.is_active,
      has_password: !!u.password
    }));

    // 2. If email and password parameters are provided, test the matching
    let testResult = null;
    if (emailParam && passParam) {
      const matchedUser = users.find(u => u.email.toLowerCase().trim() === emailParam.toLowerCase().trim());
      if (!matchedUser) {
        testResult = `User with email '${emailParam}' not found in database.`;
      } else {
        const isMatch = await bcrypt.compare(passParam, matchedUser.password || '');
        testResult = {
          email: matchedUser.email,
          role: matchedUser.role,
          is_active: matchedUser.is_active,
          entered_password: passParam,
          is_password_correct: isMatch
        };
      }
    }

    return NextResponse.json({
      total_users: users.length,
      users: userList,
      test_result: testResult
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

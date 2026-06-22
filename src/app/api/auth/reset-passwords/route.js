import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-key-12345'
);

export async function GET() {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('hd_token');

    if (!tokenCookie) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ / Please login first' }, { status: 401 });
    }

    const { value: token } = tokenCookie;
    
    // Verify token
    let payload;
    try {
      const { payload: verifiedPayload } = await jose.jwtVerify(token, JWT_SECRET);
      payload = verifiedPayload;
    } catch (e) {
      return NextResponse.json({ error: 'โทเค็นไม่ถูกต้อง / Invalid token' }, { status: 401 });
    }

    // Double check user role in database
    const requestUser = await prisma.user.findUnique({
      where: { user_id: payload.userId }
    });

    if (!requestUser || requestUser.role.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถทำรายการนี้ได้ / Admin only' }, { status: 403 });
    }

    console.log('🔒 Hashing passwords to test123 for all non-admin users in production...');
    
    const users = await prisma.user.findMany();
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    let updatedCount = 0;
    for (const user of users) {
      if (user.role.toUpperCase() === 'ADMIN') {
        continue;
      }
      
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
      message: `ดำเนินการเปลี่ยนรหัสผ่านเป็น 'test123' ของผู้ใช้ที่ไม่ใช่ admin จำนวน ${updatedCount} คน เรียบร้อยแล้วครับ / Successfully updated passwords to 'test123' for ${updatedCount} non-admin users.`
    });

  } catch (error) {
    console.error('GET /api/auth/reset-passwords error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดของระบบ' },
      { status: 500 }
    );
  }
}

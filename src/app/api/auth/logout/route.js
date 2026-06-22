import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('hd_token');
    return NextResponse.json({ success: true, message: 'ออกจากระบบสำเร็จ' });
  } catch (error) {
    console.error('POST /api/auth/logout error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดของระบบ' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'last_email.html');

    if (!fs.existsSync(filePath)) {
      // Return a beautiful "No simulated email found yet" explanation page.
      const noEmailHtml = `
        <!DOCTYPE html>
        <html lang="th">
        <head>
          <meta charset="utf-8">
          <title>IT Helpdesk - Simulation Email</title>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
          <style>
            body {
              margin: 0;
              padding: 0;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              background: linear-gradient(135deg, #1e1e2d 0%, #111119 100%);
              font-family: 'Noto Sans Thai', 'Inter', sans-serif;
              color: #ffffff;
            }
            .card {
              width: 90%;
              max-width: 540px;
              background: rgba(30, 30, 45, 0.7);
              backdrop-filter: blur(16px);
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-radius: 16px;
              box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
              padding: 40px 32px;
              text-align: center;
            }
            .icon-wrapper {
              width: 64px;
              height: 64px;
              background: rgba(99, 102, 241, 0.15);
              border: 1px solid rgba(99, 102, 241, 0.3);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 24px;
              color: #6366f1;
              font-size: 28px;
            }
            h1 {
              font-size: 1.5rem;
              font-weight: 700;
              margin: 0 0 12px;
              color: #ffffff;
            }
            p {
              color: #a1a5b7;
              font-size: 0.94rem;
              line-height: 1.6;
              margin: 0 0 24px;
            }
            .steps {
              text-align: left;
              background: rgba(255, 255, 255, 0.03);
              border: 1px solid rgba(255, 255, 255, 0.05);
              border-radius: 12px;
              padding: 20px;
              margin-bottom: 24px;
            }
            .step-item {
              display: flex;
              align-items: flex-start;
              gap: 12px;
              margin-bottom: 12px;
              font-size: 0.88rem;
              color: #e2e8f0;
            }
            .step-item:last-child {
              margin-bottom: 0;
            }
            .step-num {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 20px;
              height: 20px;
              background: #6366f1;
              color: #fff;
              font-size: 0.75rem;
              font-weight: bold;
              border-radius: 50%;
              flex-shrink: 0;
              margin-top: 2px;
            }
            .btn {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
              color: #ffffff;
              text-decoration: none;
              border: none;
              border-radius: 8px;
              padding: 12px 24px;
              font-size: 0.94rem;
              font-weight: 600;
              cursor: pointer;
              transition: transform 0.2s, opacity 0.2s;
            }
            .btn:hover {
              transform: translateY(-1px);
              opacity: 0.95;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon-wrapper">
              <i class="fa-regular fa-envelope-open"></i>
            </div>
            <h1>ยังไม่มีข้อมูลอีเมลจำลอง</h1>
            <p>หน้าจอนี้จะแสดงหน้าตาของอีเมลล่าสุดที่ระบบส่งเพื่อแจ้งสถานะแก่ผู้ใช้งาน (Reporter) แต่เนื่องจากขณะนี้ยังไม่มีการกดดำเนินรายการใดๆ บนทิคเก็ตในฐานข้อมูล ทำให้อีเมลยังไม่ถูกจำลองขึ้นมาครับ</p>
            
            <div class="steps">
              <div style="font-weight: 600; font-size: 0.9rem; color: #6366f1; margin-bottom: 12px;">วิธีสร้างอีเมลจำลอง:</div>
              <div class="step-item">
                <span class="step-num">1</span>
                <span>เข้าสู่ระบบเป็นเจ้าหน้าที่ <strong>Tier 1 / Tier 2</strong> หรือ <strong>Admin</strong></span>
              </div>
              <div class="step-item">
                <span class="step-num">2</span>
                <span>เลือกทิคเก็ตที่มีในระบบ แล้วกดปุ่มดำเนินการอย่างใดอย่างหนึ่ง เช่น <strong>รับเรื่อง (Accept)</strong>, <strong>บันทึกการประเมิน (Assess)</strong>, <strong>ส่งต่อ Tier 2 (Escalate)</strong> หรือ <strong>แก้ไขปัญหาสำเร็จ (Resolve)</strong></span>
              </div>
              <div class="step-item">
                <span class="step-num">3</span>
                <span>เมื่อดำเนินการเรียบร้อยแล้ว ให้กลับมา<strong>รีเฟรชหน้าจอนี้อีกครั้ง</strong> เพื่อดูรูปเล่มและดีไซน์ของอีเมลแจ้งเตือนที่จะส่งหาลูกค้า</span>
              </div>
            </div>

            <a href="/" class="btn">
              <span>ไปที่หน้าหลักระบบ IT Helpdesk</span>
              <i class="fa-solid fa-arrow-right"></i>
            </a>
          </div>
        </body>
        </html>
      `;
      return new NextResponse(noEmailHtml, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    const htmlContent = fs.readFileSync(filePath, 'utf8');
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error serving simulated email:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

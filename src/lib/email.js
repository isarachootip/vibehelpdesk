import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Load SMTP config from environment
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || 'IT Helpdesk <helpdesk@company.com>';

export async function sendEmail({ to, subject, html }) {
  if (!to) {
    console.warn('⚠️ No recipient email address provided.');
    return false;
  }

  // 1. If SMTP is configured, send the real email
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465, // true for 465, false for other ports
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: SMTP_FROM,
        to,
        subject,
        html,
      });

      console.log(`✉️ Real Email sent successfully to ${to}. Message ID: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send real email via SMTP:', error);
      // Fall through to simulation if SMTP fails
    }
  }

  // 2. Fallback: Save HTML email to public/uploads/last_email.html so user can view it in browser
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, 'last_email.html');
    
    // Add meta info on top of simulation page
    const simulationHtml = `
      <div style="background:#4f46e5;color:white;padding:12px;font-family:sans-serif;font-size:14px;border-radius:6px;margin-bottom:20px;">
        <strong>[SIMULATION] จำลองการส่งอีเมลสำเร็จ!</strong><br>
        <strong>ถึง:</strong> ${to}<br>
        <strong>หัวข้อ:</strong> ${subject}<br>
        <strong>วันเวลา:</strong> ${new Date().toLocaleString('th-TH')}<br>
        <span style="font-size:12px;opacity:0.8;">* หากตั้งค่า SMTP ใน .env แล้ว ระบบจะเปลี่ยนไปส่งอีเมลจริงโดยอัตโนมัติ</span>
      </div>
      ${html}
    `;

    fs.writeFileSync(filePath, simulationHtml, 'utf8');
    console.log(`✉️ [EMAIL SIMULATION] Saved to public/uploads/last_email.html for recipient: ${to}`);
    return { simulated: true, path: '/uploads/last_email.html' };
  } catch (err) {
    console.error('❌ Failed to write email simulation file:', err);
    return false;
  }
}

/**
 * Generate standard HTML template for ticket updates
 */
export function getTicketEmailTemplate({ ticketNo, subject, status, updateTitle, updateDetails, reporterName }) {
  const statusColors = {
    NEW: '#3b82f6',
    IN_PROGRESS: '#f59e0b',
    ESCALATED: '#ef4444',
    RESOLVED: '#22c55e',
    CLOSED: '#6b7280'
  };

  const color = statusColors[status] || '#4f46e5';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f6f9fc; color: #333333; margin: 0; padding: 0; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f6f9fc; padding: 40px 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden; }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%); padding: 30px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
        .header p { margin: 5px 0 0; font-size: 14px; opacity: 0.8; }
        .content { padding: 30px; line-height: 1.6; }
        .greeting { font-size: 16px; font-weight: bold; margin-bottom: 20px; }
        .update-box { background-color: #f8fafc; border-left: 4px solid ${color}; padding: 20px; border-radius: 4px; margin: 20px 0; }
        .update-title { font-weight: bold; color: ${color}; margin-bottom: 10px; font-size: 15px; }
        .update-text { font-size: 14px; white-space: pre-wrap; color: #475569; }
        .details-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .details-table td { padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
        .details-table td.label { color: #64748b; width: 35%; font-weight: 500; }
        .details-table td.value { color: #1e293b; font-weight: 600; }
        .status-badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 12px; color: #ffffff; background-color: ${color}; font-weight: bold; text-transform: uppercase; }
        .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
        .footer a { color: #4f46e5; text-decoration: none; }
      </style>
    </head>
    <body>
      <table class="wrapper" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <div class="container">
              <div class="header">
                <h1>IT Helpdesk Notification</h1>
                <p>ระบบแจ้งเตือนและติดตามปัญหาฝ่ายไอที</p>
              </div>
              <div class="content">
                <div class="greeting">สวัสดีครับ คุณ ${reporterName || 'ผู้ใช้บริการ'},</div>
                <p>ขอแจ้งข้อมูลการดำเนินการสำหรับคำขอเลขที่ <strong>${ticketNo}</strong> ที่ท่านได้แจ้งเรื่องเข้ามาในระบบ:</p>
                
                <div class="update-box">
                  <div class="update-title">📍 ${updateTitle}</div>
                  <div class="update-text">${updateDetails}</div>
                </div>

                <table class="details-table">
                  <tr>
                    <td class="label">หมายเลขปัญหา:</td>
                    <td class="value">${ticketNo}</td>
                  </tr>
                  <tr>
                    <td class="label">หัวข้อปัญหา:</td>
                    <td class="value">${subject}</td>
                  </tr>
                  <tr>
                    <td class="label">สถานะปัจจุบัน:</td>
                    <td class="value"><span class="status-badge">${status}</span></td>
                  </tr>
                  <tr>
                    <td class="label">วันที่ปรับปรุง:</td>
                    <td class="value">${new Date().toLocaleString('th-TH')}</td>
                  </tr>
                </table>
                
                <p style="margin-top: 30px; font-size: 13px; color: #64748b;">ท่านสามารถติดตามความคืบหน้าหรือพูดคุยรายละเอียดเพิ่มเติมกับเจ้าหน้าที่ได้ผ่านทางช่องทางแชทแอดไลน์ หรือเข้าสู่ระบบ IT Helpdesk ของบริษัท</p>
              </div>
              <div class="footer">
                <p>อีเมลนี้เป็นการแจ้งเตือนอัตโนมัติ กรุณาอย่าตอบกลับอีเมลนี้</p>
                <p>&copy; ${new Date().getFullYear()} IT Helpdesk Support Team. All rights reserved.</p>
              </div>
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

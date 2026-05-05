# คู่มือการติดตั้งและ Deploy ระบบ Helpdesk บน Coolify

เอกสารนี้รวบรวมขั้นตอนตั้งแต่การดึงโค้ดจาก GitHub ไปจนถึงการตั้งค่าให้ระบบทำงานสมบูรณ์บน Hostinger VPS ผ่าน Coolify

---

## 1. การเชื่อมต่อ GitHub (ตั้งค่า Source)
เพื่อให้ Coolify ดึงโค้ดแบบอัตโนมัติ (Automated) ได้ ต้องสร้าง GitHub App ก่อน

1. ไปที่เมนู **Sources** > สร้าง Source ใหม่แบบ **GitHub App**
2. คลิกปุ่ม **Register Now** สีม่วงด้านขวามือ
3. ระบบจะพาไปยังหน้า GitHub ให้คุณ Login และกดอนุญาต (Authorize / Install) 
4. คุณสามารถเลือกให้เข้าถึงทุก Repository หรือเลือกเฉพาะ `isarachootip/vibehelpdesk` ก็ได้
5. เมื่อติดตั้งเสร็จ ระบบจะ Redirect กลับมาที่ Coolify เป็นอันเสร็จสิ้นการตั้งค่า Source

---

## 2. การสร้าง Project และ Application
1. ไปที่เมนู **Projects** (ด้านซ้ายมือ)
2. กด **Add** เพื่อสร้างโปรเจกต์ใหม่ (เช่น `Helpdesk Project`)
3. เลือก Environment เป็น **Production**
4. กดปุ่ม **+ New Resource** เลือกประเภท **Application**
5. เลือกการดึงข้อมูลผ่าน **Private Repository (with GitHub App)**
6. เลือก Source GitHub App ที่สร้างไว้ในข้อ 1
7. เลือก Repository: `isarachootip/vibehelpdesk`
8. เลือก Branch: `main` แล้วกด **Save**

---

## 3. การตั้งค่า Application (Configuration)
หลังจากดึง Repository มาแล้ว ระบบจะเข้าสู่หน้าตั้งค่าแอปพลิเคชัน:

### 3.1 Build Pack
* ตรวจสอบให้แน่ใจว่า **Build Pack** ถูกตั้งค่าเป็น **Docker** (หรือ Dockerfile) 
* *(โปรเจกต์นี้ใช้ `Dockerfile` แบบ Multi-stage build สำหรับ Next.js Standalone เรียบร้อยแล้ว)*

### 3.2 Environment Variables (.env)
ไปที่แท็บ **Environment Variables** และเพิ่มค่าดังนี้:
* `DATABASE_URL="postgresql://user:password@coolify-db-host:5432/helpdesk?schema=public"`
  *(ใส่ URL Database ของคุณที่สร้างไว้ใน Coolify)*
* `NODE_ENV="production"`

### 3.3 การตั้งค่า Storage (Volumes สำหรับไฟล์แนบ)
เนื่องจากระบบรองรับการอัปโหลดไฟล์/รูปภาพ หากไม่ทำ Volume ไฟล์จะหายไปเมื่อ Deploy ใหม่
1. ไปที่แท็บ **Storages** 
2. เพิ่ม Volume ใหม่:
   * **Destination (Container Path):** `/app/public/uploads`
   * *Source (Host Path): ปล่อยว่าง หรือตั้งชื่อตามต้องการ*

---

## 4. เริ่ม Deploy และ ตั้งค่า Database ขั้นสุดท้าย
1. กดปุ่ม **Deploy** สีม่วงที่มุมบนขวา เพื่อเริ่มการ Build 
2. รอประมาณ 2-5 นาที จนกว่าสถานะจะเปลี่ยนเป็น **Running** สีเขียว
3. ไปที่แท็บ **Terminal** (หรือ Execute Command) ของแอปพลิเคชัน
4. รันคำสั่งนี้เพื่อดันโครงสร้างตาราง (Schema) ไปยัง PostgreSQL:
   ```bash
   npx prisma db push
   ```
5. รันคำสั่งนี้เพื่อจำลองข้อมูล Master Data (BU, Systems, Users) ครั้งแรก:
   ```bash
   node prisma/seed.js
   ```

🎉 **เสร็จสมบูรณ์!** ระบบ Helpdesk ของคุณพร้อมใช้งานแล้ว สามารถเข้าผ่าน Domain ที่ Coolify กำหนดให้ได้เลย

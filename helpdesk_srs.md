# Software Requirements Specification (SRS)
# ระบบ Helpdesk

**Version:** 1.0  
**Date:** 2026-04-29  
**Status:** Draft  

---

## สารบัญ

1. [บทนำ (Introduction)](#1-บทนำ)
2. [ภาพรวมระบบ (System Overview)](#2-ภาพรวมระบบ)
3. [Master Data](#3-master-data)
4. [Functional Requirements](#4-functional-requirements)
5. [Workflow การแจ้งปัญหาและการแก้ไข](#5-workflow)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [User Roles และสิทธิ์การใช้งาน](#7-user-roles)
8. [Function Summary](#8-function-summary)
9. [ภาคผนวก (Appendix)](#9-ภาคผนวก)

---

## 1. บทนำ

### 1.1 วัตถุประสงค์
เอกสาร SRS นี้จัดทำขึ้นเพื่อกำหนดความต้องการของระบบ **Helpdesk** สำหรับองค์กร โดยครอบคลุมกระบวนการแจ้งปัญหาด้าน IT, การติดตามสถานะ, การส่งต่องาน (Escalation) และการปิดปัญหา พร้อมบันทึก Timestamp ทุกขั้นตอน

### 1.2 ขอบเขต (Scope)
ระบบ Helpdesk ครอบคลุม:
- การแจ้งปัญหาด้าน Hardware และ Software
- การจัดการ Ticket ผ่านทีม Tier 1 และ Tier 2
- การบันทึก Root Cause และวิธีแก้ไข
- การรายงานผลและสถิติ
- การจัดการ Master Data (BU, System, User, Location)

### 1.3 คำนิยาม (Definitions)
| คำ | ความหมาย |
|---|---|
| Ticket | ใบแจ้งปัญหาที่ผู้ใช้งานสร้างขึ้น |
| Tier 1 | ทีม Master Support ที่รับแจ้งและประเมินปัญหาเบื้องต้น |
| Tier 2 | ทีม System Support ที่รับเรื่องต่อจาก Tier 1 เพื่อแก้ไขปัญหาเชิงลึก |
| Root Cause | สาเหตุที่แท้จริงของปัญหา |
| Escalation | การส่งต่อปัญหาจาก Tier 1 ไปยัง Tier 2 |
| SLA | Service Level Agreement — ระยะเวลาที่กำหนดในการแก้ไขปัญหา |
| BU | Business Unit — หน่วยธุรกิจ |
| HQ | Head Quarter — สำนักงานใหญ่ |

### 1.4 ผู้อ่านที่เกี่ยวข้อง
- นักพัฒนาระบบ (Developer)
- ผู้จัดการโครงการ (Project Manager)
- ทีม IT Support (Tier 1, Tier 2)
- ผู้ใช้งานทั่วไป (End User)

---

## 2. ภาพรวมระบบ

### 2.1 บริบทของระบบ

```
[End User] → แจ้งปัญหา → [Helpdesk Portal]
                                 ↓
                        [Tier 1 - Master Support]
                         - รับเรื่อง
                         - ประเมินเบื้องต้น
                         - สันนิษฐานปัญหา
                                 ↓ (Escalate)
                        [Tier 2 - System Support]
                         - วิเคราะห์เชิงลึก
                         - หา Root Cause
                         - แก้ไขปัญหา
                                 ↓
                        [ปิด Ticket + แจ้ง User]
```

### 2.2 ประเภทปัญหา

| ประเภท | รายละเอียด | ตัวอย่าง |
|---|---|---|
| **Hardware** | ปัญหาเกี่ยวกับอุปกรณ์กายภาพ | คอมพิวเตอร์ไม่เปิด, Printer เสีย, Network Cable หลุด |
| **Software** | ปัญหาเกี่ยวกับโปรแกรมหรือระบบ | Application Error, Login ไม่ได้, ข้อมูลหาย |

---

## 3. Master Data

### 3.1 Business Unit (BU)

**วัตถุประสงค์:** กำหนดหน่วยธุรกิจหรือแผนกที่เกี่ยวข้องกับ Ticket

| Field | Type | Description |
|---|---|---|
| `bu_id` | INT (PK) | รหัส BU |
| `bu_code` | VARCHAR(20) | รหัสย่อ เช่น FIN, HR, IT, OPS |
| `bu_name` | VARCHAR(100) | ชื่อเต็มของ BU |
| `bu_description` | TEXT | คำอธิบาย |
| `is_active` | BOOLEAN | สถานะใช้งาน |
| `created_at` | DATETIME | วันที่สร้าง |
| `updated_at` | DATETIME | วันที่แก้ไขล่าสุด |

---

### 3.2 System (ระบบ)

**วัตถุประสงค์:** กำหนดรายการระบบหรือแอปพลิเคชันที่อาจเกิดปัญหา

| Field | Type | Description |
|---|---|---|
| `system_id` | INT (PK) | รหัสระบบ |
| `system_code` | VARCHAR(20) | รหัสย่อระบบ เช่น ERP, CRM, POS |
| `system_name` | VARCHAR(100) | ชื่อระบบ |
| `system_type` | ENUM | `hardware` / `software` |
| `vendor` | VARCHAR(100) | ผู้ผลิต/บริษัทซอฟต์แวร์ |
| `version` | VARCHAR(50) | เวอร์ชั่นปัจจุบัน |
| `owner_bu_id` | INT (FK) | BU ที่รับผิดชอบ |
| `tier2_team_id` | INT (FK) | ทีม Tier 2 ที่ดูแลระบบนี้ |
| `is_active` | BOOLEAN | สถานะใช้งาน |
| `created_at` | DATETIME | วันที่สร้าง |
| `updated_at` | DATETIME | วันที่แก้ไขล่าสุด |

---

### 3.3 User (ผู้ใช้งาน)

**วัตถุประสงค์:** บัญชีผู้ใช้งานระบบทั้งหมด รวม Admin, Tier 1, Tier 2 และ End User

| Field | Type | Description |
|---|---|---|
| `user_id` | INT (PK) | รหัสผู้ใช้ |
| `username` | VARCHAR(50) | ชื่อผู้ใช้ (Unique) |
| `email` | VARCHAR(100) | อีเมล |
| `full_name` | VARCHAR(100) | ชื่อ-นามสกุล |
| `phone` | VARCHAR(20) | เบอร์โทรศัพท์ |
| `role` | ENUM | `admin` / `tier1` / `tier2` / `end_user` |
| `bu_id` | INT (FK) | BU ที่สังกัด |
| `location_id` | INT (FK) | สถานที่ทำงาน |
| `is_active` | BOOLEAN | สถานะใช้งาน |
| `created_at` | DATETIME | วันที่สร้าง |
| `updated_at` | DATETIME | วันที่แก้ไขล่าสุด |

---

### 3.4 Location (สถานที่)

**วัตถุประสงค์:** กำหนดสถานที่ของผู้แจ้งปัญหาและอุปกรณ์ที่เกิดปัญหา

| Field | Type | Description |
|---|---|---|
| `location_id` | INT (PK) | รหัสสถานที่ |
| `location_code` | VARCHAR(20) | รหัสย่อ เช่น HQ-F1, STR-001 |
| `location_name` | VARCHAR(100) | ชื่อสถานที่ |
| `location_type` | ENUM | `hq` / `store` / `warehouse` / `other` |
| `floor` | VARCHAR(10) | ชั้น เช่น 1, 2, 3, B1 |
| `address` | TEXT | ที่อยู่เต็ม |
| `is_active` | BOOLEAN | สถานะใช้งาน |
| `created_at` | DATETIME | วันที่สร้าง |
| `updated_at` | DATETIME | วันที่แก้ไขล่าสุด |

**ตัวอย่าง Location:**

| location_code | location_name | type | floor |
|---|---|---|---|
| HQ-F1 | Head Quarter ชั้น 1 | hq | 1 |
| HQ-F2 | Head Quarter ชั้น 2 | hq | 2 |
| HQ-F3 | Head Quarter ชั้น 3 | hq | 3 |
| STR-001 | สาขา 001 | store | - |
| STR-002 | สาขา 002 | store | - |

---

## 4. Functional Requirements

### 4.1 FR-01: การแจ้งปัญหา (Create Ticket)

**Actor:** End User  
**Description:** ผู้ใช้งานสามารถแจ้งปัญหาผ่านระบบได้ตลอดเวลา

**Input Fields:**
| Field | Required | Description |
|---|---|---|
| `subject` | ✅ | หัวข้อปัญหาสั้นๆ |
| `problem_type` | ✅ | ประเภท: Hardware / Software |
| `system_id` | ✅ | ระบบที่มีปัญหา |
| `location_id` | ✅ | สถานที่เกิดปัญหา |
| `description` | ✅ | รายละเอียดปัญหา |
| `symptom` | ✅ | อาการที่พบ |
| `attachment` | ❌ | ไฟล์แนบ (ภาพหน้าจอ, log) |
| `priority` | ✅ | ความเร่งด่วน: Low / Medium / High / Critical |

**Output:** Ticket ถูกสร้างพร้อม Ticket Number และ Timestamp

---

### 4.2 FR-02: การรับปัญหาและประเมินเบื้องต้น (Tier 1 - Initial Assessment)

**Actor:** Tier 1 (Master Support)  
**Description:** ทีม Tier 1 รับ Ticket, ประเมินปัญหาและสันนิษฐานสาเหตุเบื้องต้น

**Actions:**
- รับ Ticket และเปลี่ยนสถานะเป็น **In Progress**
- บันทึก **Initial Assessment** (ความเห็นเบื้องต้น)
- บันทึก **Preliminary Cause** (สันนิษฐานสาเหตุ)
- ตัดสินใจ: แก้ไขได้เองหรือต้อง Escalate ไป Tier 2

**Fields ที่กรอก:**
| Field | Description |
|---|---|
| `initial_assessment` | ความเห็นเบื้องต้นของ Tier 1 |
| `preliminary_cause` | การสันนิษฐานสาเหตุ |
| `tier1_action` | การดำเนินการของ Tier 1 |
| `is_escalate` | ส่งต่อ Tier 2 หรือไม่ |
| `escalate_reason` | เหตุผลที่ส่งต่อ (ถ้า Escalate) |

---

### 4.3 FR-03: การส่งต่อปัญหา (Escalation to Tier 2)

**Actor:** Tier 1  
**Description:** Tier 1 ส่งต่อ Ticket ไปยังทีม Tier 2 ที่เหมาะสม

**Rules:**
- Ticket ต้องถูก Assign ไปยัง Tier 2 Team ที่รับผิดชอบระบบนั้น
- Tier 2 ต้องรับ Ticket ภายในเวลาที่กำหนดตาม SLA
- บันทึก Timestamp ทันทีที่ Escalate

---

### 4.4 FR-04: การวิเคราะห์และแก้ไข (Tier 2 - Root Cause & Resolution)

**Actor:** Tier 2 (System Support)  
**Description:** ทีม Tier 2 วิเคราะห์หา Root Cause และแก้ไขปัญหา

**Fields ที่กรอก:**
| Field | Description |
|---|---|
| `root_cause` | สาเหตุที่แท้จริง |
| `root_cause_category` | หมวดหมู่ Root Cause |
| `resolution` | วิธีแก้ไขที่ใช้ |
| `resolution_detail` | รายละเอียดการแก้ไข |
| `preventive_action` | แนวทางป้องกันในอนาคต |
| `resolved_at` | Timestamp ที่แก้ไขเสร็จ |

**Root Cause Categories:**
- Hardware Failure
- Software Bug
- Configuration Error
- Network Issue
- Human Error
- Security Incident
- Vendor Issue
- Other

---

### 4.5 FR-05: การปิด Ticket (Close Ticket)

**Actor:** Tier 1 / End User  
**Description:** ตรวจสอบและปิด Ticket หลังจากแก้ไขเสร็จ

**Process:**
1. Tier 2 เปลี่ยนสถานะเป็น **Resolved** พร้อมแนบผลการแก้ไข
2. ระบบแจ้ง End User ให้ยืนยัน
3. End User ยืนยันว่าปัญหาได้รับการแก้ไข → สถานะเป็น **Closed**
4. หาก End User ไม่ตอบภายในเวลาที่กำหนด → ปิดอัตโนมัติ

**Fields:**
| Field | Description |
|---|---|
| `user_satisfaction` | คะแนนความพึงพอใจ 1-5 |
| `user_comment` | ความคิดเห็นเพิ่มเติม |
| `closed_at` | Timestamp ที่ปิด Ticket |

---

### 4.6 FR-06: การแจ้งเตือน (Notification)

**Actor:** System  
**Description:** ระบบส่งการแจ้งเตือนอัตโนมัติในทุกขั้นตอน

| เหตุการณ์ | ผู้รับแจ้ง | ช่องทาง |
|---|---|---|
| สร้าง Ticket ใหม่ | End User, Tier 1 | Email, In-App |
| Tier 1 รับเรื่อง | End User | Email, In-App |
| Escalate ไป Tier 2 | End User, Tier 2 | Email, In-App |
| แก้ไขเสร็จ (Resolved) | End User | Email, In-App |
| ปิด Ticket (Closed) | End User | Email |
| Ticket ใกล้ SLA Breach | Tier 1, Tier 2, Manager | Email, In-App |
| SLA Breach | Manager | Email, Line/Teams |

---

### 4.7 FR-07: การค้นหาและติดตาม (Search & Tracking)

**Actor:** All Users  
**Description:** ผู้ใช้งานสามารถค้นหาและติดตาม Ticket ได้

**Search Filters:**
- Ticket Number
- สถานะ (Status)
- ประเภทปัญหา (Hardware/Software)
- ระบบ (System)
- BU / Location
- ช่วงวันที่
- Assignee (Tier 1 / Tier 2)
- Priority

---

### 4.8 FR-08: Dashboard และรายงาน (Dashboard & Reports)

**Actor:** Admin, Manager  
**Description:** แสดงสถิติและออกรายงาน

**Dashboard:**
- จำนวน Ticket แยกตามสถานะ
- Ticket เกิน SLA
- Top 5 ปัญหาที่พบบ่อย
- ประสิทธิภาพของ Tier 1 / Tier 2
- คะแนนความพึงพอใจผู้ใช้

**Reports:**
- รายงาน Ticket รายวัน/รายสัปดาห์/รายเดือน
- รายงาน SLA Compliance
- รายงาน Root Cause Analysis
- รายงานตาม BU / Location / System

---

## 5. Workflow

### 5.1 Ticket Lifecycle

```
[สถานะ]
NEW → IN_PROGRESS (Tier1) → ESCALATED → IN_PROGRESS (Tier2) → RESOLVED → CLOSED
                    ↓                                              ↑
              [แก้ไขได้เอง] ──────────────────────────────────────┘
                    
[Reopen Path]
CLOSED → REOPENED → IN_PROGRESS (Tier1)

[Cancel Path]
NEW / IN_PROGRESS → CANCELLED (โดย Admin หรือ User)
```

### 5.2 สถานะ Ticket (Ticket Status)

| Status | คำอธิบาย |
|---|---|
| `NEW` | Ticket ถูกสร้าง รอ Tier 1 รับ |
| `IN_PROGRESS` | กำลังดำเนินการ |
| `ESCALATED` | ส่งต่อ Tier 2 แล้ว |
| `PENDING_USER` | รอผู้ใช้ยืนยัน/ให้ข้อมูลเพิ่มเติม |
| `RESOLVED` | แก้ไขแล้ว รอผู้ใช้ยืนยัน |
| `CLOSED` | ปิดสมบูรณ์ |
| `REOPENED` | เปิดใหม่ (ปัญหายังไม่ได้รับการแก้ไข) |
| `CANCELLED` | ยกเลิก |

### 5.3 Timestamp บันทึกทุกขั้นตอน

| Event | Timestamp Field | คำอธิบาย |
|---|---|---|
| สร้าง Ticket | `created_at` | เวลาที่ End User กด Submit |
| Tier 1 รับเรื่อง | `tier1_accepted_at` | เวลาที่ Tier 1 กดรับ |
| ประเมินเบื้องต้นเสร็จ | `tier1_assessed_at` | เวลาที่ Tier 1 บันทึก Assessment |
| Escalate | `escalated_at` | เวลาที่ส่งต่อ Tier 2 |
| Tier 2 รับเรื่อง | `tier2_accepted_at` | เวลาที่ Tier 2 กดรับ |
| เริ่มแก้ไข | `repair_started_at` | เวลาเริ่มลงมือแก้ไข |
| แก้ไขเสร็จ | `resolved_at` | เวลาที่แก้ไขเสร็จ |
| ผู้ใช้ยืนยัน | `user_confirmed_at` | เวลาที่ End User ยืนยัน |
| ปิด Ticket | `closed_at` | เวลาที่ปิด Ticket |
| Reopen | `reopened_at` | เวลาที่เปิดใหม่ (ถ้ามี) |

---

## 6. Non-Functional Requirements

### 6.1 ประสิทธิภาพ (Performance)
- ระบบต้องรองรับผู้ใช้งานพร้อมกันได้ไม่น้อยกว่า 200 คน
- Response Time ไม่เกิน 3 วินาทีต่อการ Load หน้า
- API Response ไม่เกิน 1 วินาที

### 6.2 ความพร้อมใช้งาน (Availability)
- Uptime ไม่น้อยกว่า 99.5% ต่อเดือน
- Maintenance Window: วันอาทิตย์ 00:00–04:00 น.

### 6.3 ความปลอดภัย (Security)
- Authentication ด้วย Username/Password + 2FA (สำหรับ Admin)
- Role-Based Access Control (RBAC)
- บันทึก Audit Log ทุก Action
- ข้อมูลส่วนตัวต้องเข้ารหัส (Encrypt at Rest & in Transit)
- Session Timeout หลังไม่ใช้งาน 30 นาที

### 6.4 SLA (Service Level Agreement)

| Priority | Response Time (Tier 1) | Resolution Time (Tier 2) | คำอธิบาย |
|---|---|---|---|
| **Critical** | 15 นาที | 4 ชั่วโมง | ระบบหลักล่ม ส่งผลกระทบทั้งองค์กร |
| **High** | 1 ชั่วโมง | 8 ชั่วโมง | ส่งผลกระทบต่อกลุ่มผู้ใช้จำนวนมาก |
| **Medium** | 4 ชั่วโมง | 2 วันทำการ | ส่งผลกระทบต่อผู้ใช้บางส่วน |
| **Low** | 1 วันทำการ | 5 วันทำการ | ปัญหาทั่วไปที่ยังทำงานได้ |

### 6.5 การสำรองข้อมูล (Backup)
- สำรองข้อมูลทุกวัน (Daily Backup)
- เก็บ Backup 90 วัน
- ทดสอบ Restore ทุกเดือน

---

## 7. User Roles

### 7.1 End User
- สร้าง Ticket
- ติดตามสถานะ Ticket ของตัวเอง
- ยืนยันการแก้ไข / Reopen Ticket
- ให้คะแนนความพึงพอใจ

### 7.2 Tier 1 (Master Support)
- รับ Ticket ใหม่
- บันทึก Initial Assessment และ Preliminary Cause
- Assign Ticket ให้ตัวเองหรือ Tier 2
- แก้ไขปัญหาง่ายๆ ด้วยตัวเอง
- Escalate Ticket ไปยัง Tier 2
- ดู Dashboard ของทีม

### 7.3 Tier 2 (System Support)
- รับ Ticket จาก Tier 1
- บันทึก Root Cause และ Resolution
- บันทึก Preventive Action
- ปิด Ticket (Resolved)
- ดู Dashboard ของทีม

### 7.4 Admin / Manager
- จัดการ Master Data ทั้งหมด (BU, System, User, Location)
- ดู Dashboard และออกรายงาน
- ตั้งค่า SLA
- จัดการสิทธิ์ผู้ใช้
- ดู Audit Log

---

## 8. Function Summary

### 8.1 Ticket Management Functions

| Function | Description | Actor |
|---|---|---|
| `createTicket()` | สร้าง Ticket ใหม่พร้อม Timestamp | End User |
| `getTicket(id)` | ดูรายละเอียด Ticket | All |
| `listTickets(filters)` | ค้นหา/กรอง Ticket | All |
| `updateTicketStatus(id, status)` | เปลี่ยนสถานะ Ticket | Tier1, Tier2, Admin |
| `assignTicket(id, userId)` | มอบหมาย Ticket | Tier1, Admin |
| `cancelTicket(id, reason)` | ยกเลิก Ticket | User, Admin |
| `reopenTicket(id, reason)` | เปิด Ticket ใหม่ | End User |

### 8.2 Tier 1 Assessment Functions

| Function | Description | Actor |
|---|---|---|
| `acceptTicket(id)` | รับ Ticket พร้อมบันทึก `tier1_accepted_at` | Tier 1 |
| `saveInitialAssessment(id, data)` | บันทึกความเห็นเบื้องต้นและสันนิษฐานสาเหตุ | Tier 1 |
| `escalateToTier2(id, teamId, reason)` | ส่งต่อ Tier 2 พร้อมบันทึก `escalated_at` | Tier 1 |
| `resolveByTier1(id, resolution)` | ปิดปัญหาโดย Tier 1 (ไม่ต้อง Escalate) | Tier 1 |

### 8.3 Tier 2 Resolution Functions

| Function | Description | Actor |
|---|---|---|
| `acceptEscalation(id)` | รับ Ticket จาก Tier 1 พร้อม `tier2_accepted_at` | Tier 2 |
| `startRepair(id)` | เริ่มแก้ไขพร้อมบันทึก `repair_started_at` | Tier 2 |
| `saveRootCause(id, data)` | บันทึก Root Cause และหมวดหมู่ | Tier 2 |
| `resolveTicket(id, resolution, preventive)` | แก้ไขเสร็จ พร้อม `resolved_at` | Tier 2 |

### 8.4 Closure Functions

| Function | Description | Actor |
|---|---|---|
| `confirmResolution(id, satisfaction, comment)` | ผู้ใช้ยืนยันการแก้ไข | End User |
| `closeTicket(id)` | ปิด Ticket พร้อม `closed_at` | System, Admin |
| `autoCloseExpiredTickets()` | ปิดอัตโนมัติหาก User ไม่ตอบภายในเวลา | System (Cron) |

### 8.5 Notification Functions

| Function | Description |
|---|---|
| `sendNotification(userId, event, ticketId)` | ส่งแจ้งเตือนตาม Event |
| `sendSLAWarning(ticketId)` | แจ้งเตือนเมื่อใกล้ SLA Breach |
| `sendSLABreach(ticketId)` | แจ้งเตือนเมื่อ SLA Breach |

### 8.6 Master Data Management Functions

| Function | Description | Actor |
|---|---|---|
| `createBU(data)` | สร้าง BU ใหม่ | Admin |
| `updateBU(id, data)` | แก้ไข BU | Admin |
| `createSystem(data)` | สร้าง System ใหม่ | Admin |
| `updateSystem(id, data)` | แก้ไข System | Admin |
| `createUser(data)` | สร้าง User ใหม่ | Admin |
| `updateUser(id, data)` | แก้ไข User | Admin |
| `createLocation(data)` | สร้าง Location ใหม่ | Admin |
| `updateLocation(id, data)` | แก้ไข Location | Admin |
| `setActive(entity, id, status)` | เปิด/ปิดใช้งาน Master Data | Admin |

### 8.7 Reporting Functions

| Function | Description | Actor |
|---|---|---|
| `getDashboardSummary(filters)` | ข้อมูล Dashboard สรุป | Manager, Admin |
| `getTicketReport(dateRange, filters)` | รายงาน Ticket | Manager, Admin |
| `getSLAReport(dateRange)` | รายงาน SLA Compliance | Manager, Admin |
| `getRootCauseReport(dateRange)` | รายงาน Root Cause Analysis | Manager, Admin |
| `getSatisfactionReport(dateRange)` | รายงานคะแนนความพึงพอใจ | Manager, Admin |
| `exportReport(type, format)` | Export รายงานเป็น PDF/Excel | Manager, Admin |

---

## 9. ภาคผนวก

### 9.1 Ticket Number Format
```
HD-{YYYY}{MM}-{NNNNN}
ตัวอย่าง: HD-202604-00001
```

### 9.2 ตัวอย่าง Database Schema (ERD Summary)

```
tickets
├── ticket_id (PK)
├── ticket_no (Unique)
├── subject
├── problem_type (hardware/software)
├── system_id (FK → systems)
├── location_id (FK → locations)
├── reporter_id (FK → users)
├── tier1_id (FK → users)
├── tier2_id (FK → users)
├── status
├── priority
├── description
├── symptom
├── initial_assessment
├── preliminary_cause
├── escalate_reason
├── root_cause
├── root_cause_category
├── resolution
├── resolution_detail
├── preventive_action
├── user_satisfaction
├── user_comment
├── created_at ← Timestamp
├── tier1_accepted_at ← Timestamp
├── tier1_assessed_at ← Timestamp
├── escalated_at ← Timestamp
├── tier2_accepted_at ← Timestamp
├── repair_started_at ← Timestamp
├── resolved_at ← Timestamp
├── user_confirmed_at ← Timestamp
├── closed_at ← Timestamp
└── reopened_at ← Timestamp
```

### 9.3 Technology Stack (แนะนำ)

| Layer | Technology |
|---|---|
| Frontend | React.js / Next.js |
| Backend | Node.js (Express) หรือ Python (FastAPI) |
| Database | PostgreSQL / MySQL |
| Auth | JWT + OAuth2 |
| Notification | Email (SMTP), Line Notify / MS Teams |
| Deployment | Docker + Kubernetes หรือ Cloud (AWS/Azure/GCP) |

### 9.4 การพัฒนาในอนาคต (Future Enhancements)
- Mobile Application (iOS / Android)
- AI-powered Auto-classification ของปัญหา
- Integration กับ Active Directory / LDAP
- Knowledge Base สำหรับ Self-Service
- Chat Bot สำหรับแจ้งปัญหา
- Asset Management Integration

---

**เอกสารจัดทำโดย:** ทีมพัฒนาระบบ  
**วันที่จัดทำ:** 2026-04-29  
**เวอร์ชั่น:** 1.0 Draft  

---
*สงวนลิขสิทธิ์ — ใช้เพื่อการพัฒนาระบบ Helpdesk ภายในองค์กรเท่านั้น*

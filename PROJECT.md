# PROJECT.md - NailReal Shop 💅

## 📋 ข้อมูลโปรเจค
- **ชื่อ**: NailReal Shop
- **ประเภท**: ระบบจัดการภายในร้านทำเล็บ (Internal Management System)
- **ที่อยู่**: `/Users/v2ruz/Desktop/AI_Project/NailReal_Shop`
- **วันที่สร้าง**: 2026-04-02
- **เวอร์ชั่น**: 1.0.0
- **พอร์ต**: 3000 (ตลอดการใช้งาน)

## 🎯 วัตถุประสงค์
สร้างระบบจัดการภายในร้านทำเล็บสำหรับร้านในประเทศไทย โดยใช้เทคโนโลยีที่ทันสมัยแต่ง่ายต่อการดูแล

## 🎨 Design References
- **Primary**: www.apple.com (minimalist, clean, elegant)
- **Secondary**: www.nailfashion.com (nail salon aesthetic)
- **Style**: Modern, minimal, elegant, professional
- **Color Palette**: 
  - Primary: #bf5af2 (Purple - nail polish)
  - Gradient: #ff6b9d → #bf5af2 → #5e5ce6

## 🔧 กฎการพัฒนา (Development Rules)

### ⚠️ สำคัญมาก: Run Tests หลังแก้ไข Code
**ทุกครั้งที่เขียน/แก้ไข code เสร็จ ต้อง run tests อีกรอบนึงเสมอ:**
1. ✅ Run test suite: `node test_all.js`
2. ✅ ตรวจสอบว่า tests ทั้งหมดผ่าน
3. ✅ ถ้ามี test ล้มเหลว → แก้ไข → run test อีกครั้ง
4. ✅ ยืนยันกับ user ว่า tests ผ่านทั้งหมด

### ⚠️ สำคัญมาก: Verify หลังเขียน Code
**ทุกครั้งที่เขียน/แก้ไข code เสร็จ ต้อง verify อีกรอบนึงเสมอ:**
1. ✅ Run server: `node server.js` หรือ restart server
2. ✅ ทดสอบ API endpoints (curl หรือ browser)
3. ✅ เปิดหน้าเว็บทดสอบ functionality
4. ✅ ตรวจสอบ console ไม่มี error

**ไม่มีข้อยกเว้น - ทุกการเปลี่ยนแปลงต้อง verify และ run tests ก่อนบอก user ว่าเสร็จ!**

## 🛠️ Tech Stack

### Frontend (ภาษาไทย)
- **HTML5** - โครงสร้างหน้าเว็บ
- **CSS3** - การออกแบบ (apple.com style)
- **JavaScript (Vanilla)** - Interactive features

### Backend (English)
- **Node.js** - Runtime environment
- **Express** - Web framework
- **JSON files** - Database (เก็บใน `/data` folder)

### Deployment (English)
- **PM2** - Process manager
- **Docker** - Containerization
- **Nginx** - Reverse proxy
- **Let's Encrypt** - SSL certificate

## 📁 โครงสร้างโฟลเดอร์

```
NailReal_Shop/
├── server.js          - เซิร์ฟเวอร์หลัก (EN)
├── db.js              - ระบบฐานข้อมูล JSON (EN)
├── package.json       - Dependencies (EN)
├── PROJECT.md         - เอกสารนี้ (TH)
├── README.md          - User guide (EN)
├── deployment.md      - Deployment guide (EN)
├── .env.example       - Environment template (EN)
├── .env.production    - Production config (EN)
├── data/              - ฐานข้อมูล (TH)
│   ├── services.json     - บริการ
│   ├── customers.json    - ลูกค้า
│   └── appointments.json - การนัดหมาย
├── public/            - Frontend (TH)
│   ├── index.html        - หน้าหลัก
│   ├── services.html     - หน้าบริการทั้งหมด
│   ├── service-detail.html - หน้ารายละเอียดบริการ (มี edit mode)
│   ├── style.css         - CSS (apple.com style)
│   ├── app.js            - JavaScript
│   └── images/           - รูปภาพ
│       └── services/     - รูปบริการ (ตั้งชื่อตาม ID: 1.jpg, 2.png, etc.)
└── logs/              - ล็อก (auto-created)
```

## 📝 Features (สถานะ)

### ✅ เสร็จแล้ว
- [x] ระบบบริการ (Services)
- [x] Dashboard frontend (ภาษาไทย)
- [x] ระบบจัดการฐานข้อมูล JSON
- [x] หน้าบริการทั้งหมด (services.html)
- [x] หน้ารายละเอียดบริการ (service-detail.html)
- [x] หน้าสร้างภาพ AI (image-generate.html)
- [x] Image slot system (ID-based)
- [x] Edit mode + Save to database
- [x] Upload image functionality
- [x] API endpoints (GET/POST/PUT)
- [x] **ระบบจัดการช่าง (Technician Management)** ⭐ NEW
  - เพิ่ม/ลบช่าง
  - ดูประวัติช่าง
  - ลบช่างพร้อมยืนยัน
- [x] **ระบบจับเวลาทำงาน (Time Tracking)** ⭐ NEW
  - Start/Stop timer
  - บันทึกเวลาอัตโนมัติ
  - ประวัติล่าสุด (10 รายการ)
- [x] **ระบบนัดหมาย (Appointments)** ⭐ NEW
  - หน้ารายการนัดหมาย (appointments.html)
  - หน้ารายละเอียดนัดหมาย (appointment_detail.html)
  - แสดงเฉพาะคิวว่าง (exclude in-progress)
- [x] **Admin Panel** ⭐ UPDATED
  - ประวัติล่าสุดอัตโนมัติ
  - จัดการช่าง + ลบพร้อมยืนยัน
  - Enriched data (customer names)
- [x] Deployment-ready (PM2 + Docker)
- [x] Documentation (TH + EN)

### 🟡 กำลังทำ
- [ ] ระบบลูกค้า (Customers UI)
- [ ] ระบบจองคิว (Appointments UI)

### ⚪ แผนอนาคต
- [ ] ระบบการเงิน (Transactions)
- [ ] รายงาน (Reports)
- [ ] ระบบสมาชิก (Authentication)
- [ ] Line Notify integration
- [ ] Export data (Excel/PDF)

## 🌐 การใช้งาน

### การเข้าถึงเว็บไซต์
- **จากเครื่องนี้**: http://localhost:3000
- **จากเครื่องอื่นใน LAN**: http://192.168.1.82:3000

### สำหรับพนักงานร้าน
1. เปิดเว็บ: http://192.168.1.82:3000 (หรือ localhost ถ้าอยู่ที่เครื่องเดียวกัน)
2. ดู Dashboard สถานะ
3. จัดการการนัดหมาย
4. ดูประวัติลูกค้า

### สำหรับผู้ดูแลระบบ
```bash
# เริ่มระบบ
npm start

# ดูสถานะ
pm2 status

# ดู logs
npm run pm2:logs

# Backup
tar -czf backup_$(date +%Y%m%d).tar.gz data/
```

## ⚠️ ข้อควรระวัง

1. **ข้อมูลสำคัญ**: `/data` folder เก็บข้อมูลทั้งหมด - **ต้อง backup สม่ำเสมอ!**
2. **Security**: เปลี่ยน default PORT และใช้ HTTPS ใน production
3. **Backup**: ตั้งค่า cron job สำหรับ auto backup
4. **Monitoring**: ใช้ PM2 monitoring ตรวจสอบระบบ

## 📞 การติดต่อ

**หากมีปัญหา:**
1. ดู logs: `npm run pm2:logs`
2. Restart: `npm run pm2:restart`
3. ตรวจสอบฐานข้อมูล: `ls -la data/`
4. ติดต่อผู้พัฒนา

## 📅 Last Updated
- **2026-04-08 14:46**: เพิ่มระบบนัดหมาย + รายละเอียด, แก้ไขการโหลดข้อมูลซ้ำ, เพิ่ม API endpoints ใหม่
- **2026-04-07 14:39**: เพิ่มกฎการพัฒนา - Run tests หลังแก้ไข code ทุกครั้ง
- **2026-04-03 10:48**: เพิ่มกฎการพัฒนา - Verify หลังเขียน code เสร็จทุกครั้ง

---

**สร้างด้วย 💅 สำหรับร้านทำเล็บในประเทศไทย**

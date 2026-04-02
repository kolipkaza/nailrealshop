# PROJECT.md - NailReal Shop 💅

## 📋 ข้อมูลโปรเจค
- **ชื่อ**: NailReal Shop
- **ประเภท**: ระบบจัดการภายในร้านทำเล็บ (Internal Management System)
- **ที่อยู่**: `/Users/v2ruz/Desktop/AI_Project/NailReal_Shop`
- **วันที่สร้าง**: 2026-04-02
- **เวอร์ชั่น**: 1.0.0

## 🎯 วัตถุประสงค์
สร้างระบบจัดการภายในร้านทำเล็บสำหรับร้านในประเทศไทย โดยใช้เทคโนโลยีที่ทันสมัยแต่ง่ายต่อการดูแล

## 🎨 Design References
- **Primary**: www.apple.com (minimalist, clean, elegant)
- **Secondary**: www.nailfashion.com (nail salon aesthetic)
- **Style**: Modern, minimal, elegant, professional
- **Color Palette**: 
  - Primary: #bf5af2 (Purple - nail polish)
  - Gradient: #ff6b9d → #bf5af2 → #5e5ce6

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
│   ├── style.css         - CSS (apple.com style)
│   └── app.js            - JavaScript
└── logs/              - ล็อก (auto-created)
```

## 📝 Features (สถานะ)

### ✅ เสร็จแล้ว
- [x] ระบบบริการ (Services)
- [x] Dashboard frontend (ภาษาไทย)
- [x] ระบบจัดการฐานข้อมูล JSON
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

### สำหรับพนักงานร้าน
1. เปิดเว็บ: http://localhost:3000
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
- **2026-04-02 17:40**: อัพเดท structure - Frontend เป็นไทย, Backend/Docs เป็น English

---

**สร้างด้วย 💅 สำหรับร้านทำเล็บในประเทศไทย**

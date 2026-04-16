# NailReal Shop — Functional Test Cases for QA Tester

**Server URL:** http://localhost:3000
**Test Date:** 2026-04-16

## Known Issues (don't report these, already known)
- `image-generate.html` returns 404 (file doesn't exist, not in scope)
- `GET /api/services/:id` with ID "1" returns 404 (IDs are timestamps, not sequential)
- `PUT /api/customers/:id` with ID "CUST001" returns 404 (same reason)

---

## 1. Dashboard (index.html)
- [ ] หน้าโหลดได้ ไม่มี console error
- [ ] Stat cards แสดงตัวเลขถูกต้อง: นัดหมายวันนี้, กำลังให้บริการ, ลูกค้าทั้งหมด, บริการทั้งหมด, ช่างทั้งหมด, รายรับวันนี้
- [ ] นัดหมายล่าสุด แสดงรายการ หรือ "ไม่มีนัดหมายวันนี้"
- [ ] ประวัติล่าสุด แสดงรายการ หรือ "ยังไม่มีข้อมูล"
- [ ] Sidebar toggle พับ/กางได้ จำ state ได้ (refresh แล้วยังอยู่)
- [ ] Clock แสดงเวลาไทย เดินจริง
- [ ] คลิกแต่ละเมนู sidebar ไปหน้าถูกต้อง

## 2. Services (services.html)
- [ ] แสดงรายการบริการทั้งหมด
- [ ] เพิ่มบริการใหม่ได้ (ชื่อ, ราคา, ระยะเวลา, หมวดหมู่, รายละเอียด)
- [ ] แก้ไขบริการได้ ข้อมูลอัปเดต
- [ ] ลบบริการได้ หายจาก list
- [ ] อัปโหลดรูปบริการได้ รูปแสดงใน card
- [ ] คลิกเข้า service-detail.html ได้ แสดงข้อมูลถูกต้อง
- [ ] Validation: ไม่ใส่ชื่อหรือราคา ต้องแจ้ง error

## 3. Customers (customers.html)
- [ ] แสดงรายการลูกค้าทั้งหมดในตาราง
- [ ] เพิ่มลูกค้าใหม่ได้ (ชื่อ, เบอร์, email)
- [ ] แก้ไขลูกค้าได้ ข้อมูลอัปเดต
- [ ] ลบลูกค้าได้ หายจากตาราง
- [ ] Search ทำงาน: พิมพ์ชื่อ/เบอร์/email filter ได้จริง
- [ ] Validation: ไม่ใส่ชื่อหรือเบอร์ ต้องแจ้ง error
- [ ] Modal เปิด/ปิดได้ คลิก backdrop ปิดได้

## 4. Appointments (appointments.html)
- [ ] แสดงรายการนัดหมายทั้งหมด
- [ ] สร้างนัดหมายใหม่ได้: เลือกบริการจาก dropdown, ใส่ชื่อ+เบอร์ลูกค้า, เลือกวัน+เวลา
- [ ] นัดหมายใหม่ status = "รอยืนยัน"
- [ ] เปลี่ยน status ได้: รอยืนยัน → ยืนยัน → กำลังทำ → เสร็จ
- [ ] ยกเลิกนัดหมายได้
- [ ] Filter buttons ทำงาน: ทั้งหมด, รอยืนยัน, กำลังทำ, เสร็จแล้ว
- [ ] คลิกการ์ดนัดหมาย เข้า appointment_detail.html ได้
- [ ] Auto-ID สร้างเป็น APP001, APP002... ถูกต้อง

## 5. Employee Dashboard (employee_dashboard.html)
- [ ] แสดง dropdown เลือกนัดหมายที่ available
- [ ] เลือกช่างได้
- [ ] เริ่มจับเวลา (Start Timer) ได้ → เวลาวิ่งจริง
- [ ] หยุดจับเวลา (Stop Timer) ได้ → แสดงระยะเวลา
- [ ] ปิดงาน (Close Job) → appointment status เปลี่ยนเป็น completed
- [ ] Auto-refresh dropdown ทุก 30 วินาที

## 6. Technician History (technician_history.html)
- [ ] แสดงประวัติงานของช่างที่เลือก
- [ ] เลือกช่างจาก dropdown ได้
- [ ] แสดงชื่อบริการ, ชื่อลูกค้า, เวลาที่ใช้

## 7. Transactions (transactions.html) — NEW
- [ ] แสดงรายการธุรกรรมทั้งหมด
- [ ] สร้างธุรกรรมใหม่ได้: เลือกนัดหมาย/ลูกค้า, เพิ่มรายการบริการ, คำนวณราคาอัตโนมัติ
- [ ] เลือกวิธีชำระเงิน: เงินสด/โอน/บัตรเครดิต
- [ ] ใส่ส่วนลดได้ ยอดรวมคำนวณถูกต้อง
- [ ] แก้ไขธุรกรรมได้
- [ ] เปลี่ยนสถานะการชำระ: pending → paid, refunded
- [ ] ลบธุรกรรมได้
- [ ] Filter ตามวันที่ และ status
- [ ] Search ทำงาน

## 8. Reports (reports.html) — NEW
- [ ] Tab วันนี้: แสดงสรุปจำนวนนัด, รายรับ, รายการบริการ
- [ ] Tab รายเดือน: เลือกเดือนได้ แสดงสรุป
- [ ] Tab บริการยอดนิยม: แสดง ranking พร้อม bar chart
- [ ] Tab ลูกค้ายอดนิยม: แสดง ranking
- [ ] Tab ช่าง: แสดงจำนวนงาน, เวลารวม
- [ ] ปุ่ม Export (placeholder — อาจยังไม่ทำงานจริง)

## 9. Admin Panel (admin_panel.html)
- [ ] แสดงรายการช่าง/พนักงาน
- [ ] เพิ่มช่างใหม่ได้
- [ ] ลบช่างได้
- [ ] แสดงข้อมูลระบบ

## 10. Login (login.html) — PLACEHOLDER
- [ ] หน้าโหลดได้ มีฟอร์ม username/password
- [ ] Submit แสดงข้อความ "coming soon" หรือ placeholder
- [ ] UI สวยงาม ตาม theme

## 11. Cross-page Tests
- [ ] Sidebar แสดงเมนูครบทุกหน้า: Dashboard, นัดหมาย, ลูกค้า, บริการ, พนักงาน, การเงิน, รายงาน, Admin
- [ ] Active state ของ sidebar ถูกต้องทุกหน้า
- [ ] Responsive: sidebar collapse แล้ว content ปรับตาม
- [ ] Consistent theme: สี, font, spacing เหมือนกันทุกหน้า

## 12. API Response Validation
- [ ] GET /api แสดง endpoint list ครบ
- [ ] GET /api/transactions/summary คืน totalRevenue, count, byMethod
- [ ] GET /api/reports/daily?date=YYYY-MM-DD คืนข้อมูลถูกต้อง
- [ ] GET /api/reports/monthly?month=YYYY-MM คืนข้อมูลถูกต้อง
- [ ] GET /api/reports/services คืน ranking
- [ ] GET /api/reports/customers คืน ranking
- [ ] GET /api/reports/technicians คืน performance

---

## Report Format
For each test case, report:
- **Status:** ✅ Pass / ❌ Fail / ⚠️ Partial
- **Details:** What happened vs what was expected
- **Steps to reproduce:** If failed
- **Screenshot/Console errors:** If applicable

Create report as `QA_REPORT.md` in the project root.

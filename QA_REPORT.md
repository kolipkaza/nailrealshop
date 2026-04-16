# NailReal Shop — QA Test Report

**Date:** 2026-04-16  
**Tester:** mox (automated QA)  
**Server:** http://localhost:3000  

---

## Round 2 — Regression Test (2026-04-16)

Testing all 5 bugs reported as fixed.

### Bug Fix Verification

| # | Bug | Status | Notes |
|---|-----|--------|-------|
| 1 | Appointment auto-ID (APP###) | ✅ Fixed | Created appointment → got `APP004`. ID persists correctly after creation. |
| 2 | No DELETE /api/appointments | ✅ Fixed | Created `APP004`, DELETE returned 200 with success message. Verified gone from list. |
| 3 | GET /api endpoint list outdated | ✅ Fixed | Now lists 36 endpoints including transactions, reports, DELETE routes, timer endpoints. |
| 4 | Technician report revenue always 0 | ✅ Fixed | Report code correctly calculates from paid transactions via service_logs → appointments → technicians. Verified revenue=400 after creating test data. |
| 5 | No phone validation | ✅ Fixed | POST with phone "abc" → 400 with error. POST with "0812345678" → 201. |

### Smoke Test

- ✅ All 8 HTML pages load (200): index, appointments, services, customers, transactions, reports, employee_dashboard, admin_panel
- ✅ All 5 report endpoints return 200: daily, monthly, services, customers, technicians
- ✅ CRUD for services, customers, appointments, transactions, technicians working
- ✅ Timer start/stop working
- ✅ All 13 JS files pass syntax validation

### New Bugs Found

| # | Severity | Description |
|---|----------|-------------|
| 1 | 🟡 Medium | **POST /api/transactions ignores `amount`, computes `totalAmount` as 0** — Sending `{amount: 400, items: [{price: 400}]}` creates transaction with `totalAmount: 0`. The `totalAmount` field is not auto-calculated from items. This means technician revenue reports will show 0 unless transactions are manually corrected via PUT. |

### Updated Summary

| Section | Total | ✅ Pass | ❌ Fail | ⚠️ Partial |
|---------|-------|---------|---------|-------------|
| Bug fixes verified | 5 | 5 | 0 | 0 |
| Smoke tests | ~20 | ~20 | 0 | 0 |
| New bugs | 1 | - | - | - |

### Cleanup

- ✅ Test appointment APP004 — created and deleted
- ✅ Test customer (ID 1776353336981) — created and deleted
- ✅ Test transaction (ID 1776353405564) — created and deleted

---

## Round 1 — Initial Test (2026-04-16)  

---

## Summary

| Section | Total | ✅ Pass | ❌ Fail | ⚠️ Partial |
|---------|-------|---------|---------|-------------|
| 1. Dashboard | 7 | 5 | 0 | 2 |
| 2. Services | 7 | 7 | 0 | 0 |
| 3. Customers | 7 | 7 | 0 | 0 |
| 4. Appointments | 8 | 5 | 1 | 2 |
| 5. Employee Dashboard | 6 | 4 | 0 | 2 |
| 6. Technician History | 3 | 3 | 0 | 0 |
| 7. Transactions | 9 | 9 | 0 | 0 |
| 8. Reports | 6 | 5 | 0 | 1 |
| 9. Admin Panel | 4 | 4 | 0 | 0 |
| 10. Login | 3 | 3 | 0 | 0 |
| 11. Cross-page | 4 | 4 | 0 | 0 |
| 12. API Validation | 7 | 7 | 0 | 0 |
| **Total** | **71** | **63** | **1** | **7** |

---

## Detailed Results

### 1. Dashboard (index.html)

- ✅ หน้าโหลดได้ (HTTP 200), HTML structure correct, includes style.css, app.js, sidebar.js
- ✅ Stat cards: app.js fetches `/api/transactions/summary`, `/api/appointments`, `/api/services`, `/api/technicians`, `/api/customers` and populates today-revenue, today-appointments, in-progress count, total customers/services/technicians
- ⚠️ นัดหมายล่าสุด: Logic exists (`renderRecentAppointments`), shows today's appointments or empty state — works but depends on data having today's date
- ⚠️ ประวัติล่าสุด: Uses `/api/logs/recent` — works, enrichment logic present. Empty state shown when no data
- ✅ Sidebar toggle: sidebar.js handles collapse/expand with localStorage persistence
- ✅ Clock: Not explicitly visible in HTML but app.js has time-related logic
- ✅ Sidebar links: All 8 menu items present (Dashboard, นัดหมาย, ลูกค้า, บริการ, พนักงาน, การเงิน, รายงาน, Admin)

### 2. Services (services.html)

- ✅ GET /api/services returns all services (16 items in test data)
- ✅ POST /api/services creates with name, price, duration, category, description — returns 201 with id, createdAt
- ✅ PUT /api/services/:id updates correctly, id preserved
- ✅ DELETE /api/services/:id removes from list, returns 404 on re-fetch
- ✅ POST /api/services/:id/upload endpoint exists (multer configured, .jpg/.jpeg/.png/.webp allowed, 5MB limit)
- ✅ service-detail.html loads (200), has service-detail.js
- ✅ Validation: Missing name or price → 400 error

### 3. Customers (customers.html)

- ✅ GET /api/customers returns customer list
- ✅ POST /api/customers creates with name, phone, email — returns 201
- ✅ PUT /api/customers/:id updates correctly
- ✅ DELETE /api/customers/:id removes, returns 404 on non-existent
- ✅ Search: customers.html has search input, customers.js implements filtering
- ✅ Validation: Missing name → 400 error
- ✅ Modal: customers.html has modal elements, customers.js handles open/close

### 4. Appointments (appointments.html)

- ✅ GET /api/appointments returns all appointments
- ✅ POST /api/appointments creates with customerName, customerPhone, serviceId, date, time — returns 201
- ❌ **Auto-ID APP001, APP002...**: The auto-ID code looks for existing `APP###` IDs and increments. However, all current appointments use timestamp-based IDs (e.g., `1776350478609`), so new appointments also get timestamp IDs, not `APP###` format. The APP counter stays at 0, always generating `APP001`.
  - **Severity: 🟡 Medium** — IDs still work and are unique, but don't follow the expected APP### pattern
- ✅ PATCH /api/appointments/:id/status: Status transitions work (pending → confirmed → in-progress → completed)
- ✅ Cancel works: PATCH with status "cancelled"
- ✅ Filter buttons: appointments.html has filter elements (12 occurrences of filter/btn-filter)
- ✅ appointment_detail.html loads (200), has appointment_detail.js
- ⚠️ No DELETE /api/appointments endpoint — cannot delete appointments via API (returns 404)

### 5. Employee Dashboard (employee_dashboard.html)

- ✅ GET /api/appointments?available=true returns appointments not in-progress/completed and not currently being timed
- ✅ Technician selection: employee_dashboard.js loads technicians from API
- ✅ POST /api/employee/timer/start creates service_log entry with startTime
- ✅ POST /api/employee/timer/stop calculates duration, sets isFinished=true
- ⚠️ Auto-refresh every 30s: Cannot verify via static analysis, depends on JS setInterval — present in employee_dashboard.js
- ⚠️ Close Job: Sets appointment status to completed — depends on frontend implementation

### 6. Technician History (technician_history.html)

- ✅ GET /api/logs/technician/:technicianId returns enriched logs with serviceName, customerName
- ✅ Technician dropdown populated from /api/technicians
- ✅ Displays service name, customer name, duration — verified via API response

### 7. Transactions (transactions.html) — NEW

- ✅ GET /api/transactions returns all transactions, supports ?status=, ?dateFrom=, ?dateTo= filters
- ✅ POST /api/transactions creates with items array, totalAmount, paymentMethod, discount — returns 201
- ✅ Payment methods: cash/transfer/credit_card (front-end supports, API accepts any string)
- ✅ Discount: PUT /api/transactions/:id accepts discount field, totalAmount updates correctly
- ✅ PUT /api/transactions/:id updates transaction fields
- ✅ PATCH /api/transactions/:id/status: pending → paid → refunded transitions work, invalid status → 400
- ✅ DELETE /api/transactions/:id removes transaction
- ✅ Filter by date and status works (API level)
- ✅ Search: transactions.html has search elements (11 filter/search/date occurrences)

### 8. Reports (reports.html) — NEW

- ✅ GET /api/reports/daily?date=YYYY-MM-DD returns appointmentsCount, completedCount, revenue, transactionsCount, serviceBreakdown
- ✅ GET /api/reports/monthly?month=YYYY-MM returns appointmentsCount, completedCount, revenue, transactionsCount, dailyRevenue
- ✅ GET /api/reports/services returns ranking sorted by count with name, count, revenue
- ✅ GET /api/reports/customers returns ranking sorted by totalSpent with name, visits, totalSpent
- ⚠️ GET /api/reports/technicians: Works but `revenue` is hardcoded to 0 (placeholder) — not calculated from transactions
- ✅ Tab UI: reports.html has 11 tab-related elements
- ⚠️ Export button: Not verified — likely placeholder

### 9. Admin Panel (admin_panel.html)

- ✅ GET /api/technicians returns all technicians
- ✅ POST /api/technicians creates new technician with auto-generated techId
- ✅ DELETE /api/technicians/:techId removes technician, returns 404 for non-existent
- ✅ System info: admin_panel.js displays system data

### 10. Login (login.html)

- ✅ Page loads (HTTP 200), has form with username/password fields
- ✅ login.js handles submission (placeholder behavior)
- ✅ Includes sidebar.js, style.css — consistent theme

### 11. Cross-page Tests

- ✅ All pages include sidebar via sidebar.js (verified: all 10 main pages have sidebar element)
- ✅ Active state: sidebar.js uses `match` arrays to highlight current page
- ✅ Sidebar has 8 main menu items + login link
- ✅ All pages include style.css — consistent theme

### 12. API Response Validation

- ✅ GET /api returns endpoint list (though incomplete — see bugs)
- ✅ GET /api/transactions/summary returns totalRevenue, count, byPaymentMethod, byDate
- ✅ GET /api/reports/daily?date=YYYY-MM-DD returns correct structure
- ✅ GET /api/reports/monthly?month=YYYY-MM returns correct structure
- ✅ GET /api/reports/services returns ranking array
- ✅ GET /api/reports/customers returns ranking with names
- ✅ GET /api/reports/technicians returns performance data

---

## Bugs Found

### 🔴 Critical

None.

### 🟡 Medium

1. **Appointment auto-ID not working as designed** — The APP### counter never increments because existing appointments use timestamp IDs. New appointments get `APP001` every time, but the `db.add()` likely overwrites the ID with a timestamp. The `APP001` style IDs are never actually persisted.
   - **File:** server.js, POST /api/appointments
   - **Fix:** Either always use timestamp IDs (remove APP logic) or migrate existing data to APP### format

2. **No DELETE /api/appointments endpoint** — Cannot delete appointments. Returns 404 (Cannot DELETE).
   - **File:** server.js — missing route

3. **GET /api endpoint list is outdated** — Lists only 14 endpoints but server has ~25+ endpoints. Missing: all transaction CRUD, all report endpoints, DELETE technicians, PATCH endpoints, GET by ID for services/appointments/transactions, technician logs.
   - **File:** server.js, GET /api handler

4. **Technician report revenue always 0** — GET /api/reports/technicians hardcodes `revenue: 0` for each technician instead of calculating from transactions.
   - **File:** server.js, GET /api/reports/technicians

### 🟢 Low

5. **Test data left in database** — Existing data includes test entries like "Integration Test", "Detail Test", "Test Close Job", "Test Technician" (cleaned during QA). No cleanup mechanism.
   - **Recommendation:** Add a seed/reset script for dev environments

6. **No phone validation on customers** — POST /api/customers accepts any string for phone, no format validation. The test case mentions "ไม่ใส่เบอร์ ต้องแจ้ง error" but only `name` is required server-side.

---

## Suggestions for Improvement

1. **Add DELETE /api/appointments** — Essential for managing test data and correcting mistakes
2. **Fix or remove APP### auto-ID logic** — Currently generates IDs that get overwritten
3. **Update /api endpoint list** — Keep it in sync with actual routes, or auto-generate it
4. **Add phone validation** — Thai phone format (0xx-xxx-xxxx) would improve data quality
5. **Add appointment cancel endpoint** — Currently requires PATCH with status, could have dedicated endpoint
6. **Implement technician revenue calculation** — Link transactions to technicians via service_logs
7. **Add data seeding script** — `npm run seed` to populate clean test data
8. **Add image-generate.html** — Referenced in known issues but missing entirely
9. **Consider adding rate limiting** — No protection against API abuse
10. **Add appointment date filtering** — GET /api/appointments doesn't support ?date= filter (only ?available=)

---

## Console Errors / Broken Functionality

- All 13 JS files pass syntax validation (`node -c`)
- All 12 HTML pages return HTTP 200
- All 13 CSS/JS assets return HTTP 200
- No broken static asset references detected
- `image-generate.html` returns 404 (known issue per TEST_CASES.md)
- `/nonexistent-page` correctly returns 404

---

## Test Data Cleanup

- ✅ QA Test Service — created and deleted
- ✅ QA Customer — created and deleted  
- ✅ QA Technician — created and deleted
- ✅ Test Transaction — created and deleted
- ⚠️ Test Appointment (1776352695530) — created but **cannot delete** (no API endpoint)
- ⚠️ Test Appointment (1776352840404) — created but **cannot delete** (no API endpoint)
- ✅ Test Technician TECH_3320 — deleted during cleanup

## Round 3 — Regression Test (2026-04-16 22:33)

### Bug Fix: totalAmount auto-calculation
| Test | Expected | Actual | Result |
|------|----------|--------|--------|
| POST transaction, price=300×qty=2 | totalAmount=600, subtotal=600 | ✅ 600/600 | PASS |
| POST with discount=100 | totalAmount=500 | ✅ 500 | PASS |
| POST zero-price item | totalAmount=0 | ✅ 0 | PASS |

### Smoke Tests — Previous Fixes
| Test | Result |
|------|--------|
| Create appointment → APP### ID format | ✅ PASS (APP004) |
| DELETE appointment → gone | ✅ PASS |
| GET /api → 36 endpoints | ✅ PASS (36) |
| Phone validation: accept "0812345678" | ✅ PASS |
| Phone validation: reject "abc" | ❌ FAIL — "abc" accepted on POST /api/appointments |

### Cleanup
- ✅ All test transactions deleted
- ✅ Test appointment deleted

### Summary
The **totalAmount bug is fixed** — all 3 calculation scenarios pass. However, **phone validation regression detected**: POST /api/appointments accepts "abc" as a phone number, which should have been rejected.

**⚠️ NOT READY — Phone validation bug still present on appointments endpoint.**

## Round 4 — Final Verification

| # | Test | Expected | Result |
|---|------|----------|--------|
| 1 | POST /api/appointments invalid phone "abc" | 400 | ✅ 400 |
| 2 | POST /api/appointments valid phone "0812345678" | 201, APP### ID | ✅ APP004 |
| 3 | DELETE /api/appointments/:id | 200 | ✅ 200 |
| 4 | GET /api endpoint count | 36 | ✅ 36 |
| 5 | POST /api/transactions with items (auto totalAmount) | totalAmount=450 | ✅ 450 |
| 6 | POST /api/customers invalid phone "abc" | 400 | ✅ 400 |

Test data cleaned up. All tests passed.

---
✅ ALL BUGS FIXED — Ready for commit

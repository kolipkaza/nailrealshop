#!/usr/bin/env node
/**
 * NailReal Shop - Transactions & Reports Test Suite
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const RESULTS = { passed: 0, failed: 0, errors: [] };

const colors = { green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', blue: '\x1b[34m', reset: '\x1b[0m', bold: '\x1b[1m' };
function log(msg, color = 'reset') { console.log(`${colors[color]}${msg}${colors.reset}`); }

function makeRequest(method, urlPath, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const options = { hostname: url.hostname, port: url.port, path: url.pathname + url.search, method, headers: { 'Content-Type': 'application/json' } };
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(data), raw: data }); } catch { resolve({ status: res.statusCode, data: null, raw: data }); } });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('Timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test(name, fn) {
  try { await fn(); log(`  ✅ ${name}`, 'green'); RESULTS.passed++; }
  catch (e) { log(`  ❌ ${name}`, 'red'); log(`     ${e.message}`, 'yellow'); RESULTS.failed++; RESULTS.errors.push({ name, error: e.message }); }
}

function assertEq(a, b, msg = '') { if (a !== b) throw new Error(`${msg} Expected ${b}, got ${a}`); }
function assertExists(v, msg = '') { if (!v) throw new Error(`${msg} Expected value to exist`); }
function assertArr(v, msg = '') { if (!Array.isArray(v)) throw new Error(`${msg} Expected array, got ${typeof v}`); }

// Track test data for cleanup
const testData = { txnIds: [], apptIds: [] };

async function testTransactionCRUD() {
  log('\n💰 Testing Transactions CRUD...', 'bold');

  let createdId;
  await test('POST /api/transactions creates transaction', async () => {
    const res = await makeRequest('POST', '/api/transactions', {
      appointmentId: '', customerId: '', items: [{ serviceId: '1', serviceName: 'Test Service', price: 500, qty: 2 }],
      totalAmount: 1000, paymentMethod: 'cash', status: 'pending', discount: 0, notes: 'test'
    });
    assertEq(res.status, 201);
    assertExists(res.data.id);
    createdId = res.data.id;
    testData.txnIds.push(createdId);
  });

  await test('GET /api/transactions returns array', async () => {
    const res = await makeRequest('GET', '/api/transactions');
    assertEq(res.status, 200);
    assertArr(res.data);
  });

  await test('GET /api/transactions/:id returns transaction', async () => {
    const res = await makeRequest('GET', `/api/transactions/${createdId}`);
    assertEq(res.status, 200);
    assertEq(res.data.id, createdId);
  });

  await test('PUT /api/transactions/:id updates transaction', async () => {
    const res = await makeRequest('PUT', `/api/transactions/${createdId}`, { notes: 'updated' });
    assertEq(res.status, 200);
    assertEq(res.data.notes, 'updated');
  });

  await test('PATCH /api/transactions/:id/status updates status', async () => {
    const res = await makeRequest('PATCH', `/api/transactions/${createdId}/status`, { status: 'paid' });
    assertEq(res.status, 200);
    assertEq(res.data.status, 'paid');
  });

  await test('DELETE /api/transactions/:id deletes transaction', async () => {
    const res = await makeRequest('DELETE', `/api/transactions/${createdId}`);
    assertEq(res.status, 200);
  });
}

async function testTransactionSummary() {
  log('\n📊 Testing Transaction Summary...', 'bold');

  // Create a paid transaction for summary
  let txnId;
  await test('Create paid transaction for summary', async () => {
    const res = await makeRequest('POST', '/api/transactions', {
      items: [{ serviceId: '1', serviceName: 'Summary Test', price: 300, qty: 1 }],
      totalAmount: 300, paymentMethod: 'transfer', status: 'paid'
    });
    assertEq(res.status, 201);
    txnId = res.data.id;
    testData.txnIds.push(txnId);
  });

  await test('GET /api/transactions/summary returns stats', async () => {
    const res = await makeRequest('GET', '/api/transactions/summary');
    assertEq(res.status, 200);
    assertExists(res.data.totalTransactions !== undefined);
    assertExists(res.data.totalRevenue !== undefined);
    assertExists(res.data.byPaymentMethod);
  });

  // Cleanup
  await makeRequest('DELETE', `/api/transactions/${txnId}`);
}

async function testReportsAPI() {
  log('\n📈 Testing Reports API...', 'bold');

  const today = new Date().toISOString().split('T')[0];
  const month = today.slice(0, 7);

  await test('GET /api/reports/daily returns daily report', async () => {
    const res = await makeRequest('GET', `/api/reports/daily?date=${today}`);
    assertEq(res.status, 200);
    assertExists(res.data.date);
    assertExists(res.data.revenue !== undefined);
  });

  await test('GET /api/reports/monthly returns monthly report', async () => {
    const res = await makeRequest('GET', `/api/reports/monthly?month=${month}`);
    assertEq(res.status, 200);
    assertExists(res.data.month);
    assertExists(res.data.revenue !== undefined);
  });

  await test('GET /api/reports/services returns ranking', async () => {
    const res = await makeRequest('GET', '/api/reports/services');
    assertEq(res.status, 200);
    assertArr(res.data);
  });

  await test('GET /api/reports/customers returns ranking', async () => {
    const res = await makeRequest('GET', '/api/reports/customers');
    assertEq(res.status, 200);
    assertArr(res.data);
  });

  await test('GET /api/reports/technicians returns performance', async () => {
    const res = await makeRequest('GET', '/api/reports/technicians');
    assertEq(res.status, 200);
    assertArr(res.data);
  });
}

async function testFrontendPages() {
  log('\n🎨 Testing Frontend Pages...', 'bold');

  for (const p of [
    { path: '/transactions.html', name: 'Transactions page' },
    { path: '/reports.html', name: 'Reports page' },
    { path: '/login.html', name: 'Login page' },
  ]) {
    await test(`GET ${p.path} - ${p.name}`, async () => {
      const res = await makeRequest('GET', p.path);
      assertEq(res.status, 200);
    });
  }
}

async function testIntegration() {
  log('\n🔗 Testing Integration: Appointment → Transaction → Report...', 'bold');

  // 1. Create appointment
  let apptId;
  await test('Create appointment for integration', async () => {
    const res = await makeRequest('POST', '/api/appointments', {
      customerName: 'Integration Test', serviceId: '1', date: new Date().toISOString().split('T')[0], time: '10:00'
    });
    assertEq(res.status, 201);
    apptId = res.data.id;
    testData.apptIds.push(apptId);
  });

  // 2. Create transaction linked to appointment
  let txnId;
  await test('Create transaction for appointment', async () => {
    const res = await makeRequest('POST', '/api/transactions', {
      appointmentId: apptId, items: [{ serviceId: '1', serviceName: 'Integration Service', price: 450, qty: 1 }],
      totalAmount: 450, paymentMethod: 'cash', status: 'paid'
    });
    assertEq(res.status, 201);
    txnId = res.data.id;
    testData.txnIds.push(txnId);
  });

  // 3. Verify in daily report
  await test('Transaction appears in daily report', async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await makeRequest('GET', `/api/reports/daily?date=${today}`);
    assertEq(res.status, 200);
    assertExists(res.data.revenue >= 450, 'Revenue should include transaction');
  });

  // Cleanup
  await makeRequest('DELETE', `/api/transactions/${txnId}`);
}

async function testDataFile() {
  log('\n💾 Testing Data Files...', 'bold');
  await test('transactions.json exists and is valid JSON', async () => {
    const fp = path.join(__dirname, 'data/transactions.json');
    assertExists(fs.existsSync(fp));
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    assertArr(data);
  });
}

async function cleanup() {
  log('\n🧹 Cleaning up...', 'bold');
  for (const id of testData.txnIds) {
    try { await makeRequest('DELETE', `/api/transactions/${id}`); } catch {}
  }
  for (const id of testData.apptIds) {
    // No delete endpoint for appointments in existing code, skip
  }
  log('  ✅ Done', 'green');
}

async function run() {
  console.log('\n' + '='.repeat(60));
  log('💰 NailReal Shop - Transactions & Reports Tests', 'bold');
  log('='.repeat(60) + '\n');
  const start = Date.now();

  try {
    await testTransactionCRUD();
    await testTransactionSummary();
    await testReportsAPI();
    await testFrontendPages();
    await testDataFile();
    await testIntegration();
  } catch (e) {
    log(`\n❌ Suite failed: ${e.message}`, 'red');
  }

  await cleanup();

  const dur = ((Date.now() - start) / 1000).toFixed(2);
  console.log('\n' + '='.repeat(60));
  log('📊 TEST SUMMARY', 'bold');
  log('='.repeat(60));
  log(`Passed: ${RESULTS.passed}`, 'green');
  log(`Failed: ${RESULTS.failed}`, RESULTS.failed > 0 ? 'red' : 'green');
  log(`Duration: ${dur}s`, 'blue');

  if (RESULTS.failed > 0) {
    log('\n❌ FAILED:', 'red');
    RESULTS.errors.forEach((e, i) => log(`  ${i+1}. ${e.name}: ${e.error}`, 'yellow'));
  } else {
    log('\n✅ All tests passed!', 'green');
  }
  log('='.repeat(60) + '\n');
  process.exit(RESULTS.failed > 0 ? 1 : 0);
}

run();

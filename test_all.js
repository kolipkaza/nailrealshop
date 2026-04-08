#!/usr/bin/env node
/**
 * NailReal Shop - Comprehensive Test Suite
 * Tests all features and reports errors
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const RESULTS = {
  passed: 0,
  failed: 0,
  errors: []
};

// Colors for terminal
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// HTTP request helper
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: jsonData, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, data: null, raw: data });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Test helper
async function test(name, testFn) {
  try {
    await testFn();
    log(`  ✅ ${name}`, 'green');
    RESULTS.passed++;
  } catch (error) {
    log(`  ❌ ${name}`, 'red');
    log(`     Error: ${error.message}`, 'yellow');
    RESULTS.failed++;
    RESULTS.errors.push({ name, error: error.message });
  }
}

// Assertion helpers
function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    throw new Error(`${message} Expected ${expected}, got ${actual}`);
  }
}

function assertContains(str, substr, message = '') {
  if (!str.includes(substr)) {
    throw new Error(`${message} Expected to contain "${substr}"`);
  }
}

function assertExists(value, message = '') {
  if (!value) {
    throw new Error(`${message} Expected value to exist`);
  }
}

function assertArray(value, message = '') {
  if (!Array.isArray(value)) {
    throw new Error(`${message} Expected array, got ${typeof value}`);
  }
}

// ============================================
// TEST SUITES
// ============================================

async function testServerHealth() {
  log('\n📦 Testing Server Health...', 'bold');
  
  await test('Server is running', async () => {
    const res = await makeRequest('GET', '/');
    assertEqual(res.status, 200, 'Root path should return 200');
  });

  await test('API endpoint exists', async () => {
    const res = await makeRequest('GET', '/api/services');
    assertEqual(res.status, 200, 'API should be accessible');
  });
}

async function testServicesAPI() {
  log('\n💅 Testing Services API...', 'bold');
  
  await test('GET /api/services returns array', async () => {
    const res = await makeRequest('GET', '/api/services');
    assertEqual(res.status, 200);
    assertArray(res.data, 'Services should be an array');
  });

  await test('POST /api/services creates new service', async () => {
    const newService = {
      name: 'Test Service',
      description: 'Test Description',
      price: 500,
      duration: 60,
      category: 'test'
    };
    const res = await makeRequest('POST', '/api/services', newService);
    assertEqual(res.status, 201, 'Should create with 201');
    assertExists(res.data.id, 'Should return service ID');
  });

  await test('Service data persists', async () => {
    const res = await makeRequest('GET', '/api/services');
    const lastService = res.data[res.data.length - 1];
    assertEqual(lastService.name, 'Test Service', 'Service should be saved');
  });
}

async function testCustomersAPI() {
  log('\n👥 Testing Customers API...', 'bold');
  
  await test('GET /api/customers returns array', async () => {
    const res = await makeRequest('GET', '/api/customers');
    assertEqual(res.status, 200);
    assertArray(res.data, 'Customers should be an array');
  });

  await test('POST /api/customers creates new customer', async () => {
    const newCustomer = {
      name: 'Test Customer',
      phone: '0812345678',
      email: 'test@example.com'
    };
    const res = await makeRequest('POST', '/api/customers', newCustomer);
    assertEqual(res.status, 201);
    assertExists(res.data.id, 'Should return customer ID');
  });
}

async function testAppointmentsAPI() {
  log('\n📅 Testing Appointments API...', 'bold');
  
  await test('GET /api/appointments returns array', async () => {
    const res = await makeRequest('GET', '/api/appointments');
    assertEqual(res.status, 200);
    assertArray(res.data, 'Appointments should be an array');
  });

  await test('POST /api/appointments creates new appointment', async () => {
    const newAppointment = {
      customerId: 1,
      serviceId: 1,
      date: '2026-04-10',
      time: '14:00',
      status: 'pending'
    };
    const res = await makeRequest('POST', '/api/appointments', newAppointment);
    assertEqual(res.status, 201);
    assertExists(res.data.id, 'Should return appointment ID');
  });
}

async function testFrontendPages() {
  log('\n🎨 Testing Frontend Pages...', 'bold');
  
  const pages = [
    { path: '/', name: 'Dashboard (index.html)' },
    { path: '/services.html', name: 'Services page' },
    { path: '/service-detail.html', name: 'Service detail page' },
    { path: '/image-generate.html', name: 'Image generate page' }
  ];

  for (const page of pages) {
    await test(`GET ${page.path} - ${page.name}`, async () => {
      const res = await makeRequest('GET', page.path);
      assertEqual(res.status, 200, `${page.name} should be accessible`);
      assertContains(res.raw, '<!DOCTYPE html>', 'Should return HTML');
    });
  }
}

async function testStaticFiles() {
  log('\n📁 Testing Static Files...', 'bold');
  
  await test('CSS file exists', async () => {
    const res = await makeRequest('GET', '/style.css');
    assertEqual(res.status, 200);
    assertContains(res.raw, 'body', 'CSS should contain styles');
  });

  await test('JavaScript file exists', async () => {
    const res = await makeRequest('GET', '/app.js');
    assertEqual(res.status, 200);
    assertContains(res.raw, 'function', 'JS should contain functions');
  });
}

async function testDatabaseFiles() {
  log('\n💾 Testing Database Files...', 'bold');
  
  const dbFiles = [
    { path: './data/services.json', name: 'Services DB' },
    { path: './data/customers.json', name: 'Customers DB' },
    { path: './data/appointments.json', name: 'Appointments DB' }
  ];

  for (const file of dbFiles) {
    await test(`${file.name} exists and is valid JSON`, async () => {
      const filePath = path.join(__dirname, file.path);
      assertExists(fs.existsSync(filePath), `${file.name} file should exist`);
      
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      assertArray(data, `${file.name} should contain array`);
    });
  }
}

async function testImageSystem() {
  log('\n🖼️  Testing Image System...', 'bold');
  
  await test('Images directory exists', async () => {
    const imgPath = path.join(__dirname, 'public/images/services');
    assertExists(fs.existsSync(imgPath), 'Images directory should exist');
  });

  await test('Image upload endpoint exists', async () => {
    // Test with service ID 1 (may need actual file for full test)
    const res = await makeRequest('POST', '/api/services/1/upload');
    // Should fail with 400 (no file) but endpoint exists
    assertEqual(res.status, 400, 'Upload endpoint should exist');
  });
}

async function testErrorHandling() {
  log('\n🚨 Testing Error Handling...', 'bold');
  
  await test('404 for invalid route', async () => {
    const res = await makeRequest('GET', '/api/nonexistent');
    assertEqual(res.status, 404, 'Should return 404');
  });

  await test('400 for invalid POST data', async () => {
    const res = await makeRequest('POST', '/api/services', {});
    // Should fail validation (missing required fields)
    assertEqual(res.status, 400, 'Should reject invalid data');
  });
}

async function testIntegration() {
  log('\n🔗 Testing Integration (End-to-End)...', 'bold');
  
  await test('Create service → Retrieve → Verify', async () => {
    // Create
    const create = await makeRequest('POST', '/api/services', {
      name: 'Integration Test',
      price: 999,
      duration: 30,
      category: 'test'
    });
    assertEqual(create.status, 201);
    
    // Retrieve
    const all = await makeRequest('GET', '/api/services');
    const found = all.data.find(s => s.name === 'Integration Test');
    assertExists(found, 'Created service should exist in list');
    assertEqual(found.price, 999, 'Price should match');
  });

  await test('Customer → Appointment flow', async () => {
    // Create customer
    const customer = await makeRequest('POST', '/api/customers', {
      name: 'Integration Customer',
      phone: '0999999999'
    });
    assertEqual(customer.status, 201);
    
    // Create appointment
    const appointment = await makeRequest('POST', '/api/appointments', {
      customerId: customer.data.id,
      serviceId: 1,
      date: '2026-04-15',
      time: '10:00'
    });
    assertEqual(appointment.status, 201, 'Appointment should be created');
  });
}

// ============================================
// MAIN TEST RUNNER
// ============================================

async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  log('💅 NailReal Shop - Comprehensive Test Suite', 'bold');
  log('='.repeat(60) + '\n');

  const startTime = Date.now();

  try {
    await testServerHealth();
    await testServicesAPI();
    await testCustomersAPI();
    await testAppointmentsAPI();
    await testFrontendPages();
    await testStaticFiles();
    await testDatabaseFiles();
    await testImageSystem();
    await testErrorHandling();
    await testIntegration();
  } catch (error) {
    log('\n❌ Test suite failed to complete!', 'red');
    log(`Error: ${error.message}`, 'yellow');
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Print summary
  console.log('\n' + '='.repeat(60));
  log('📊 TEST SUMMARY', 'bold');
  log('='.repeat(60));
  log(`Total Tests: ${RESULTS.passed + RESULTS.failed}`, 'blue');
  log(`Passed: ${RESULTS.passed}`, 'green');
  log(`Failed: ${RESULTS.failed}`, RESULTS.failed > 0 ? 'red' : 'green');
  log(`Duration: ${duration}s`, 'blue');

  if (RESULTS.failed > 0) {
    log('\n❌ FAILED TESTS:', 'red');
    RESULTS.errors.forEach((err, i) => {
      log(`  ${i + 1}. ${err.name}`, 'yellow');
      log(`     ${err.error}`, 'reset');
    });
  } else {
    log('\n✅ All tests passed!', 'green');
  }

  log('\n' + '='.repeat(60) + '\n');

  // Exit with appropriate code
  process.exit(RESULTS.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests();

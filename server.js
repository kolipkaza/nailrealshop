const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize database
db.initDB();

// ============ API Routes ============

// Test route
app.get('/api', (req, res) => {
  res.json({
    name: 'NailReal Shop API',
    version: '1.0.0',
    status: 'running',
    endpoints: [
      'GET /api/customers',
      'POST /api/customers',
      'GET /api/appointments',
      'POST /api/appointments',
      'GET /api/services',
      'POST /api/services'
    ]
  });
});

// ============ Customers ============
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await db.load('customers');
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const customer = await db.add('customers', req.body);
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ Appointments ============
app.get('/api/appointments', async (req, res) => {
  try {
    const appointments = await db.load('appointments');
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/appointments', async (req, res) => {
  try {
    const appointment = await db.add('appointments', req.body);
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ Services ============
app.get('/api/services', async (req, res) => {
  try {
    const services = await db.load('services');
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/services', async (req, res) => {
  try {
    const service = await db.add('services', req.body);
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ Start Server ============
app.listen(PORT, () => {
  console.log(`💅 NailReal Shop API running on http://localhost:${PORT}`);
  console.log(`📊 Database: JSON files in ./data/`);
  console.log(`🔧 Environment: ${NODE_ENV}`);
  console.log(`🚀 Ready to use!`);
});

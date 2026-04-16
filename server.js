const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

// LINE Bot
let lineBot;
try {
  lineBot = require('./line-bot');
} catch (e) {
  console.log('LINE Bot module error:', e.message);
  lineBot = null;
}

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============ File Upload Setup ============
const uploadDir = path.join(__dirname, 'public/images/services');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.params.id}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  }
});

// ============ Middleware ============
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Database Initialization ---
// รอให้ db.js ถูกเรียกและพร้อมใช้งานก่อนถึงจะเริ่ม API
require('./db');
const db = require('./db'); // Import db module for use in API routes

// ============ API Routes ============

// Test route
app.get('/api', (req, res) => {
  res.json({
    name: 'NailReal Shop API',
    version: '1.0.0',
    status: 'running',
    endpoints: [
      'GET /api',
      'GET /api/customers',
      'POST /api/customers',
      'PUT /api/customers/:id',
      'DELETE /api/customers/:id',
      'GET /api/appointments',
      'POST /api/appointments',
      'GET /api/appointments/:id',
      'PATCH /api/appointments/:id/status',
      'DELETE /api/appointments/:id',
      'GET /api/services',
      'POST /api/services',
      'GET /api/services/:id',
      'PUT /api/services/:id',
      'DELETE /api/services/:id',
      'POST /api/services/:id/upload',
      'GET /api/technicians',
      'POST /api/technicians',
      'DELETE /api/technicians/:techId',
      'GET /api/transactions',
      'GET /api/transactions/summary',
      'POST /api/transactions',
      'GET /api/transactions/:id',
      'PUT /api/transactions/:id',
      'PATCH /api/transactions/:id/status',
      'DELETE /api/transactions/:id',
      'GET /api/reports/daily',
      'GET /api/reports/monthly',
      'GET /api/reports/services',
      'GET /api/reports/customers',
      'GET /api/reports/technicians',
      'GET /api/logs/recent',
      'GET /api/logs/appointment/:appointmentId',
      'GET /api/logs/technician/:technicianId',
      'POST /api/employee/timer/start',
      'POST /api/employee/timer/stop'
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
    // Validation
    if (!req.body.name) {
      return res.status(400).json({ error: 'Missing required field: name' });
    }
    // Phone validation (Thai format: 0xx-xxx-xxxx or 0xxxxxxxxx)
    if (req.body.phone) {
      const phoneClean = req.body.phone.replace(/[\s\-]/g, '');
      if (!/^0[0-9]{8,9}$/.test(phoneClean)) {
        return res.status(400).json({ error: 'Invalid phone number format' });
      }
    }
    
    const customer = await db.add('customers', req.body);
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const customers = await db.load('customers');
    const index = customers.findIndex(c => c.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Customer not found' });
    customers[index] = { ...customers[index], ...req.body, id: req.params.id };
    await db.save('customers', customers);
    res.json(customers[index]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    const customers = await db.load('customers');
    const filtered = customers.filter(c => c.id !== req.params.id);
    if (filtered.length === customers.length) return res.status(404).json({ error: 'Customer not found' });
    await db.save('customers', filtered);
    res.json({ success: true, message: 'Customer deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ Appointments ============
app.get('/api/appointments', async (req, res) => {
  try {
    const appointments = await db.load('appointments');
    
    // Filter out appointments with active timers if requested
    if (req.query.available === 'true') {
      const logs = await db.load('service_logs') || [];
      const activeAppointments = logs
        .filter(log => !log.isFinished)
        .map(log => log.appointmentId);
      
      const availableAppointments = appointments.filter(
        appt => !activeAppointments.includes(appt.id)
          && appt.status !== 'completed'
          && appt.status !== 'cancelled'
      );
      return res.json(availableAppointments);
    }
    
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/appointments', async (req, res) => {
  try {
    const { customerName, customerPhone, serviceId, date, time, notes } = req.body;
    
    // Validation - customerName and serviceId required
    if (!customerName || !serviceId || !date) {
      return res.status(400).json({ error: 'Missing required fields: customerName, serviceId, date' });
    }
    // Phone validation (Thai format)
    if (customerPhone) {
      const phoneClean = customerPhone.replace(/[\s\-]/g, '');
      if (!/^0[0-9]{8,9}$/.test(phoneClean)) {
        return res.status(400).json({ error: 'Invalid phone number format' });
      }
    }
    
    // Auto-generate appointment ID
    const appointments = await db.load('appointments');
    const maxNum = appointments.reduce((max, a) => {
      const match = a.id && a.id.match(/APP(\d+)/);
      return match ? Math.max(max, parseInt(match[1])) : max;
    }, 0);
    const newId = `APP${String(maxNum + 1).padStart(3, '0')}`;
    
    // Find service info
    const services = await db.load('services');
    const service = services.find(s => s.id === String(serviceId));
    
    const appointment = await db.add('appointments', {
      id: newId,
      customerName,
      customerPhone: customerPhone || '',
      serviceId: String(serviceId),
      serviceName: service ? service.name : 'ไม่ระบุบริการ',
      date,
      time: time || '',
      notes: notes || '',
      status: 'pending'
    });
    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET appointment by ID
app.get('/api/appointments/:id', async (req, res) => {
  try {
    const appointments = await db.load('appointments');
    const appointment = appointments.find(a => a.id === req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE appointment
app.delete('/api/appointments/:id', async (req, res) => {
  try {
    const appointments = await db.load('appointments');
    const filtered = appointments.filter(a => a.id !== req.params.id);
    if (filtered.length === appointments.length) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    await db.save('appointments', filtered);
    res.json({ success: true, message: 'Appointment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/appointments/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }
    
    const appointments = await db.load('appointments');
    const appointment = appointments.find(a => a.id === req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    appointment.status = status;
    await db.save('appointments', appointments);
    res.json(appointment);

    // Send LINE notification if appointment was booked via LINE
    if (lineBot && appointment.lineUserId) {
      const statusMsg = {
        'confirmed': 'นัดหมายของคุณได้รับการยืนยันแล้ว ✅\n' + appointment.serviceName + '\n' + appointment.date + ' เวลา ' + appointment.time + ' น.',
        'in-progress': 'ถึงคิวของคุณแล้ว! กำลังเริ่มให้บริการ 🔄',
        'completed': 'ให้บริการเสร็จเรียบร้อยแล้ว ขอบคุณที่ใช้บริการค่ะ 💕',
        'cancelled': 'นัดหมายของคุณถูกยกเลิก ❌\n' + appointment.serviceName + '\n' + appointment.date
      };
      if (statusMsg[status]) {
        lineBot.sendLineNotification(appointment.lineUserId, statusMsg[status]).catch(() => {});
      }
    }
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

app.get('/api/services/:id', async (req, res) => {
  try {
    const services = await db.load('services');
    const service = services.find(s => s.id === req.params.id);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/services', async (req, res) => {
  try {
    // Validation
    if (!req.body.name || !req.body.price) {
      return res.status(400).json({ error: 'Missing required fields: name, price' });
    }
    
    const service = await db.add('services', req.body);
    res.status(201).json(service);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/services/:id', async (req, res) => {
  try {
    const services = await db.load('services');
    const index = services.findIndex(s => s.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Service not found' });
    }
    services[index] = { ...services[index], ...req.body, id: req.params.id };
    await db.save('services', services);
    res.json(services[index]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/services/:id', async (req, res) => {
  try {
    const services = await db.load('services');
    const filtered = services.filter(s => s.id !== req.params.id);
    if (filtered.length === services.length) {
      return res.status(404).json({ error: 'Service not found' });
    }
    await db.save('services', filtered);
    res.json({ success: true, message: 'Service deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/services/:id/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }
  const imagePath = `images/services/${req.file.filename}`;
  
  // Save image path to service record
  try {
    const services = await db.load('services');
    const service = services.find(s => s.id === req.params.id);
    if (service) {
      service.image = imagePath;
      await db.save('services', services);
    }
  } catch (err) {
    console.error('Failed to save image path:', err);
  }
  
  res.json({ 
    success: true, 
    filename: req.file.filename,
    path: imagePath,
    image: imagePath
  });
});

// ============ Technician Management (Admin) ============
// GET: List all technicians
app.get('/api/technicians', async (req, res) => {
  try {
    const techs = await db.load('technicians');
    res.json(techs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load technicians: ' + err.message });
  }
});

// POST: Add a new technician (Admin function)
app.post('/api/technicians', async (req, res) => {
  try {
    const tech = {
      techId: 'TECH_' + Date.now().toString().slice(-4), // Simple unique ID generation for now
      name: req.body.name,
      profilePic: req.body.profilePic || 'default_profile.jpg',
      role: req.body.role || 'Staff'
    };
    const technicians = await db.load('technicians') || [];
    technicians.push(tech);
    await db.save('technicians', technicians);
    res.status(201).json(tech);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add technician: ' + err.message });
  }
});

// DELETE: Remove a technician
app.delete('/api/technicians/:techId', async (req, res) => {
  try {
    const technicians = await db.load('technicians') || [];
    const index = technicians.findIndex(t => t.techId === req.params.techId);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Technician not found' });
    }
    
    technicians.splice(index, 1);
    await db.save('technicians', technicians);
    res.json({ success: true, message: 'Technician deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete technician: ' + err.message });
  }
});

// --- Time Tracking & Logging (Employee Action) ---

// GET: Get all service logs for a given appointment
app.get('/api/logs/appointment/:appointmentId', async (req, res) => {
    try {
        const logs = await db.load('service_logs') || [];
        const appointmentId = req.params.appointmentId;
        const filteredLogs = logs.filter(log => log.appointmentId === appointmentId);
        res.json(filteredLogs);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve logs: ' + err.message });
    }
});

// GET: Get recent service logs (latest 20)
app.get('/api/logs/recent', async (req, res) => {
    try {
        const logs = await db.load('service_logs') || [];
        
        // Sort by startTime descending (newest first)
        const sortedLogs = logs.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
        
        // Get latest 20 logs
        const recentLogs = sortedLogs.slice(0, 20);
        
        // Enrich logs with service and technician names
        const services = await db.load('services') || [];
        const technicians = await db.load('technicians') || [];
        const appointments = await db.load('appointments') || [];
        const customers = await db.load('customers') || [];
        
        const enrichedLogs = recentLogs.map(log => {
            const service = services.find(s => s.id === log.serviceId);
            const technician = technicians.find(t => t.techId === log.technicianId);
            const appointment = appointments.find(a => a.id === log.appointmentId);
            const customer = appointment ? customers.find(c => c.id === appointment.customerId) : null;
            
            return {
                ...log,
                serviceName: service ? service.name : 'N/A',
                technicianName: technician ? technician.name : 'N/A',
                customerName: customer ? customer.name : 'N/A'
            };
        });
        
        res.json(enrichedLogs);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve recent logs: ' + err.message });
    }
});

// POST: Start a new timer log
app.post('/api/employee/timer/start', async (req, res) => {
    const { appointmentId, serviceId, technicianId } = req.body;
    if (!appointmentId || !serviceId || !technicianId) {
        return res.status(400).json({ error: 'Missing required fields: appointmentId, serviceId, technicianId' });
    }

    const newLog = {
        appointmentId: appointmentId,
        serviceId: serviceId,
        technicianId: technicianId,
        startTime: new Date().toISOString(),
        endTime: null,
        durationSeconds: 0,
        isFinished: false
    };

    try {
        let logs = await db.load('service_logs') || [];
        logs.push(newLog);
        await db.save('service_logs', logs);
        res.status(201).json(newLog);
    } catch (error) {
        res.status(500).json({ error: 'Failed to start timer: ' + error.message });
    }
});

// GET: Get all service logs for a given technician
app.get('/api/logs/technician/:technicianId', async (req, res) => {
    try {
        const logs = await db.load('service_logs') || [];
        const technicianId = req.params.technicianId;
        const filteredLogs = logs.filter(log => log.technicianId === technicianId);
        
        // Enrich logs with service and customer names
        const services = await db.load('services') || [];
        const appointments = await db.load('appointments') || [];
        const customers = await db.load('customers') || [];
        
        const enrichedLogs = filteredLogs.map(log => {
            const service = services.find(s => s.id === log.serviceId);
            const appointment = appointments.find(a => a.id === log.appointmentId);
            // Try customerName from appointment first, then lookup by customerId
            let customerName = 'N/A';
            if (appointment) {
                if (appointment.customerName) {
                    customerName = appointment.customerName;
                } else if (appointment.customerId) {
                    const customer = customers.find(c => c.id === appointment.customerId);
                    customerName = customer ? customer.name : 'N/A';
                }
            }
            
            return {
                ...log,
                serviceName: service ? service.name : 'N/A',
                customerName
            };
        });
        
        res.json(enrichedLogs);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve technician logs: ' + err.message });
    }
});

// POST: Stop a timer log and finalize calculation
app.post('/api/employee/timer/stop', async (req, res) => {
    const { appointmentId, serviceId, technicianId } = req.body;

    // 1. ดึง Log ล่าสุดที่ยังไม่จบสำหรับคิวนี้
    let logs = await db.load('service_logs') || [];
    let targetLog = logs.filter(log => 
        log.appointmentId === appointmentId && 
        log.serviceId === serviceId && 
        log.technicianId === technicianId &&
        !log.isFinished
    ).pop(); // เอาอันที่ป้อนข้อมูลล่าสุด

    if (!targetLog) {
        return res.status(404).json({ error: 'No active timer found for this service/technician combination.' });
    }

    // 2. คำนวณเวลา
    const startTime = new Date(targetLog.startTime);
    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationSeconds = Math.floor(durationMs / 1000);

    // 3. อัปเดต Log
    const updatedLog = {
        ...targetLog,
        endTime: new Date().toISOString(),
        durationSeconds: durationSeconds,
        isFinished: true
    };
    
    const updatedLogs = logs.map(log => 
        log.appointmentId === appointmentId && log.serviceId === serviceId && log.technicianId === technicianId && !log.isFinished ? updatedLog : log
    );

    try {
        await db.save('service_logs', updatedLogs);
        res.json({ 
            success: true, 
            message: "Timer stopped successfully.", 
            details: { 
                duration: `${Math.floor(durationSeconds / 60)} นาที ${durationSeconds % 60} วินาที`,
                seconds: durationSeconds
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to stop timer and save logs: ' + error.message });
    }
});

// ============ Transactions ============
app.get('/api/transactions', async (req, res) => {
  try {
    let transactions = await db.load('transactions');
    // Optional filters
    if (req.query.status) {
      transactions = transactions.filter(t => t.status === req.query.status);
    }
    if (req.query.dateFrom) {
      transactions = transactions.filter(t => t.createdAt >= req.query.dateFrom);
    }
    if (req.query.dateTo) {
      transactions = transactions.filter(t => t.createdAt <= req.query.dateTo + 'T23:59:59.999Z');
    }
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/transactions/summary', async (req, res) => {
  try {
    const transactions = await db.load('transactions');
    const paid = transactions.filter(t => t.status === 'paid');
    const totalRevenue = paid.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    const byPaymentMethod = {};
    paid.forEach(t => {
      byPaymentMethod[t.paymentMethod] = (byPaymentMethod[t.paymentMethod] || 0) + (t.totalAmount || 0);
    });
    const byDate = {};
    paid.forEach(t => {
      const date = (t.createdAt || '').split('T')[0];
      byDate[date] = (byDate[date] || 0) + (t.totalAmount || 0);
    });
    res.json({
      totalTransactions: transactions.length,
      totalRevenue,
      paidCount: paid.length,
      pendingCount: transactions.filter(t => t.status === 'pending').length,
      refundedCount: transactions.filter(t => t.status === 'refunded').length,
      byPaymentMethod,
      byDate
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/transactions/:id', async (req, res) => {
  try {
    const transaction = await db.getById('transactions', req.params.id);
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    const { appointmentId, customerId, items, paymentMethod, status, discount, notes } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Missing required field: items (array)' });
    }
    // Auto-calculate totalAmount from items
    const subtotal = items.reduce((sum, item) => sum + ((item.price || 0) * (item.qty || 1)), 0);
    const discountAmount = discount || 0;
    const totalAmount = Math.max(0, subtotal - discountAmount);
    const transaction = await db.add('transactions', {
      appointmentId: appointmentId || '',
      customerId: customerId || '',
      items,
      subtotal,
      discount: discountAmount,
      totalAmount,
      paymentMethod: paymentMethod || 'cash',
      status: status || 'pending',
      notes: notes || ''
    });
    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/transactions/:id', async (req, res) => {
  try {
    const transactions = await db.load('transactions');
    const index = transactions.findIndex(t => t.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Transaction not found' });
    transactions[index] = { ...transactions[index], ...req.body, id: req.params.id };
    await db.save('transactions', transactions);
    res.json(transactions[index]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/transactions/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'paid', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }
    const transactions = await db.load('transactions');
    const transaction = transactions.find(t => t.id === req.params.id);
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    transaction.status = status;
    await db.save('transactions', transactions);
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const transactions = await db.load('transactions');
    const filtered = transactions.filter(t => t.id !== req.params.id);
    if (filtered.length === transactions.length) return res.status(404).json({ error: 'Transaction not found' });
    await db.save('transactions', filtered);
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ Reports ============
app.get('/api/reports/daily', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const appointments = await db.load('appointments');
    const transactions = await db.load('transactions');
    const dayAppts = appointments.filter(a => a.date === date);
    const dayTxns = transactions.filter(t => t.status === 'paid' && (t.createdAt || '').startsWith(date));
    const revenue = dayTxns.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    const services = await db.load('services');
    const serviceBreakdown = {};
    dayTxns.forEach(t => {
      (t.items || []).forEach(item => {
        serviceBreakdown[item.serviceName || item.serviceId] = (serviceBreakdown[item.serviceName || item.serviceId] || 0) + (item.price * (item.qty || 1));
      });
    });
    res.json({
      date,
      appointmentsCount: dayAppts.length,
      completedCount: dayAppts.filter(a => a.status === 'completed').length,
      revenue,
      transactionsCount: dayTxns.length,
      serviceBreakdown
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/monthly', async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const appointments = await db.load('appointments');
    const transactions = await db.load('transactions');
    const monthAppts = appointments.filter(a => a.date && a.date.startsWith(month));
    const monthTxns = transactions.filter(t => t.status === 'paid' && (t.createdAt || '').startsWith(month));
    const revenue = monthTxns.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    const dailyRevenue = {};
    monthTxns.forEach(t => {
      const day = (t.createdAt || '').split('T')[0];
      dailyRevenue[day] = (dailyRevenue[day] || 0) + (t.totalAmount || 0);
    });
    res.json({
      month,
      appointmentsCount: monthAppts.length,
      completedCount: monthAppts.filter(a => a.status === 'completed').length,
      revenue,
      transactionsCount: monthTxns.length,
      dailyRevenue
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/services', async (req, res) => {
  try {
    const transactions = await db.load('transactions');
    const ranking = {};
    transactions.filter(t => t.status === 'paid').forEach(t => {
      (t.items || []).forEach(item => {
        const key = item.serviceName || item.serviceId || 'unknown';
        if (!ranking[key]) ranking[key] = { name: key, count: 0, revenue: 0 };
        ranking[key].count += (item.qty || 1);
        ranking[key].revenue += (item.price * (item.qty || 1));
      });
    });
    const sorted = Object.values(ranking).sort((a, b) => b.count - a.count);
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/customers', async (req, res) => {
  try {
    const transactions = await db.load('transactions');
    const customersMap = {};
    transactions.filter(t => t.status === 'paid').forEach(t => {
      const key = t.customerId || 'unknown';
      if (!customersMap[key]) customersMap[key] = { customerId: key, visits: 0, totalSpent: 0 };
      customersMap[key].visits++;
      customersMap[key].totalSpent += (t.totalAmount || 0);
    });
    // Enrich with customer names
    const customers = await db.load('customers');
    const result = Object.values(customersMap).map(c => {
      const cust = customers.find(cu => cu.id === c.customerId);
      return { ...c, name: cust ? cust.name : c.customerId };
    }).sort((a, b) => b.totalSpent - a.totalSpent);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/technicians', async (req, res) => {
  try {
    const logs = await db.load('service_logs');
    const finishedLogs = logs.filter(l => l.isFinished);
    const techMap = {};
    finishedLogs.forEach(l => {
      const key = l.technicianId || 'unknown';
      if (!techMap[key]) techMap[key] = { technicianId: key, jobsDone: 0, totalSeconds: 0, revenue: 0 };
      techMap[key].jobsDone++;
      techMap[key].totalSeconds += (l.durationSeconds || 0);
    });
    // Enrich with tech names and calculate revenue from transactions
    const technicians = await db.load('technicians');
    const transactions = await db.load('transactions');
    const appointments = await db.load('appointments');

    // Build a map of appointmentId -> technicianId from logs
    const apptTechMap = {};
    finishedLogs.forEach(l => {
      apptTechMap[l.appointmentId] = l.technicianId;
    });

    // Calculate revenue from paid transactions linked to technicians via appointments
    transactions.filter(t => t.status === 'paid').forEach(txn => {
      if (txn.appointmentId && apptTechMap[txn.appointmentId]) {
        const techId = apptTechMap[txn.appointmentId];
        if (techMap[techId]) {
          techMap[techId].revenue += (txn.totalAmount || 0);
        }
      }
    });

    const result = Object.values(techMap).map(t => {
      const tech = technicians.find(tc => tc.techId === t.technicianId);
      return { ...t, name: tech ? tech.name : t.technicianId };
    }).sort((a, b) => b.jobsDone - a.jobsDone);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ LINE Webhook ============
if (lineBot) {
  app.post('/webhook/line', express.json(), (req, res) => {
    const events = req.body.events;
    if (events && events.length > 0) {
      Promise.all(events.map(event => lineBot.handleEvent(event)))
        .then(() => res.json({ status: 'ok' }))
        .catch(err => {
          console.error('LINE webhook error:', err);
          res.status(500).json({ error: err.message });
        });
    } else {
      res.json({ status: 'ok' });
    }
  });

  // Setup Rich Menu on startup
  lineBot.setupRichMenu();

  console.log('📱 LINE Bot webhook: /webhook/line');
}

// ============ Start Server ============
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`\n=====================================================`);
  console.log(`💅 NailReal Shop API running on:`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://192.168.1.82:${PORT}`);
  console.log(`📊 Database: JSON files in ./data/`);
  console.log(`🔧 Environment: ${NODE_ENV}`);
  console.log(`🚀 Ready to use!`);
  console.log(`=====================================================\n`);
});
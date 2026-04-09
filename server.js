const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
require('dotenv').config();

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
      'GET /api/customers',
      'POST /api/customers',
      'GET /api/appointments',
      'POST /api/appointments',
      'GET /api/services',
      'POST /api/services',
      'PUT /api/services/:id',
      'POST /api/services/:id/upload',
      'GET /api/technicians',
      'POST /api/technicians',
      'GET /api/logs/appointment/:appointmentId',
      'POST /api/employee/timer/start',
      'POST /api/employee/timer/stop',
      'GET /api/logs/recent'
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
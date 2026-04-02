# NailReal Shop 💅

**NailReal Shop** is an internal management system for nail salons, A modern, minimal web application for managing appointments, customers, and services.

## 🚀 Quick Start

### 1. Installation
```bash
cd ~/Desktop/AI_Project/NailReal_Shop
npm install
```

### 2. Run Server
```bash
# Development
npm start

# Production
npm run prod
```

### 3. Access
Open browser: **http://localhost:3000**

**Note:** Frontend UI is in Thai language (ภาษาไทย) for local nail salon use.

## 📊 API Endpoints

### 🔗 Services
- `GET /api/services` - Get all services
- `POST /api/services` - Add new service

### 👥 Customers
- `GET /api/customers` - Get all customers
- `POST /api/customers` - Add new customer

### 📅 Appointments
- `GET /api/appointments` - Get all appointments
- `POST /api/appointments` - Add new appointment

## 🌐 Deployment

### Option 1: PM2 (Recommended)
```bash
# Install PM2
npm install -g pm2

# Start
npm run pm2:start

# Stop
npm run pm2:stop

# Restart
npm run pm2:restart

# View logs
npm run pm2:logs
```

### Option 2: Docker
```bash
# Build
docker build -t nailreal-shop:latest .

# Run
docker run -d -p 3000:3000 nailreal-shop:latest

# Or use docker-compose
docker-compose up -d
```

## 📁 Project Structure

```
NailReal_Shop/
├── server.js          - Main server
├── db.js              - JSON database module
├── package.json       - Dependencies
├── PROJECT.md         - Project documentation (Thai)
├── README.md          - This file
├── deployment.md      - Deployment guide
├── .env.example       - Environment template
├── .env.production    - Production config
├── data/              - Database (JSON files)
│   ├── services.json
│   ├── customers.json
│   └── appointments.json
├── public/            - Frontend (Thai language)
│   ├── index.html
│   ├── style.css
│   └── app.js
└── logs/              - Logs (auto-created)
```

## ⚙️ Configuration

Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

Environment variables:
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production)
- `DB_PATH` - Database path (default: ./data)

## 💾 Backup

**Backup data:**
```bash
# Manual backup
tar -czf backup_$(date +%Y%m%d).tar.gz data/

# Auto backup (cron)
0 2 * * * tar -czf ~/backups/nailreal_$(date +\%Y\%m\%d).tar.gz ~/Desktop/AI_Project/NailReal_Shop/data/
```

## 🛡️ Security

### Production Checklist:
- [ ] Change default PORT
- [ ] Setup firewall (ufw)
- [ ] Disable root login
- [ ] Setup SSH keys
- [ ] Enable HTTPS (Let's Encrypt)
- [ ] Setup auto backup
- [ ] Setup monitoring

## 📞 Support

If issues occur:
1. Check logs: `npm run pm2:logs`
2. Check process: `pm2 status`
3. Restart: `npm run pm2:restart`
4. Check database: `ls -la data/`

## 📝 License

MIT License - Free for commercial use

---

**Built with 💅 for nail salons in Thailand**

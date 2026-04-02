# Deployment Guide - NailReal Shop

## 🚀 Deployment Options

### Option 1: PM2 (Recommended for VPS)

**1. ติดตั้ง PM2**
```bash
npm install -g pm2
```

**2. Deploy ไป server**
```bash
# Copy project ไป server
scp -r ~/Desktop/AI_Project/NailReal_Shop user@server:/var/www/

# SSH เข้า server
ssh user@server

# ติดตั้ง dependencies
cd /var/www/NailReal_Shop
npm install --production

# สร้าง data folder
mkdir -p /var/www/nailreal/data
chmod 755 /var/www/nailreal/data

# รันด้วย PM2
npm run pm2:start

# Auto-start on boot
pm2 startup
pm2 save
```

**3. Management commands**
```bash
npm run pm2:stop      # หยุด service
npm run pm2:restart   # restart service
npm run pm2:logs      # ดู logs
```

---

### Option 2: Docker

**1. Build image**
```bash
docker build -t nailreal-shop:latest .
```

**2. Run container**
```bash
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  --name nailreal \
  nailreal-shop:latest
```

**3. Docker Compose**
```bash
docker-compose up -d
```

---

### Option 3: Traditional Server (No PM2)

```bash
# ติดตั้ง
npm install --production

# รัน
NODE_ENV=production PORT=3000 node server.js
```

---

## 📦 Pre-deployment Checklist

- [ ] ตั้งค่า `.env` จาก `.env.example`
- [ ] สร้าง `/data` folder และ set permissions
- [ ] ตรวจสอบ PORT ไม่ชนกับ service อื่น
- [ ] Setup reverse proxy (nginx/Apache)
- [ ] Enable HTTPS (Let's Encrypt)
- [ ] Setup backup สำหรับ `/data` folder

---

## 🔧 Reverse Proxy (Nginx)

**nginx config:**
```nginx
server {
    listen 80;
    server_name nailreal.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔒 SSL (HTTPS)

**ใช้ Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d nailreal.com
```

---

## 💾 Backup Strategy

**Backup data folder:**
```bash
# Manual backup
tar -czf backup_$(date +%Y%m%d).tar.gz data/

# Auto backup (cron)
0 2 * * * tar -czf /backups/nailreal_$(date +\%Y\%m\%d).tar.gz /var/www/NailReal_Shop/data/
```

---

## 🌐 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3000 | Server port |
| NODE_ENV | development | Environment mode |
| DB_PATH | ./data | Database path |

---

## 📊 Monitoring

**PM2 Monitoring:**
```bash
pm2 monit
```

**Logs location:**
- Error: `./logs/err.log`
- Output: `./logs/out.log`

---

## 🔥 Production Checklist

- [ ] Enable firewall (ufw)
- [ ] Disable root login
- [ ] Setup SSH keys
- [ ] Enable HTTPS
- [ ] Configure backup
- [ ] Setup monitoring
- [ ] Test recovery procedure

---

## 📞 Support

หากมีปัญหาการ deploy:
1. ดู logs: `npm run pm2:logs`
2. ตรวจสอบ PORT: `lsof -i :3000`
3. ตรวจสอบ permissions: `ls -la data/`
4. รีสตาร์ท service: `npm run pm2:restart`

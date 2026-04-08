# Project Port Configuration

## 🚀 Port Configuration for NailReal_Shop

**Always use PORT=3000 for this project**

### Files that need PORT=3000:
- `.env` - Main environment configuration
- `.env.production` - Production environment
- `server.js` - Main server file (line 11)
- `ecosystem.config.js` - PM2 configuration (both env and env_production)

### Why PORT=3000?
- Prevents conflicts with other Node.js apps
- Consistent development environment
- Easy to remember and document

### Steps to ensure port is always 3000:
1. ✅ Create/verify `.env` file with `PORT=3000`
2. ✅ Update `server.js` to use PORT=3000 (already done)
3. ✅ Update ecosystem.config.js for both dev and prod
4. ✅ Document in this file for future reference

### How to verify port:
```bash
# Check running processes
lsof -i :3000

# Test API endpoint
curl http://localhost:3000/api/services
```

### If port is already in use:
- Change in `.env` temporarily (e.g., PORT=3001)
- Restart server: `npm start`
- Change back to 3000 when available

**Last Updated:** 2026-04-07 10:00 GMT+7  
**Project:** NailReal_Shop  
**Port:** Always 3000
# 🚀 Quick Start - Deploy Medical SWP to Render

## 📋 Checklist trước khi deploy

- [ ] ✅ Database PostgreSQL đã có trên Render
- [ ] ✅ Code đã push lên GitHub
- [ ] ✅ Các files deployment đã được tạo

## ⚡ Deploy Backend (5 phút)

### 1. Tạo Web Service
1. Vào [Render Dashboard](https://dashboard.render.com) → **New** → **Web Service**
2. Connect GitHub repository
3. Cấu hình:
   ```
   Name: medical-swp-backend
   Environment: Docker  
   Region: Oregon (US West)
   Branch: main
   Root Directory: backend
   Build Command: ./render-build.sh
   Start Command: ./render-start.sh
   ```

### 2. Environment Variables
Vào tab **Environment** và add:
```
DB_USERNAME=florism_db_user
DB_PASSWORD=kZ2vDOaXY9OK8rOw0KXVQy7k3Eel6iNp
JWT_SECRET=medical-swp-super-secret-jwt-key-2024-production
CORS_ORIGINS=https://medical-swp-frontend.onrender.com
```

### 3. Health Check
```
Health Check Path: /api/actuator/health
```

**Click Deploy!** 🚀

## ⚡ Deploy Frontend (3 phút)

### 1. Tạo Static Site  
1. **New** → **Static Site**
2. Same GitHub repository
3. Cấu hình:
   ```
   Name: medical-swp-frontend
   Branch: main
   Root Directory: frontend
   Build Command: npm run build
   Publish Directory: dist
   ```

### 2. Environment Variables
```
VITE_API_URL=https://medical-swp-backend.onrender.com/api
VITE_APP_NAME=Medical SWP
```

**Click Deploy!** 🚀

## 🔄 Cập nhật CORS (1 phút)

1. Sau khi frontend deploy xong, copy URL
2. Vào **Backend Service** → **Environment** 
3. Update `CORS_ORIGINS` với URL thật của frontend
4. Save → Auto redeploy

## 👤 Tạo Admin User (2 phút)

Option 1 - Script local:
```bash
./scripts/database-manager.sh
# Chọn 5 → Tạo admin
```

Option 2 - API call:
```bash
curl -X POST https://medical-swp-backend.onrender.com/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@medicalswp.com", 
    "password": "admin123",
    "fullName": "System Administrator",
    "role": "ADMIN"
  }'
```

## ✅ Test Deployment

1. **Backend Health**: https://medical-swp-backend.onrender.com/api/actuator/health
2. **Frontend**: https://medical-swp-frontend.onrender.com
3. **Login**: Sử dụng admin account vừa tạo

## 🎉 Done!

Your Medical SWP system is now live on Render!

**URLs:**
- 🌐 Frontend: https://medical-swp-frontend.onrender.com
- 🔧 Backend: https://medical-swp-backend.onrender.com
- 📊 Health Check: https://medical-swp-backend.onrender.com/api/actuator/health

---

**⚠️ Important Notes:**
- First startup có thể mất 2-3 phút
- Free tier services sleep after 15 minutes không activity
- Check logs trong Render dashboard nếu có lỗi 
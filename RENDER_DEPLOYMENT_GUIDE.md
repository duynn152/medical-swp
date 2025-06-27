# 🚀 Render Deployment Guide - Medical SWP

Hướng dẫn chi tiết deploy dự án **Medical SWP** lên Render.com

## 📋 Chuẩn bị trước khi deploy

### 1. ✅ Database đã sẵn sàng
- Database PostgreSQL đã có trên Render
- Host: `dpg-d1dqqlbipnbc73djckq0-a.oregon-postgres.render.com`
- Database: `florism_db`
- Username: `florism_db_user`

### 2. 📁 Files đã được tạo
- ✅ `backend/Dockerfile`
- ✅ `backend/render-build.sh`
- ✅ `backend/render-start.sh`
- ✅ `backend/environment-variables.md`
- ✅ `frontend/Dockerfile`
- ✅ `frontend/nginx.conf`
- ✅ `frontend/render-build.sh`
- ✅ `frontend/.env.production`

## 🔧 Bước 1: Deploy Backend (Spring Boot)

### 1.1 Tạo Web Service cho Backend

1. Vào **Render Dashboard** → **New** → **Web Service**
2. Connect GitHub repository của bạn
3. Chọn branch `main`
4. Cấu hình service:

```
Name: medical-swp-backend
Environment: Docker
Region: Oregon (US West)
Branch: main
Root Directory: backend
```

### 1.2 Cấu hình Build & Deploy

```
Build Command: ./render-build.sh
Start Command: ./render-start.sh
```

### 1.3 Environment Variables

Vào tab **Environment** và thêm các biến sau:

```
DB_USERNAME=florism_db_user
DB_PASSWORD=kZ2vDOaXY9OK8rOw0KXVQy7k3Eel6iNp
JWT_SECRET=medical-swp-super-secret-jwt-key-2024-production
JWT_EXPIRATION=86400000
CORS_ORIGINS=https://your-frontend-service.onrender.com
SHOW_SQL=false
```

### 1.4 Health Check

```
Health Check Path: /api/actuator/health
```

## 🌐 Bước 2: Deploy Frontend (React)

### 2.1 Tạo Static Site cho Frontend

1. Vào **Render Dashboard** → **New** → **Static Site**
2. Connect GitHub repository
3. Cấu hình:

```
Name: medical-swp-frontend
Branch: main
Root Directory: frontend
Build Command: npm run build
Publish Directory: dist
```

### 2.2 Environment Variables cho Frontend

```
VITE_API_URL=https://medical-swp-backend.onrender.com/api
VITE_APP_NAME=Medical SWP
VITE_NODE_ENV=production
```

### 2.3 Custom Headers (Optional)

Vào **Headers** tab:
```
/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
```

## 🔄 Bước 3: Cập nhật CORS

Sau khi deploy xong, cập nhật lại environment variable:

1. Vào **Backend Service** → **Environment**
2. Cập nhật `CORS_ORIGINS`:
```
CORS_ORIGINS=https://your-actual-frontend-domain.onrender.com
```
3. Save → Service sẽ tự động redeploy

## 🎯 Bước 4: Tạo Admin User

### 4.1 Sử dụng Database Manager Script

```bash
# Trên local, kết nối đến production database
./scripts/database-manager.sh
# Chọn option 5 để tạo admin
```

### 4.2 Hoặc sử dụng API trực tiếp

```bash
curl -X POST https://your-backend-service.onrender.com/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@medicalswp.com",
    "password": "admin123",
    "fullName": "System Administrator",
    "role": "ADMIN"
  }'
```

## 🌍 Bước 5: Cấu hình Custom Domain (Optional)

### 5.1 Frontend Domain

1. Vào **Frontend Service** → **Settings** → **Custom Domain**
2. Thêm domain: `medicalswp.com`
3. Cấu hình DNS:
```
Type: CNAME
Name: @
Target: your-frontend-service.onrender.com
```

### 5.2 Backend Domain  

1. Vào **Backend Service** → **Settings** → **Custom Domain**
2. Thêm domain: `api.medicalswp.com`
3. Cấu hình DNS:
```
Type: CNAME
Name: api
Target: your-backend-service.onrender.com
```

### 5.3 Cập nhật Environment Variables

Frontend:
```
VITE_API_URL=https://api.medicalswp.com/api
```

Backend:
```
CORS_ORIGINS=https://medicalswp.com
```

## 📊 Bước 6: Monitoring & Health Check

### 6.1 Health Check URLs

- **Backend**: `https://your-backend.onrender.com/api/actuator/health`
- **Frontend**: `https://your-frontend.onrender.com`

### 6.2 Log Monitoring

1. Vào **Service Dashboard** → **Events** tab
2. Xem build logs và runtime logs
3. Monitor performance metrics

## 🛠️ Troubleshooting

### Backend Build Failed
```bash
# Check build logs trong Render dashboard
# Common issues:
- Maven dependencies timeout
- Java version mismatch
- Database connection issues
```

### Frontend Build Failed
```bash
# Check node version compatibility
# Ensure all dependencies are in package.json
# Verify build command: npm run build
```

### Database Connection Issues
```bash
# Verify environment variables
# Check database status on Render
# Test connection with script:
./scripts/database-manager.sh
```

### CORS Issues
```bash
# Update CORS_ORIGINS environment variable
# Ensure frontend URL is correct
# Check browser developer tools for errors
```

## 🎉 Post-Deployment Checklist

- [ ] ✅ Backend service is healthy
- [ ] ✅ Frontend loads correctly  
- [ ] ✅ Database connection working
- [ ] ✅ Admin user created
- [ ] ✅ Login functionality works
- [ ] ✅ API endpoints responding
- [ ] ✅ File upload working
- [ ] ✅ Email service configured (optional)
- [ ] ✅ Custom domains configured (optional)

## 📞 Support

Nếu gặp vấn đề, kiểm tra:
1. **Render Service Logs**: Dashboard → Events
2. **Environment Variables**: Đảm bảo đúng format
3. **Database Status**: Kiểm tra database service health
4. **CORS Configuration**: Frontend-Backend communication

---

**🚀 Happy Deploying!** Your Medical SWP system will be live on Render! 
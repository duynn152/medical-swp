# Troubleshooting Guide

## Vấn đề đăng nhập không thành công

### Bước 1: Kiểm tra Backend chạy
```bash
curl http://localhost:8080/api/actuator/health
```

### Bước 2: Tạo Admin user trước
```bash
./scripts/create-admin.sh
```

### Bước 3: Test Login API
```bash
curl -X POST http://localhost:8080/api/auth/login \
-H "Content-Type: application/json" \
-d '{
  "usernameOrEmail": "admin",
  "password": "password123"
}'
```

### Bước 4: Kiểm tra browser console (F12)
Xem có lỗi CORS hoặc 404 không.

### Lỗi thường gặp:
1. **CORS Error**: Thêm origin frontend vào `application.yml`
2. **404 Error**: Kiểm tra endpoint có `/api` prefix
3. **No admin exists**: Chạy script tạo admin trước

### Quick restart:
```bash
docker-compose down
docker-compose up -d postgres
cd backend && mvn spring-boot:run
``` 
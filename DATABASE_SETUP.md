# Database Setup Guide

## Cấu trúc Database

Dự án Medical SWP sử dụng PostgreSQL với 4 role chính:

### User Roles
- **ADMIN**: Quản trị viên hệ thống
- **DOCTOR**: Bác sĩ
- **STAFF**: Nhân viên y tế  
- **PATIENT**: Bệnh nhân

### User Entity Fields
- `id`: Long (Primary Key)
- `username`: String (Unique)
- `email`: String (Unique) 
- `password`: String (BCrypt encoded)
- `fullName`: String (Không null)
- `birth`: LocalDate (Ngày sinh)
- `gender`: Enum (MALE, FEMALE, OTHER)
- `role`: Enum (ADMIN, DOCTOR, STAFF, PATIENT)
- `active`: Boolean (Mặc định true)
- `createdAt`: LocalDateTime (Tự động)
- `updatedAt`: LocalDateTime (Tự động)

## Hướng dẫn Setup

### 1. Khởi động Database
```bash
# Khởi động PostgreSQL container
docker-compose up -d postgres

# Kiểm tra container đang chạy
docker-compose ps
```

### 2. Khởi động Backend
```bash
cd backend
mvn spring-boot:run
```

Database sẽ tự động tạo bảng `users` khi ứng dụng khởi động lần đầu.

### 3. Tạo Admin Account đầu tiên

#### Option A: Sử dụng Script (Khuyến nghị)
```bash
# Linux/macOS
./scripts/create-admin.sh

# Windows PowerShell
.\scripts\create-admin.ps1
```

Script sẽ hướng dẫn bạn nhập thông tin và tự động tạo admin account.

#### Option B: Sử dụng API trực tiếp
```bash
curl -X POST http://localhost:8080/api/users \
-H "Content-Type: application/json" \
-d '{
  "username": "admin",
  "email": "admin@medical.com",
  "password": "your_secure_password",
  "fullName": "Quản trị viên",
  "birth": "1980-01-01",
  "gender": "MALE",
  "role": "ADMIN"
}'
```

### 4. Khởi động Frontend
```bash
cd frontend
npm install
npm run dev
```

### 5. Truy cập Database Management (Optional)
- URL: http://localhost:8081 (Adminer)
- Server: postgres
- Username: medical_user
- Password: medical_password
- Database: medical_db

## Admin Management Scripts

Trong thư mục `scripts/` có các công cụ hỗ trợ quản trị:

### create-admin.sh / create-admin.ps1
Script tạo admin account mới từ terminal với các tính năng:
- Kiểm tra backend connection tự động
- Validate input (email, password, date format)
- Interactive prompts với màu sắc
- Error handling và troubleshooting

**Xem thêm**: [scripts/README.md](scripts/README.md)

## Authentication System

### JWT Authentication
- Hệ thống sử dụng JWT (JSON Web Token) để authentication
- Token có thời hạn 24 giờ
- Token được lưu trong localStorage của browser

### Login Process
1. User nhập username/email và password
2. Backend validate thông tin và tạo JWT token
3. Frontend lưu token và thông tin user
4. Redirect user theo role của họ

## API Endpoints

### Authentication
- `POST /auth/login` - Đăng nhập
- `POST /auth/validate` - Validate token

### User Management (Cần authentication)
- `GET /api/users` - Lấy tất cả users
- `GET /api/users/{id}` - Lấy user theo ID
- `GET /api/users/role/{role}` - Lấy users theo role
- `GET /api/users/search?name={name}` - Tìm kiếm user theo tên
- `POST /api/users` - Tạo user mới
- `PUT /api/users/{id}` - Cập nhật user
- `DELETE /api/users/{id}` - Xóa user
- `PUT /api/users/{id}/deactivate` - Vô hiệu hóa user

### Example API Calls

#### Login
```bash
curl -X POST http://localhost:8080/auth/login \
-H "Content-Type: application/json" \
-d '{
  "usernameOrEmail": "admin@medical.com",
  "password": "your_password"
}'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": 1,
  "username": "admin",
  "email": "admin@medical.com",
  "fullName": "Quản trị viên",
  "role": "ADMIN"
}
```

#### Authenticated Request (với JWT token)
```bash
curl -X GET http://localhost:8080/api/users \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Lấy Users theo Role
```bash
curl -X GET http://localhost:8080/api/users/role/DOCTOR \
-H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Frontend Access

### URLs
- **Public Home**: http://localhost:5173/
- **Login Page**: http://localhost:5173/login  
- **Admin Dashboard**: http://localhost:5173/admin (cần login)

### Role-based Access
- Tất cả user sau khi login đều được redirect đến `/admin`
- Layout tự động hiển thị thông tin user đăng nhập
- Logout sẽ xóa token và redirect về login page

## Database Schema

Khi ứng dụng khởi động, Hibernate sẽ tự động tạo bảng:

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    birth DATE,
    gender VARCHAR(10),
    role VARCHAR(20) NOT NULL DEFAULT 'PATIENT',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## Security Features

- **Password Encryption**: Sử dụng BCrypt
- **JWT Security**: Tokens có expiration time
- **CORS Protection**: Chỉ allow origins được config
- **Route Protection**: Frontend tự động redirect nếu không authenticated
- **Role-based Authorization**: Backend kiểm tra role trong JWT

## Troubleshooting

### Authentication Issues
- Kiểm tra JWT token có valid không
- Xem console browser để debug API calls
- Kiểm tra localStorage có token không

### Docker Issues
- Đảm bảo Docker Desktop đang chạy
- Kiểm tra port 5432 không bị chiếm dụng: `lsof -i :5432`

### Database Connection Issues
- Kiểm tra PostgreSQL container: `docker-compose ps`
- Xem logs: `docker-compose logs postgres`
- Kiểm tra kết nối: `docker exec -it medical-postgres psql -U medical_user -d medical_db`

### Backend Issues  
- Kiểm tra Java version >= 17: `java -version`
- Đảm bảo database đã khởi động trước khi start backend
- Xem logs ứng dụng để debug connection issues

### Frontend Issues
- Kiểm tra Node.js version: `node -v`
- Clear browser localStorage nếu có vấn đề authentication
- Kiểm tra network tab trong browser devtools

### Script Issues
- **Permission denied**: `chmod +x scripts/create-admin.sh`
- **PowerShell execution policy**: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`
- **Backend not accessible**: Đảm bảo backend đang chạy trên port 8080 
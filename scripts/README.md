# Scripts - Admin Management Tools

Thư mục này chứa các script hỗ trợ quản trị viên thao tác với hệ thống Medical SWP từ terminal.

## Scripts có sẵn

### 1. create-admin.sh (Linux/macOS)
Script Bash để tạo admin account mới từ terminal.

#### Yêu cầu
- curl phải được cài đặt
- Backend server phải đang chạy trên http://localhost:8080
- Bash shell

#### Cách sử dụng
```bash
# Từ thư mục gốc của project
./scripts/create-admin.sh
```

#### Chức năng
- Kiểm tra kết nối backend tự động
- Validate email format
- Validate password length (tối thiểu 6 ký tự)
- Xác nhận password
- Validate ngày sinh theo format YYYY-MM-DD
- Hiển thị thông tin xác nhận trước khi tạo
- Tạo admin user qua API

### 2. create-admin.ps1 (Windows PowerShell)
Script PowerShell tương đương cho Windows users.

#### Yêu cầu
- PowerShell 5.0 hoặc cao hơn
- Backend server phải đang chạy trên http://localhost:8080

#### Cách sử dụng
```powershell
# Từ thư mục gốc của project (PowerShell)
.\scripts\create-admin.ps1
```

#### Cách sử dụng với custom backend URL
```powershell
.\scripts\create-admin.ps1 -BackendUrl "http://your-backend-url:8080"
```

## Hướng dẫn chi tiết

### Bước 1: Đảm bảo Backend đang chạy
```bash
# Khởi động database
docker-compose up -d postgres

# Khởi động backend
cd backend
mvn spring-boot:run
```

### Bước 2: Chạy script tạo admin
```bash
# Linux/macOS
./scripts/create-admin.sh

# Windows PowerShell
.\scripts\create-admin.ps1
```

### Bước 3: Nhập thông tin theo hướng dẫn
Script sẽ yêu cầu bạn nhập:
1. **Username**: Tên đăng nhập (không được trống)
2. **Email**: Địa chỉ email hợp lệ
3. **Password**: Mật khẩu (tối thiểu 6 ký tự)
4. **Confirm Password**: Xác nhận mật khẩu
5. **Full Name**: Họ và tên đầy đủ
6. **Birth Date**: Ngày sinh (format: YYYY-MM-DD)
7. **Gender**: Giới tính (1=MALE, 2=FEMALE, 3=OTHER)

### Ví dụ output thành công
```
========================================
    Medical SWP - Create Admin Tool     
========================================

Checking backend connection...
✓ Backend is running

Please provide the following information:

Username: admin
Email: admin@medical.com
Password: ******
Confirm Password: ******
Full Name: Quản trị viên hệ thống
Birth Date (YYYY-MM-DD): 1980-01-01
Gender:
1) MALE
2) FEMALE
3) OTHER
Select gender (1-3): 1

Creating admin user with the following details:
Username: admin
Email: admin@medical.com
Full Name: Quản trị viên hệ thống
Birth Date: 1980-01-01
Gender: MALE
Role: ADMIN

Continue? (y/N): y
Creating admin user...
✓ Admin user created successfully!
Username: admin
Email: admin@medical.com
Role: ADMIN
```

## Troubleshooting

### Backend không accessible
```
✗ Backend is not running or not accessible
Please make sure the backend server is running on http://localhost:8080
```
**Giải pháp**: Kiểm tra backend server đang chạy và accessible trên port 8080

### Email/Username đã tồn tại
```
✗ Failed to create admin user
HTTP Code: 400
```
**Giải pháp**: Sử dụng username và email khác chưa được đăng ký

### Permission denied (Linux/macOS)
```
bash: ./scripts/create-admin.sh: Permission denied
```
**Giải pháp**: 
```bash
chmod +x scripts/create-admin.sh
```

### PowerShell execution policy (Windows)
```
execution of scripts is disabled on this system
```
**Giải pháp**:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## API Endpoint được sử dụng

Scripts sử dụng endpoint sau:
- `POST /api/users` - Tạo user mới
- `GET /actuator/health` - Kiểm tra health của backend

## Security Notes

- Password được truyền qua HTTPS nếu backend sử dụng SSL
- Script không lưu trữ password ở đâu cả
- Chỉ tạo được user với role ADMIN
- Validate input để tránh injection attacks 
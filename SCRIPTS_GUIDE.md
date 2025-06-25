# 🛠️ Scripts Guide - Medical SWP

Hướng dẫn sử dụng 2 script chính của dự án Medical SWP.

## 📋 Tổng quan

Dự án được streamline thành 2 script chính:
1. **start-dev.sh** - Khởi động môi trường development
2. **database-manager.sh** - Quản lý database và tạo admin

## 🚀 1. Development Starter (`start-dev.sh`)

### Chức năng
- Khởi động cả backend và frontend cùng lúc
- Tự động kiểm tra và cài đặt dependencies
- Monitor services và tự động restart nếu cần
- Quản lý ports và cleanup khi thoát

### Cách sử dụng
```bash
# Khởi động development environment
./scripts/start-dev.sh

# Dừng services (từ terminal khác)
./scripts/stop-dev.sh

# Hoặc dùng Ctrl+C trong terminal đang chạy
```

### Services được khởi động
- **Backend**: Spring Boot trên port 8080
- **Frontend**: React + Vite trên port 5173

### Log files
- `backend.log` - Logs của Spring Boot
- `frontend.log` - Logs của Vite dev server

### URLs sau khi khởi động
- 📱 Frontend: http://localhost:5173
- 🔧 Backend: http://localhost:8080
- 📊 Health Check: http://localhost:8080/api/actuator/health

## 🗄️ 2. Database Manager (`database-manager.sh`)

### Chức năng
- Quản lý database PostgreSQL trên Render.com
- Tạo tài khoản admin user
- Backup và restore database
- Thống kê và monitoring
- Chạy custom SQL queries

### Menu chính
```
1) Test Connections (DB + Backend)
2) Show Database Info
3) Show Users
4) Show Statistics
5) Create Admin User
6) Backup Database
7) Clear All Data
8) Reset Database
9) Run Custom SQL
0) Exit
```

### Cách sử dụng

#### Tạo Admin User
```bash
./scripts/database-manager.sh
# Chọn option 5
# Nhập thông tin admin
```

#### Xem thống kê database
```bash
./scripts/database-manager.sh
# Chọn option 4
```

#### Backup database
```bash
./scripts/database-manager.sh
# Chọn option 6
# File backup: backup_YYYYMMDD_HHMMSS.sql
```

#### Clear data (giữ structure)
```bash
./scripts/database-manager.sh
# Chọn option 7
# Nhập "CLEAR" để xác nhận
```

#### Reset database (xóa tables)
```bash
./scripts/database-manager.sh
# Chọn option 8
# Nhập "RESET" để xác nhận
# Cần restart backend sau đó
```

## 🔄 Workflow Development

### 1. Khởi động dự án lần đầu
```bash
# 1. Khởi động development environment
./scripts/start-dev.sh

# 2. Tạo admin user (từ terminal khác)
./scripts/database-manager.sh
# Chọn option 5 và tạo admin
```

### 2. Development hàng ngày
```bash
# Khởi động
./scripts/start-dev.sh

# Dừng
Ctrl+C hoặc ./scripts/stop-dev.sh
```

### 3. Quản lý database
```bash
# Xem thông tin database
./scripts/database-manager.sh

# Backup trước khi thay đổi lớn
./scripts/database-manager.sh # option 6

# Reset database để test
./scripts/database-manager.sh # option 8
```

## ⚡ Quick Commands

```bash
# Khởi động nhanh
./scripts/start-dev.sh

# Dừng nhanh
./scripts/stop-dev.sh

# Tạo admin nhanh
./scripts/database-manager.sh
# → 5 → nhập thông tin

# Xem users hiện tại
./scripts/database-manager.sh
# → 3

# Backup nhanh
./scripts/database-manager.sh
# → 6
```

## 🔧 Yêu cầu hệ thống

### Dependencies
- **Java 17+** & **Maven** - Cho backend
- **Node.js 18+** & **npm** - Cho frontend
- **PostgreSQL Client Tools** - Cho database management
  ```bash
  # macOS
  brew install postgresql maven node
  
  # Ubuntu/Debian
  sudo apt install postgresql-client maven nodejs npm
  ```

### Ports sử dụng
- **8080** - Backend (Spring Boot)
- **5173** - Frontend (Vite)

## 📁 File Structure sau cleanup

```
medical-swp/
├── scripts/
│   ├── start-dev.sh          # Development starter
│   ├── stop-dev.sh           # Stop services
│   └── database-manager.sh   # Database & admin management
├── backend/                  # Spring Boot application
├── frontend/                 # React + Vite application
├── backend.log              # Backend logs (tạo khi chạy)
├── frontend.log             # Frontend logs (tạo khi chạy)
└── backup_*.sql             # Database backups (tạo khi backup)
```

## 🆘 Troubleshooting

### Port đã được sử dụng
```bash
# Script sẽ tự động phát hiện và hỏi có kill process không
# Hoặc dùng stop-dev.sh để dừng tất cả
./scripts/stop-dev.sh
```

### Backend không khởi động
```bash
# Kiểm tra backend.log
cat backend.log

# Kiểm tra database connection
./scripts/database-manager.sh
# → option 1
```

### Frontend không khởi động
```bash
# Kiểm tra frontend.log
cat frontend.log

# Cài lại dependencies
cd frontend && npm install
```

### Database connection failed
```bash
# Test connection
./scripts/database-manager.sh
# → option 1

# Kiểm tra network
ping dpg-d1dqqlbipnbc73djckq0-a.oregon-postgres.render.com
```

---

**💡 Tips**: 
- Luôn backup database trước khi thay đổi lớn
- Dùng `start-dev.sh` cho development hàng ngày
- Dùng `database-manager.sh` cho quản lý database và admin

**📞 Support**: Kiểm tra log files nếu gặp vấn đề 
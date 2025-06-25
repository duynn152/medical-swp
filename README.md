# 🏥 Medical SWP - Hệ thống Quản lý Y tế

Hệ thống quản lý y tế toàn diện với giao diện hiện đại, được xây dựng bằng **React + TypeScript** (Frontend) và **Spring Boot** (Backend).

## 📋 Mục lục

- [🚀 Tính năng chính](#-tính-năng-chính)
- [🏗️ Kiến trúc hệ thống](#️-kiến-trúc-hệ-thống)
- [⚡ Cài đặt nhanh](#-cài-đặt-nhanh)
- [📖 Hướng dẫn chi tiết](#-hướng-dẫn-chi-tiết)
- [🔐 Bảo mật](#-bảo-mật)
- [📊 Cơ sở dữ liệu](#-cơ-sở-dữ-liệu)
- [🐛 Xử lý sự cố](#-xử-lý-sự-cố)

## 🚀 Tính năng chính

### 👥 Quản lý Người dùng
- ✅ **CRUD Operations**: Tạo, xem, sửa, xóa người dùng
- ✅ **Role-based Access**: ADMIN, DOCTOR, STAFF, PATIENT
- ✅ **Bulk Actions**: Kích hoạt/vô hiệu hóa/xóa hàng loạt
- ✅ **Import Excel**: Nhập danh sách người dùng từ file Excel
- ✅ **Search & Filter**: Tìm kiếm và lọc theo role, status
- ✅ **Pagination**: Phân trang tự động

### 📝 Quản lý Blog
- ✅ **Tạo và chỉnh sửa**: Editor với Markdown support
- ✅ **Upload hình ảnh**: Drag & drop image upload
- ✅ **Public/Private**: Hiển thị blog công khai hoặc riêng tư
- ✅ **Categories**: Phân loại blog theo chủ đề

### 🔐 Xác thực & Phân quyền
- ✅ **JWT Authentication**: Bảo mật với JSON Web Token
- ✅ **Role-based Security**: Phân quyền theo vai trò
- ✅ **Password Encryption**: Mã hóa mật khẩu BCrypt
- ✅ **Admin Protection**: Bảo vệ tài khoản admin khỏi bị xóa/sửa

## 🏗️ Kiến trúc hệ thống

```
medical-swp/
├── 🌐 frontend/          # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/   # UI Components
│   │   ├── pages/        # Page Components
│   │   ├── contexts/     # React Contexts
│   │   └── utils/        # API Utils
│   └── public/           # Static files
├── ⚙️ backend/           # Spring Boot + JPA
│   └── src/main/java/com/medicalswp/
│       ├── controller/   # REST Controllers
│       ├── entity/       # JPA Entities
│       ├── repository/   # Data Repositories
│       ├── service/      # Business Logic
│       ├── config/       # Configuration
│       └── filter/       # Security Filters
├── 🗃️ database/          # Database Scripts
└── 📜 scripts/           # Utility Scripts
```

## ⚡ Cài đặt nhanh

### 📋 Yêu cầu hệ thống

- **Java**: 17+
- **Node.js**: 18+
- **Database**: H2 (embedded) hoặc PostgreSQL

### 🔧 Bước 1: Clone project

```bash
git clone https://github.com/your-repo/medical-swp.git
cd medical-swp
```

### 🔧 Bước 2: Chạy Backend

```bash
cd backend
./mvnw spring-boot:run
```

Backend sẽ chạy tại: http://localhost:8080

### 🔧 Bước 3: Chạy Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend sẽ chạy tại: http://localhost:5173

### 🔧 Bước 4: Tạo tài khoản Admin

```bash
# Windows
cd scripts
.\create-admin.ps1

# Linux/Mac
cd scripts
./create-admin.sh
```

## 📖 Hướng dẫn chi tiết

### 🎯 Đăng nhập

1. Mở trình duyệt và truy cập: http://localhost:5173
2. Sử dụng tài khoản admin đã tạo để đăng nhập
3. Hệ thống sẽ chuyển hướng đến dashboard chính

### 👥 Quản lý Users

**Truy cập**: Dashboard → Users Tab

**Chức năng chính**:
- **Xem danh sách**: Hiển thị tất cả users với thông tin cơ bản
- **Tìm kiếm**: Gõ tên, email hoặc username vào ô tìm kiếm
- **Lọc**: Chọn role (Admin/Doctor/Staff/Patient) và status (Active/Inactive)
- **Thêm user mới**: Click nút "Add User" → Điền form → Submit
- **Chỉnh sửa**: Click icon edit → Cập nhật thông tin → Save
- **Bulk actions**: Chọn nhiều users → Activate/Deactivate/Delete

**Import Excel**:
1. Click nút "Import Users"
2. Download template nếu cần
3. Upload file Excel (.xlsx)
4. Xem kết quả import và xử lý lỗi

### 📝 Quản lý Blogs

**Truy cập**: Dashboard → Blog Control Tab

**Tạo blog mới**:
1. Click "Create New Post"
2. Nhập title và content (hỗ trợ Markdown)
3. Upload featured image (nếu có)
4. Chọn public/private
5. Save draft hoặc Publish

**Chỉnh sửa blog**:
1. Click vào blog cần sửa
2. Cập nhật nội dung
3. Save changes

## 🔐 Bảo mật

### 🔑 JWT Authentication

- **Token expiry**: 24 giờ
- **Refresh**: Tự động refresh khi gần hết hạn
- **Storage**: localStorage (client-side)

### 🛡️ Role-based Access Control

| Role | Permissions |
|------|------------|
| **ADMIN** | Full access, quản lý users, blogs |
| **DOCTOR** | Xem/tạo blog, xem thông tin bệnh nhân |
| **STAFF** | Hỗ trợ admin, limited user management |
| **PATIENT** | Xem blog công khai, quản lý profile cá nhân |

### 🔒 Admin Protection

- **Không thể xóa** tài khoản ADMIN
- **Không thể chỉnh sửa** role của ADMIN user
- **Không thể bulk action** trên ADMIN users
- **Không thể import** ADMIN role từ Excel

## 📊 Cơ sở dữ liệu

### 🗃️ Database Schema

**Users Table**:
```sql
users (
  id BIGINT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  birth DATE,
  gender ENUM('MALE', 'FEMALE', 'OTHER'),
  role ENUM('ADMIN', 'DOCTOR', 'STAFF', 'PATIENT'),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

**Blog Posts Table**:
```sql
blog_posts (
  id BIGINT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  featured_image VARCHAR(500),
  public BOOLEAN DEFAULT FALSE,
  author_id BIGINT REFERENCES users(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### 🔧 Database Configuration

**H2 Database (Development)**:
```yaml
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: create-drop
```

**PostgreSQL (Production)**:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/medical_swp
    username: your_username
    password: your_password
  jpa:
    hibernate:
      ddl-auto: validate
```

## 🌐 API Endpoints

### 🔐 Authentication

```http
POST /api/auth/login
POST /api/auth/validate
```

### 👥 Users Management

```http
GET    /api/users                 # Lấy danh sách users
GET    /api/users/{id}            # Lấy user theo ID
GET    /api/users/role/{role}     # Lấy users theo role
GET    /api/users/search?name=... # Tìm kiếm user
POST   /api/users                 # Tạo user mới
PUT    /api/users/{id}            # Cập nhật user
DELETE /api/users/{id}            # Xóa user
PUT    /api/users/{id}/deactivate # Vô hiệu hóa user
POST   /api/users/import          # Import users từ Excel
```

### 📝 Blog Management

```http
GET    /api/blogs        # Lấy danh sách blogs (public)
GET    /api/admin/blogs  # Lấy tất cả blogs (admin)
GET    /api/blogs/{id}   # Lấy blog theo ID
POST   /api/blogs        # Tạo blog mới
PUT    /api/blogs/{id}   # Cập nhật blog
DELETE /api/blogs/{id}   # Xóa blog
```


The copyright belong to FPT University
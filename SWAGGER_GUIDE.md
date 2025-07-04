# Hướng dẫn sử dụng Swagger API Documentation

## Tổng quan

Swagger UI đã được tích hợp vào hệ thống Florism Care để giúp bạn dễ dàng theo dõi, test và hiểu các API endpoints.

## Truy cập Swagger UI

### 1. Khởi động Backend

Đảm bảo backend đang chạy:

```bash
cd backend
mvn spring-boot:run
```

Backend sẽ chạy trên port `8080` theo mặc định.

### 2. Truy cập Swagger UI

**Local Development:**
```
http://localhost:8080/api/swagger-ui.html
```

hoặc truy cập trực tiếp root path sẽ tự động redirect:
```
http://localhost:8080/api/
```

**Production (Render):**
```
https://florism.site/api
```

Khi truy cập `florism.site/api`, hệ thống sẽ tự động redirect tới Swagger UI.

### 3. Truy cập API Documentation JSON

**Local:**
```
http://localhost:8080/api/v3/api-docs
```

**Production:**
```
https://florism.site/api/v3/api-docs
```

## Các tính năng chính

### 1. **Browse APIs**
- Xem tất cả endpoints được nhóm theo tags (Authentication, Appointments, etc.)
- Đọc mô tả chi tiết cho từng endpoint
- Xem request/response schema

### 2. **Try it out**
- Test trực tiếp các API endpoints từ Swagger UI
- Nhập parameters và request body
- Xem response ngay lập tức

### 3. **Authentication**
- Sử dụng nút "Authorize" để nhập JWT token
- Format: `Bearer your_jwt_token_here`
- Sau khi authorize, có thể test các protected endpoints

## Hướng dẫn sử dụng từng bước

### Bước 1: Đăng nhập để lấy JWT Token

1. Tìm tag **Authentication**
2. Mở endpoint `POST /auth/login`
3. Click "Try it out"
4. Nhập thông tin đăng nhập:
   ```json
   {
     "usernameOrEmail": "admin@example.com",
     "password": "your_password"
   }
   ```
5. Click "Execute"
6. Copy JWT token từ response

### Bước 2: Authorize với JWT Token

1. Click nút **Authorize** ở đầu trang
2. Nhập token với format: `Bearer your_jwt_token_here`
3. Click "Authorize"
4. Click "Close"

### Bước 3: Test các API endpoints

Bây giờ bạn có thể test các protected endpoints:

- **Appointments**: Quản lý lịch hẹn
- **Users**: Quản lý người dùng  
- **Blogs**: Quản lý bài viết
- **Comments**: Quản lý bình luận

## Các API Tags

### 🔐 Authentication
- `POST /auth/login` - Đăng nhập hệ thống
- `POST /auth/validate` - Xác thực JWT token
- `POST /auth/create-first-admin` - Tạo admin đầu tiên
- `GET /auth/debug` - Debug thông tin xác thực

### 📅 Appointments  
- `POST /appointments/public` - Tạo lịch hẹn công khai (không cần đăng nhập)
- `GET /appointments/public/availability` - Kiểm tra khung giờ trống
- `GET /appointments` - Lấy tất cả lịch hẹn (Admin/Staff/Doctor)
- `GET /appointments/{id}` - Lấy lịch hẹn theo ID
- `PUT /appointments/{id}` - Cập nhật lịch hẹn
- `GET /appointments/stats` - Thống kê lịch hẹn

### 👥 Users (chưa thêm annotations)
- Quản lý người dùng, tài khoản

### 📝 Blogs (chưa thêm annotations)  
- Quản lý bài viết, tin tức

### 💬 Comments (chưa thêm annotations)
- Quản lý bình luận

## Ví dụ sử dụng

### 1. Tạo lịch hẹn công khai

```bash
curl -X POST "http://localhost:8080/api/appointments/public" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Nguyễn Văn A",
    "phone": "0123456789",
    "email": "nguyenvana@email.com",
    "appointmentDate": "2024-01-15",
    "appointmentTime": "09:00",
    "department": "REPRODUCTIVE_HEALTH",
    "reason": "Khám tổng quát"
  }'
```

### 2. Kiểm tra khung giờ trống

```bash
curl -X GET "http://localhost:8080/api/appointments/public/availability?date=2024-01-15&time=09:00&department=REPRODUCTIVE_HEALTH"
```

### 3. Lấy thống kê (cần JWT token)

```bash
curl -X GET "http://localhost:8080/api/appointments/stats" \
  -H "Authorization: Bearer your_jwt_token_here"
```

## Cấu hình Swagger

Cấu hình Swagger được đặt trong:

- **Backend Code**: `backend/src/main/java/com/medicalswp/config/OpenApiConfig.java`
- **Application Config**: `backend/src/main/resources/application.yml`

### Tùy chỉnh Swagger

Bạn có thể tùy chỉnh trong `application.yml`:

```yaml
springdoc:
  api-docs:
    enabled: true
    path: /api-docs
  swagger-ui:
    enabled: true
    path: /swagger-ui.html
    try-it-out-enabled: true
    operations-sorter: alpha
    tags-sorter: alpha
```

## Troubleshooting

### 1. Không truy cập được Swagger UI

- Kiểm tra backend có đang chạy không
- Đảm bảo truy cập đúng URL: `http://localhost:8080/api/swagger-ui.html`
- Kiểm tra port trong `application.yml`

### 2. Không thể test protected endpoints

- Đảm bảo đã authorize với JWT token hợp lệ
- Token phải có format: `Bearer your_token_here`
- Token không được hết hạn

### 3. CORS errors

- CORS đã được cấu hình cho Swagger UI
- Nếu vẫn lỗi, kiểm tra `SecurityConfig.java`

## Thêm Swagger cho controllers khác

Để thêm Swagger documentation cho controllers khác:

1. **Thêm annotations ở class level:**
```java
@Tag(name = "Controller Name", description = "Mô tả controller")
@RestController
public class YourController {
```

2. **Thêm annotations cho methods:**
```java
@Operation(summary = "Tóm tắt", description = "Mô tả chi tiết")
@ApiResponses(value = {
    @ApiResponse(responseCode = "200", description = "Thành công"),
    @ApiResponse(responseCode = "400", description = "Lỗi")
})
@GetMapping("/endpoint")
public ResponseEntity<?> yourMethod(
    @Parameter(description = "Mô tả parameter") @RequestParam String param
) {
    // Implementation
}
```

3. **Thêm security annotation nếu cần:**
```java
@Operation(
    summary = "Protected endpoint",
    security = @SecurityRequirement(name = "bearerAuth")
)
```

## Kết luận

Swagger UI giúp bạn:
- ✅ Hiểu rõ API structure
- ✅ Test API trực tiếp từ browser  
- ✅ Debug và troubleshoot
- ✅ Tài liệu hóa API automatically
- ✅ Chia sẻ API docs với team

Hãy sử dụng Swagger UI để khám phá và test các API của hệ thống Florism Care! 
# Tích hợp Cam kết Hoàn tiền khi Hủy Lịch hẹn

## Tổng quan
Khi hủy lịch hẹn có trạng thái `PAID` (đã thanh toán), email thông báo hủy cần bao gồm cam kết hoàn tiền cho bệnh nhân.

## Thay đổi API

### 1. Endpoint: `PUT /appointments/{id}/cancel`

**Request Body cũ:**
```json
{
  "reason": "Cancelled by staff"
}
```

**Request Body mới:**
```json
{
  "reason": "Cancelled by staff",
  "refundRequired": true,
  "patientStatus": "PAID"
}
```

**Các trường mới:**
- `refundRequired`: boolean - `true` nếu appointment có status = 'PAID'
- `patientStatus`: string - trạng thái appointment hiện tại để backend xử lý logic phù hợp

### 2. Logic Email Backend

#### Khi `refundRequired = true`:
```java
// Pseudocode
if (cancelRequest.getRefundRequired()) {
    emailContent = buildCancellationEmailWithRefund(appointment, cancelRequest.getReason());
} else {
    emailContent = buildStandardCancellationEmail(appointment, cancelRequest.getReason());
}
```

## Nội dung Email với Cam kết Hoàn tiền

### Template Email (Vietnamese):

```
Kính chào [Tên bệnh nhân],

Chúng tôi rất tiếc phải thông báo rằng lịch hẹn khám bệnh của bạn đã bị hủy.

📋 THÔNG TIN LỊCH HẸN ĐÃ HỦY:
- Mã số lịch hẹn: #[ID]
- Ngày khám: [Ngày]
- Giờ khám: [Giờ]
- Khoa khám: [Khoa]
- Lý do hủy: [Lý do]
- Số tiền đã thanh toán: [Số tiền] VNĐ

💰 CAM KẾT HOÀN TIỀN:
Vì bạn đã thanh toán cho lịch hẹn này, chúng tôi cam kết sẽ hoàn lại toàn bộ số tiền trong vòng 3-5 ngày làm việc.

🏦 QUY TRÌNH HOÀN TIỀN:
- Thời gian xử lý: 3-5 ngày làm việc
- Phương thức: Hoàn về tài khoản/phương thức thanh toán ban đầu
- Liên hệ hỗ trợ: 0123-456-789 (nếu có thắc mắc về hoàn tiền)

Chúng tôi sẽ liên hệ với bạn khi quá trình hoàn tiền hoàn tất.

📞 LIÊN HỆ LẠI:
Bạn có thể đặt lịch hẹn mới qua website hoặc liên hệ trực tiếp với chúng tôi.

Chúng tôi xin lỗi vì sự bất tiện này và mong được phục vụ bạn trong tương lai.

Trân trọng,
Phòng khám Y tế
```

## Frontend Changes

### 1. API Call Update
```typescript
// Old
await apiService.cancelAppointment(id, reason)

// New  
await apiService.cancelAppointment(id, reason, appointmentStatus)
```

### 2. UI Feedback
Frontend sẽ hiển thị thông báo khác nhau dựa trên việc có lịch hẹn đã thanh toán bị hủy:

```
"Đã hủy thành công 3 lịch hẹn và gửi email thông báo. 2 lịch hẹn đã thanh toán sẽ được hoàn tiền."
```

## Implementation Checklist

### Backend Tasks:
- [ ] Cập nhật `CancelAppointmentRequest` DTO với trường `refundRequired` và `patientStatus`
- [ ] Cập nhật logic trong `AppointmentController.cancelAppointment()`
- [ ] Tạo email template riêng cho trường hợp hoàn tiền
- [ ] Cập nhật `EmailService` để xử lý 2 loại email khác nhau
- [ ] Test các trường hợp:
  - Hủy lịch hẹn chưa thanh toán (email thường)
  - Hủy lịch hẹn đã thanh toán (email có cam kết hoàn tiền)

### Database (Optional):
- [ ] Có thể thêm bảng `refund_requests` để tracking việc hoàn tiền
- [ ] Log lại các email đã gửi với type = 'CANCELLATION_WITH_REFUND'

## Testing

### Test Cases:
1. **Hủy lịch hẹn PENDING**: Email thường, không có mention hoàn tiền
2. **Hủy lịch hẹn CONFIRMED**: Email thường, không có mention hoàn tiền  
3. **Hủy lịch hẹn PAID**: Email có section cam kết hoàn tiền
4. **Bulk cancel**: Mix của các trường hợp trên, UI hiển thị đúng thống kê

### Sample Request:
```bash
curl -X PUT /api/appointments/123/cancel \
-H "Authorization: Bearer [token]" \
-H "Content-Type: application/json" \
-d '{
  "reason": "Doctor unavailable",
  "refundRequired": true,
  "patientStatus": "PAID"
}'
```

## Tương lai

Có thể mở rộng để:
- Tích hợp với payment gateway để tự động hoàn tiền
- Tracking trạng thái hoàn tiền trong database
- SMS notification về hoàn tiền
- Dashboard để quản lý refund requests 
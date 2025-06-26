package com.medicalswp.service;

import com.medicalswp.entity.Appointment;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.format.DateTimeFormatter;

@Service
public class EmailService {
    
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    
    @Autowired
    private JavaMailSender mailSender;
    
    @Value("${spring.mail.username:medical-system@florismcare.com}")
    private String fromEmail;
    
    @Value("${app.name:Florism Care}")
    private String appName;
    
    @Value("${app.contact.phone:1900 1234}")
    private String contactPhone;
    
    @Value("${app.contact.email:contact@florismcare.com}")
    private String contactEmail;
    
    @Value("${app.contact.address:123 Đường ABC, Quận 1, TP.HCM}")
    private String contactAddress;
    
    /**
     * Gửi email xác nhận đặt lịch hẹn
     */
    public boolean sendAppointmentConfirmation(Appointment appointment) {
        try {
            logger.info("=== Attempting to send confirmation email to: {} ===", appointment.getEmail());
            
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(appointment.getEmail());
            helper.setSubject("✅ Xác nhận đặt lịch hẹn - " + appName);
            
            String htmlContent = buildConfirmationEmailContent(appointment);
            helper.setText(htmlContent, true);
            
            logger.info("=== Sending email via SMTP ===");
            mailSender.send(message);
            logger.info("=== Confirmation email sent successfully to: {} ===", appointment.getEmail());
            return true;
            
        } catch (MessagingException e) {
            logger.error("=== MessagingException when sending confirmation email to: {} ===", appointment.getEmail(), e);
            return false;
        } catch (Exception e) {
            logger.error("=== Unexpected error when sending confirmation email to: {} ===", appointment.getEmail(), e);
            return false;
        }
    }
    
    /**
     * Gửi email nhắc nhở trước ngày hẹn
     */
    public boolean sendAppointmentReminder(Appointment appointment) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(appointment.getEmail());
            helper.setSubject("🔔 Nhắc nhở lịch hẹn ngày mai - " + appName);
            
            String htmlContent = buildReminderEmailContent(appointment);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            logger.info("Reminder email sent successfully to: {}", appointment.getEmail());
            return true;
            
        } catch (MessagingException e) {
            logger.error("Failed to send reminder email to: {}", appointment.getEmail(), e);
            return false;
        }
    }
    
    /**
     * Gửi email hủy lịch hẹn
     */
    public boolean sendAppointmentCancellation(Appointment appointment, String reason) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(appointment.getEmail());
            helper.setSubject("❌ Thông báo hủy lịch hẹn - " + appName);
            
            String htmlContent = buildCancellationEmailContent(appointment, reason);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            logger.info("Cancellation email sent successfully to: {}", appointment.getEmail());
            return true;
            
        } catch (MessagingException e) {
            logger.error("Failed to send cancellation email to: {}", appointment.getEmail(), e);
            return false;
        }
    }
    
    /**
     * Gửi email simple (fallback)
     */
    public boolean sendSimpleEmail(String to, String subject, String content) {
        try {
            logger.info("=== Attempting to send simple email to: {} ===", to);
            logger.info("=== Email from: {} ===", fromEmail);
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(content);
            
            logger.info("=== Sending simple email via SMTP ===");
            mailSender.send(message);
            logger.info("=== Simple email sent successfully to: {} ===", to);
            return true;
            
        } catch (Exception e) {
            logger.error("=== Failed to send simple email to: {} ===", to, e);
            logger.error("=== Error details: {} ===", e.getMessage());
            return false;
        }
    }
    
    /**
     * Gửi email yêu cầu thanh toán
     */
    public boolean sendPaymentRequest(Appointment appointment) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(appointment.getEmail());
            helper.setSubject("💳 Yêu cầu thanh toán lịch hẹn - " + appName);
            
            String htmlContent = buildPaymentRequestEmailContent(appointment);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            logger.info("Payment request email sent successfully to: {}", appointment.getEmail());
            return true;
            
        } catch (MessagingException e) {
            logger.error("Failed to send payment request email to: {}", appointment.getEmail(), e);
            return false;
        }
    }
    
    private String buildConfirmationEmailContent(Appointment appointment) {
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
        
        return "<!DOCTYPE html>" +
        "<html><head><meta charset=\"UTF-8\"><style>" +
        "body{font-family:Arial,sans-serif;line-height:1.6;color:#333}" +
        ".container{max-width:600px;margin:0 auto;padding:20px}" +
        ".header{background:linear-gradient(135deg,#EC4899,#BE185D);color:white;padding:30px;text-align:center;border-radius:10px 10px 0 0}" +
        ".content{background:#fff;padding:30px;border:1px solid #e0e0e0}" +
        ".appointment-info{background:#f8f9fa;padding:20px;border-radius:8px;margin:20px 0}" +
        ".highlight{color:#EC4899;font-weight:bold}" +
        ".footer{background:#f8f9fa;padding:20px;text-align:center;border-radius:0 0 10px 10px;font-size:14px;color:#666}" +
        "</style></head><body>" +
        "<div class=\"container\"><div class=\"header\">" +
        "<h1>✅ Xác nhận đặt lịch hẹn</h1><p>" + appName + "</p></div>" +
        "<div class=\"content\"><p>Kính chào <strong>" + appointment.getFullName() + "</strong>,</p>" +
        "<p>Chúng tôi đã nhận được yêu cầu đặt lịch hẹn của bạn:</p>" +
        "<div class=\"appointment-info\"><h3>📅 Thông tin lịch hẹn</h3>" +
        "<p><strong>Mã lịch hẹn:</strong> <span class=\"highlight\">#" + appointment.getId() + "</span></p>" +
        "<p><strong>Ngày khám:</strong> <span class=\"highlight\">" + appointment.getAppointmentDate().format(dateFormatter) + "</span></p>" +
        "<p><strong>Giờ khám:</strong> <span class=\"highlight\">" + appointment.getAppointmentTime().format(timeFormatter) + "</span></p>" +
        "<p><strong>Khoa khám:</strong> " + appointment.getDepartment() + "</p>" +
        (appointment.getReason() != null && !appointment.getReason().isEmpty() ? 
            "<p><strong>Lý do khám:</strong> " + appointment.getReason() + "</p>" : "") +
        "</div><p><strong>Lưu ý:</strong> Vui lòng đến trước giờ hẹn 15 phút và mang theo CMND, thẻ BHYT.</p>" +
        "<p>Liên hệ: " + contactPhone + " | " + contactEmail + "</p>" +
        "<p>Trân trọng,<br><strong>" + appName + "</strong></p></div>" +
        "<div class=\"footer\"><p>" + contactAddress + "</p></div></div></body></html>";
    }
    
    private String buildReminderEmailContent(Appointment appointment) {
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
        
        return "<!DOCTYPE html>" +
        "<html><head><meta charset=\"UTF-8\"><style>" +
        "body{font-family:Arial,sans-serif;line-height:1.6;color:#333}" +
        ".container{max-width:600px;margin:0 auto;padding:20px}" +
        ".header{background:linear-gradient(135deg,#3B82F6,#1E40AF);color:white;padding:30px;text-align:center;border-radius:10px 10px 0 0}" +
        ".content{background:#fff;padding:30px;border:1px solid #e0e0e0}" +
        ".appointment-info{background:#eff6ff;padding:20px;border-radius:8px;margin:20px 0}" +
        ".highlight{color:#3B82F6;font-weight:bold}" +
        ".footer{background:#f8f9fa;padding:20px;text-align:center;border-radius:0 0 10px 10px;font-size:14px;color:#666}" +
        "</style></head><body>" +
        "<div class=\"container\"><div class=\"header\">" +
        "<h1>🔔 Nhắc nhở lịch hẹn</h1><p>" + appName + "</p></div>" +
        "<div class=\"content\"><p>Kính chào <strong>" + appointment.getFullName() + "</strong>,</p>" +
        "<p>Lịch hẹn của bạn sẽ diễn ra vào <strong>ngày mai</strong>:</p>" +
        "<div class=\"appointment-info\"><h3>📅 Thông tin lịch hẹn</h3>" +
        "<p><strong>Mã lịch hẹn:</strong> <span class=\"highlight\">#" + appointment.getId() + "</span></p>" +
        "<p><strong>Ngày khám:</strong> <span class=\"highlight\">" + appointment.getAppointmentDate().format(dateFormatter) + "</span></p>" +
        "<p><strong>Giờ khám:</strong> <span class=\"highlight\">" + appointment.getAppointmentTime().format(timeFormatter) + "</span></p>" +
        "<p><strong>Khoa khám:</strong> " + appointment.getDepartment() + "</p>" +
        "</div><p><strong>Chuẩn bị:</strong> Đến trước 15 phút, mang CMND và thẻ BHYT.</p>" +
        "<p>Hủy lịch: " + contactPhone + " | " + contactEmail + "</p>" +
        "<p>Trân trọng,<br><strong>" + appName + "</strong></p></div>" +
        "<div class=\"footer\"><p>" + contactAddress + "</p></div></div></body></html>";
    }
    
    private String buildCancellationEmailContent(Appointment appointment, String reason) {
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
        
        return "<!DOCTYPE html>" +
        "<html><head><meta charset=\"UTF-8\"><style>" +
        "body{font-family:Arial,sans-serif;line-height:1.6;color:#333}" +
        ".container{max-width:600px;margin:0 auto;padding:20px}" +
        ".header{background:linear-gradient(135deg,#DC2626,#991B1B);color:white;padding:30px;text-align:center;border-radius:10px 10px 0 0}" +
        ".content{background:#fff;padding:30px;border:1px solid #e0e0e0}" +
        ".appointment-info{background:#fef2f2;padding:20px;border-radius:8px;margin:20px 0}" +
        ".footer{background:#f8f9fa;padding:20px;text-align:center;border-radius:0 0 10px 10px;font-size:14px;color:#666}" +
        "</style></head><body>" +
        "<div class=\"container\"><div class=\"header\">" +
        "<h1>❌ Thông báo hủy lịch hẹn</h1><p>" + appName + "</p></div>" +
        "<div class=\"content\"><p>Kính chào <strong>" + appointment.getFullName() + "</strong>,</p>" +
        "<p>Lịch hẹn của bạn đã được hủy:</p>" +
        "<div class=\"appointment-info\"><h3>📅 Lịch hẹn đã hủy</h3>" +
        "<p><strong>Mã:</strong> #" + appointment.getId() + "</p>" +
        "<p><strong>Ngày:</strong> " + appointment.getAppointmentDate().format(dateFormatter) + "</p>" +
        "<p><strong>Giờ:</strong> " + appointment.getAppointmentTime().format(timeFormatter) + "</p>" +
        "<p><strong>Khoa:</strong> " + appointment.getDepartment() + "</p>" +
        (reason != null && !reason.isEmpty() ? "<p><strong>Lý do:</strong> " + reason + "</p>" : "") +
        "</div><p>Đặt lịch mới: " + contactPhone + " | " + contactEmail + "</p>" +
        "<p>Trân trọng,<br><strong>" + appName + "</strong></p></div>" +
        "<div class=\"footer\"><p>" + contactAddress + "</p></div></div></body></html>";
    }
    
    private String buildPaymentRequestEmailContent(Appointment appointment) {
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
        
        return "<!DOCTYPE html>" +
        "<html><head><meta charset=\"UTF-8\"><style>" +
        "body{font-family:Arial,sans-serif;line-height:1.6;color:#333}" +
        ".container{max-width:600px;margin:0 auto;padding:20px}" +
        ".header{background:linear-gradient(135deg,#F59E0B,#D97706);color:white;padding:30px;text-align:center;border-radius:10px 10px 0 0}" +
        ".content{background:#fff;padding:30px;border:1px solid #e0e0e0}" +
        ".appointment-info{background:#fef3c7;padding:20px;border-radius:8px;margin:20px 0}" +
        ".highlight{color:#F59E0B;font-weight:bold}" +
        ".payment-info{background:#fff7ed;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #F59E0B}" +
        ".footer{background:#f8f9fa;padding:20px;text-align:center;border-radius:0 0 10px 10px;font-size:14px;color:#666}" +
        "</style></head><body>" +
        "<div class=\"container\"><div class=\"header\">" +
        "<h1>💳 Yêu cầu thanh toán</h1><p>" + appName + "</p></div>" +
        "<div class=\"content\"><p>Kính chào <strong>" + appointment.getFullName() + "</strong>,</p>" +
        "<p>Lịch hẹn của bạn đã được xác nhận và cần thanh toán để hoàn tất quá trình đặt lịch:</p>" +
        "<div class=\"appointment-info\"><h3>📅 Thông tin lịch hẹn</h3>" +
        "<p><strong>Mã lịch hẹn:</strong> <span class=\"highlight\">#" + appointment.getId() + "</span></p>" +
        "<p><strong>Ngày khám:</strong> <span class=\"highlight\">" + appointment.getAppointmentDate().format(dateFormatter) + "</span></p>" +
        "<p><strong>Giờ khám:</strong> <span class=\"highlight\">" + appointment.getAppointmentTime().format(timeFormatter) + "</span></p>" +
        "<p><strong>Khoa khám:</strong> " + appointment.getDepartment().getDepartmentName() + "</p>" +
        (appointment.getDoctor() != null ? 
            "<p><strong>Bác sĩ phụ trách:</strong> " + appointment.getDoctor().getFullName() + "</p>" : "") +
        "</div>" +
        "<div class=\"payment-info\"><h3>💰 Thông tin thanh toán</h3>" +
        "<p><strong>Phí khám:</strong> <span class=\"highlight\">" + 
        String.format("%,.0f VNĐ", appointment.getPaymentAmount() != null ? appointment.getPaymentAmount() : 500000.0) + 
        "</span></p>" +
        "<p><strong>Hình thức thanh toán:</strong></p>" +
        "<ul>" +
        "<li>Tiền mặt tại quầy lễ tân</li>" +
        "<li>Chuyển khoản: <strong>1234567890 - Ngân hàng ABC</strong></li>" +
        "<li>Thanh toán qua ứng dụng ngân hàng</li>" +
        "</ul>" +
        "<p><strong>Nội dung chuyển khoản:</strong> <span class=\"highlight\">THANHTOAN #" + appointment.getId() + " " + appointment.getFullName() + "</span></p>" +
        "</div>" +
        "<p><strong>Lưu ý:</strong> Vui lòng thanh toán trước 24 giờ so với giờ hẹn. Sau khi thanh toán, vui lòng giữ biên lai để xuất trình khi đến khám.</p>" +
        "<p>Liên hệ hỗ trợ: " + contactPhone + " | " + contactEmail + "</p>" +
        "<p>Trân trọng,<br><strong>" + appName + "</strong></p></div>" +
        "<div class=\"footer\"><p>" + contactAddress + "</p></div></div></body></html>";
    }
} 
package com.medicalswp.controller;

import com.medicalswp.entity.Appointment;
import com.medicalswp.entity.User;
import com.medicalswp.repository.UserRepository;
import com.medicalswp.repository.AppointmentRepository;
import com.medicalswp.service.AppointmentService;
import com.medicalswp.service.AppointmentService.AppointmentStats;
import com.medicalswp.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/appointments")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "http://localhost:3001", "https://your-frontend-domain.com"})
public class AppointmentController {
    
    private static final Logger logger = LoggerFactory.getLogger(AppointmentController.class);
    
    @Autowired
    private AppointmentService appointmentService;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private AppointmentRepository appointmentRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    /**
     * PUBLIC: Create appointment (no authentication required)
     * This endpoint will automatically send confirmation email
     */
    @PostMapping("/public")
    public ResponseEntity<?> createPublicAppointment(@Valid @RequestBody CreateAppointmentRequest request) {
        try {
            logger.info("=== Creating public appointment ===");
            logger.info("Request data: fullName={}, email={}, date={}, time={}, department={}", 
                    request.getFullName(), 
                    request.getEmail(), 
                    request.getAppointmentDate(), 
                    request.getAppointmentTime(), 
                    request.getDepartment());
            
            // Convert request to Appointment entity
            Appointment appointment = new Appointment();
            appointment.setFullName(request.getFullName());
            appointment.setPhone(request.getPhone());
            appointment.setEmail(request.getEmail());
            appointment.setAppointmentDate(LocalDate.parse(request.getAppointmentDate()));
            appointment.setAppointmentTime(LocalTime.parse(request.getAppointmentTime()));
            appointment.setReason(request.getReason());
            
            // Convert department string to enum
            try {
                Appointment.Department department = Appointment.Department.valueOf(request.getDepartment());
                appointment.setDepartment(department);
            } catch (IllegalArgumentException e) {
                // If department code is invalid, try to find by department name
                Appointment.Department department = null;
                for (Appointment.Department dept : Appointment.Department.values()) {
                    if (dept.getDepartmentName().equals(request.getDepartment())) {
                        department = dept;
                        break;
                    }
                }
                if (department == null) {
                    throw new IllegalArgumentException("Invalid department: " + request.getDepartment());
                }
                appointment.setDepartment(department);
            }
            
            Appointment savedAppointment = appointmentService.createAppointment(appointment);
            
            Map<String, Object> response = new HashMap<>();
            response.put("appointmentId", savedAppointment.getId());
            response.put("message", "Đặt lịch hẹn thành công! Mã lịch hẹn: #" + savedAppointment.getId());
            response.put("appointment", savedAppointment);
            
            logger.info("=== Public appointment created successfully with ID: {} ===", savedAppointment.getId());
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            logger.error("Failed to create appointment - IllegalArgumentException: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            logger.error("=== Unexpected error creating appointment ===", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Có lỗi xảy ra trong quá trình đặt lịch. Vui lòng thử lại sau. Chi tiết: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * PUBLIC: Check time slot availability
     */
    @GetMapping("/public/availability")
    public ResponseEntity<?> checkTimeSlotAvailability(
            @RequestParam String date,
            @RequestParam String time,
            @RequestParam String department) {
        try {
            logger.info("=== Checking availability for date={}, time={}, department={} ===", date, time, department);
            
            // Validate input parameters
            if (date == null || date.trim().isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Ngày khám không được để trống");
                return ResponseEntity.badRequest().body(error);
            }
            
            if (time == null || time.trim().isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Giờ khám không được để trống");
                return ResponseEntity.badRequest().body(error);
            }
            
            if (department == null || department.trim().isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Khoa khám không được để trống");
                return ResponseEntity.badRequest().body(error);
            }
            
            LocalDate appointmentDate;
            LocalTime appointmentTime;
            
            try {
                appointmentDate = LocalDate.parse(date);
                appointmentTime = LocalTime.parse(time);
            } catch (Exception parseException) {
                logger.error("=== Date/Time parsing error: date={}, time={} ===", date, time, parseException);
                Map<String, String> error = new HashMap<>();
                error.put("error", "Định dạng ngày hoặc giờ không đúng. Ngày: YYYY-MM-DD, Giờ: HH:MM");
                return ResponseEntity.badRequest().body(error);
            }
            
            // Check if date is not in the past
            if (appointmentDate.isBefore(LocalDate.now())) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Không thể đặt lịch hẹn cho ngày đã qua");
                return ResponseEntity.badRequest().body(error);
            }
            
            // Convert department string to enum for availability check
            Appointment.Department departmentEnum = null;
            try {
                departmentEnum = Appointment.Department.valueOf(department);
            } catch (IllegalArgumentException e) {
                // Try to find by department name
                for (Appointment.Department dept : Appointment.Department.values()) {
                    if (dept.getDepartmentName().equals(department)) {
                        departmentEnum = dept;
                        break;
                    }
                }
                if (departmentEnum == null) {
                    Map<String, String> error = new HashMap<>();
                    error.put("error", "Invalid department: " + department);
                    return ResponseEntity.badRequest().body(error);
                }
            }
            
            boolean available = appointmentService.isTimeSlotAvailable(appointmentDate, appointmentTime, departmentEnum);
            
            Map<String, Object> response = new HashMap<>();
            response.put("available", available);
            response.put("message", available ? "Khung giờ này còn trống" : "Khung giờ này đã đầy. Vui lòng chọn giờ khác.");
            
            logger.info("=== Availability check result: {} ===", available);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("=== Error checking availability ===", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Không thể kiểm tra lịch trống: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * ADMIN: Get all appointments
     */
    @GetMapping
    // @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR') or hasRole('STAFF')")
    public ResponseEntity<List<Appointment>> getAllAppointments() {
        try {
            List<Appointment> appointments = appointmentService.getAllAppointments();
            return ResponseEntity.ok(appointments);
        } catch (Exception e) {
            logger.error("Error fetching all appointments", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * ADMIN: Get appointment by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR') or hasRole('STAFF')")
    public ResponseEntity<?> getAppointmentById(@PathVariable Long id) {
        try {
            Optional<Appointment> appointment = appointmentService.getAppointmentById(id);
            if (appointment.isPresent()) {
                return ResponseEntity.ok(appointment.get());
            } else {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Không tìm thấy lịch hẹn với ID: " + id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.error("Error fetching appointment by ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * ADMIN: Update appointment
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR') or hasRole('STAFF')")
    public ResponseEntity<?> updateAppointment(@PathVariable Long id, @RequestBody Appointment appointmentDetails) {
        try {
            Appointment updatedAppointment = appointmentService.updateAppointment(id, appointmentDetails);
            return ResponseEntity.ok(updatedAppointment);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            logger.error("Error updating appointment: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * ADMIN: Confirm appointment
     */
    @PutMapping("/{id}/confirm")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR') or hasRole('STAFF')")
    public ResponseEntity<?> confirmAppointment(@PathVariable Long id) {
        try {
            // Get appointment first
            Optional<Appointment> appointmentOpt = appointmentService.getAppointmentById(id);
            if (!appointmentOpt.isPresent()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Appointment not found with ID: " + id);
                return ResponseEntity.notFound().build();
            }
            
            Appointment appointment = appointmentOpt.get();
            
            // Confirm the appointment
            Appointment confirmedAppointment = appointmentService.confirmAppointment(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Lịch hẹn đã được xác nhận");
            response.put("appointment", confirmedAppointment);
            
            // Auto-create patient account if email is provided and account doesn't exist
            String email = appointment.getEmail();
            if (email != null && !email.trim().isEmpty()) {
                if (!userRepository.existsByEmail(email)) {
                    try {
                        // Create new patient account
                        User newPatient = new User();
                        newPatient.setUsername(email);
                        newPatient.setEmail(email);
                        newPatient.setFullName(appointment.getFullName());
                        newPatient.setPassword(passwordEncoder.encode("123456"));
                        newPatient.setRole(User.Role.PATIENT);
                        newPatient.setActive(true);
                        
                        User savedPatient = userRepository.save(newPatient);
                        
                        response.put("patientAccountCreated", true);
                        response.put("patientAccount", Map.of(
                            "username", savedPatient.getUsername(),
                            "temporaryPassword", "123456",
                            "message", "Tài khoản bệnh nhân đã được tạo tự động"
                        ));
                        
                        logger.info("=== Patient account auto-created when confirming appointment: {} for email: {} ===", id, email);
                        
                        // Send welcome email with login credentials
                        try {
                            String emailContent = String.format(
                                "Chào %s,\n\n" +
                                "Lịch hẹn của bạn tại Florism Care đã được xác nhận.\n\n" +
                                "Tài khoản của bạn đã được tạo tự động:\n" +
                                "- Username: %s\n" +
                                "- Password: 123456\n\n" +
                                "Vui lòng đăng nhập tại website để theo dõi lịch hẹn và thay đổi mật khẩu.\n\n" +
                                "Thông tin lịch hẹn:\n" +
                                "- Ngày: %s\n" +
                                "- Giờ: %s\n" +
                                "- Khoa: %s\n\n" +
                                "Trân trọng,\nFlorism Care Team",
                                appointment.getFullName(), 
                                email,
                                appointment.getAppointmentDate(),
                                appointment.getAppointmentTime(),
                                appointment.getDepartment().getDepartmentName()
                            );
                            
                            emailService.sendSimpleEmail(
                                email,
                                "Xác nhận lịch hẹn & Tài khoản Florism Care",
                                emailContent
                            );
                        } catch (Exception emailError) {
                            logger.error("Failed to send confirmation email to: {}", email, emailError);
                        }
                        
                    } catch (Exception e) {
                        logger.error("Error creating patient account when confirming appointment: {} for email: {}", id, email, e);
                        response.put("patientAccountCreated", false);
                        response.put("patientAccountError", "Có lỗi khi tạo tài khoản bệnh nhân: " + e.getMessage());
                    }
                } else {
                    response.put("patientAccountCreated", false);
                    response.put("patientAccountMessage", "Tài khoản với email này đã tồn tại");
                }
            } else {
                response.put("patientAccountCreated", false);
                response.put("patientAccountMessage", "Không có email để tạo tài khoản");
            }
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            logger.error("Error confirming appointment: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * ADMIN: Confirm appointment with doctor assignment
     */
    @PutMapping("/{id}/confirm-with-doctor")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR') or hasRole('STAFF')")
    public ResponseEntity<?> confirmAppointmentWithDoctor(@PathVariable Long id, @RequestBody Map<String, Long> request) {
        try {
            Long doctorId = request.get("doctorId");
            if (doctorId == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Doctor ID is required");
                return ResponseEntity.badRequest().body(error);
            }
            
            Appointment confirmedAppointment = appointmentService.confirmAppointmentWithDoctor(id, doctorId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Lịch hẹn đã được xác nhận và chỉ định bác sĩ");
            response.put("appointment", confirmedAppointment);
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            logger.error("Error confirming appointment with doctor: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * ADMIN: Cancel appointment
     */
    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR') or hasRole('STAFF')")
    public ResponseEntity<?> cancelAppointment(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String reason = request.getOrDefault("reason", "Cancelled by staff");
            Appointment cancelledAppointment = appointmentService.cancelAppointment(id, reason);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Lịch hẹn đã được hủy");
            response.put("appointment", cancelledAppointment);
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            logger.error("Error cancelling appointment: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * ADMIN: Delete appointment
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteAppointment(@PathVariable Long id) {
        try {
            Optional<Appointment> appointment = appointmentService.getAppointmentById(id);
            if (appointment.isPresent()) {
                // Actually delete the appointment
                appointmentService.deleteAppointment(id);
                Map<String, String> response = new HashMap<>();
                response.put("message", "Appointment deleted successfully");
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.error("Error deleting appointment: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * ADMIN: Get appointments by status
     */
    @GetMapping("/status/{status}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR') or hasRole('STAFF')")
    public ResponseEntity<?> getAppointmentsByStatus(@PathVariable String status) {
        try {
            Appointment.AppointmentStatus appointmentStatus = Appointment.AppointmentStatus.valueOf(status.toUpperCase());
            List<Appointment> appointments = appointmentService.getAppointmentsByStatus(appointmentStatus);
            return ResponseEntity.ok(appointments);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Invalid status: " + status);
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            logger.error("Error fetching appointments by status: {}", status, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * ADMIN: Get today's appointments
     */
    @GetMapping("/today")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR') or hasRole('STAFF')")
    public ResponseEntity<List<Appointment>> getTodaysAppointments() {
        try {
            List<Appointment> appointments = appointmentService.getTodaysAppointments();
            return ResponseEntity.ok(appointments);
        } catch (Exception e) {
            logger.error("Error fetching today's appointments", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * ADMIN: Get upcoming appointments (next 7 days)
     */
    @GetMapping("/upcoming")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR') or hasRole('STAFF')")
    public ResponseEntity<List<Appointment>> getUpcomingAppointments() {
        try {
            List<Appointment> appointments = appointmentService.getUpcomingAppointments();
            return ResponseEntity.ok(appointments);
        } catch (Exception e) {
            logger.error("Error fetching upcoming appointments", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * ADMIN: Search appointments
     */
    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR') or hasRole('STAFF')")
    public ResponseEntity<List<Appointment>> searchAppointments(@RequestParam(required = false) String q) {
        try {
            List<Appointment> appointments = appointmentService.searchAppointments(q);
            return ResponseEntity.ok(appointments);
        } catch (Exception e) {
            logger.error("Error searching appointments", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * ADMIN: Get appointment statistics
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR') or hasRole('STAFF')")
    public ResponseEntity<?> getAppointmentStats() {
        try {
            AppointmentStats stats = appointmentService.getAppointmentStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            logger.error("Error fetching appointment statistics", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * PUBLIC: Test email configuration
     */
    @PostMapping("/public/test-email")
    public ResponseEntity<?> testEmail(@RequestBody Map<String, String> request) {
        try {
            String testEmail = request.get("email");
            if (testEmail == null || testEmail.trim().isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Email address is required");
                return ResponseEntity.badRequest().body(error);
            }
            
            logger.info("=== Testing email functionality to: {} ===", testEmail);
            
            boolean sent = emailService.sendSimpleEmail(
                testEmail, 
                "Test Email - Medical SWP System", 
                "Đây là email test từ hệ thống Medical SWP. Nếu bạn nhận được email này, cấu hình email đã hoạt động đúng."
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", sent);
            response.put("message", sent ? "Email test đã được gửi thành công!" : "Gửi email test thất bại");
            
            logger.info("=== Email test result: {} ===", sent);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("=== Error testing email ===", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Lỗi khi test email: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * PUBLIC: Get all available departments
     */
    @GetMapping("/public/departments")
    public ResponseEntity<?> getAllDepartments() {
        try {
            List<DepartmentInfo> departments = new ArrayList<>();
            for (Appointment.Department dept : Appointment.Department.values()) {
                departments.add(new DepartmentInfo(dept.name(), dept.getDepartmentName(), dept.getSpecialtyName()));
            }
            return ResponseEntity.ok(departments);
        } catch (Exception e) {
            logger.error("Error fetching departments", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * ADMIN: Request payment for appointment
     */
    @PutMapping("/{id}/request-payment")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<?> requestPayment(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            Double amount = null;
            if (request.containsKey("amount")) {
                amount = Double.valueOf(request.get("amount").toString());
            }
            
            Appointment appointmentWithPaymentRequest = appointmentService.requestPayment(id, amount);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Yêu cầu thanh toán đã được gửi/cập nhật");
            response.put("appointment", appointmentWithPaymentRequest);
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            logger.error("Error requesting payment for appointment: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * DOCTOR: Get appointments for current doctor's patients
     */
    @GetMapping("/my-patients")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<Appointment>> getMyPatientsAppointments(Authentication authentication) {
        try {
            String username = authentication.getName();
            List<Appointment> appointments = appointmentService.getAppointmentsByDoctorUsername(username);
            return ResponseEntity.ok(appointments);
        } catch (Exception e) {
            logger.error("Error fetching doctor's patient appointments", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * ADMIN: Handle successful payment and automatically create a patient account
     */
    @PostMapping("/{id}/handle-payment")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR') or hasRole('STAFF')")
    public ResponseEntity<?> handlePayment(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String paymentStatus = request.get("status");
            if (paymentStatus == null || paymentStatus.trim().isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Payment status is required");
                return ResponseEntity.badRequest().body(error);
            }
            
            // Get appointment
            Optional<Appointment> appointmentOpt = appointmentService.getAppointmentById(id);
            if (!appointmentOpt.isPresent()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Appointment not found with ID: " + id);
                return ResponseEntity.notFound().build();
            }
            
            Appointment appointment = appointmentOpt.get();
            
            // Validate appointment status - prevent marking as paid for final statuses
            if (appointment.getStatus() == Appointment.AppointmentStatus.COMPLETED ||
                appointment.getStatus() == Appointment.AppointmentStatus.CANCELLED ||
                appointment.getStatus() == Appointment.AppointmentStatus.NO_SHOW) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Cannot mark payment as paid for appointments with status: " + appointment.getStatus() + 
                    ". Payment updates are not allowed for completed, cancelled, or no-show appointments.");
                return ResponseEntity.badRequest().body(error);
            }
            
            Map<String, Object> response = new HashMap<>();
            
            // Debug log - check notes value
            logger.info("=== DEBUG: Payment processing for appointment {} ===", id);
            logger.info("=== DEBUG: Appointment notes: '{}' ===", appointment.getNotes());
            logger.info("=== DEBUG: Notes is null: {} ===", appointment.getNotes() == null);
            logger.info("=== DEBUG: Notes is empty: {} ===", appointment.getNotes() != null && appointment.getNotes().trim().isEmpty());
            
            // Update appointment status based on whether doctor has completed examination
            if ((appointment.getNotes() != null && !appointment.getNotes().trim().isEmpty()) || 
                appointment.getStatus() == Appointment.AppointmentStatus.NEEDS_PAYMENT) {
                // Doctor has completed examination (has notes OR status is NEEDS_PAYMENT), mark as COMPLETED
                logger.info("=== DEBUG: Doctor has completed examination, marking as COMPLETED ===");
                appointment.setStatus(Appointment.AppointmentStatus.COMPLETED);
                appointment.setPaymentCompleted(true);
                appointment.setPaymentCompletedAt(java.time.LocalDateTime.now());
                appointment = appointmentRepository.save(appointment);
                response.put("message", "Thanh toán thành công! Lịch hẹn đã được hoàn thành.");
            } else {
                // Doctor hasn't completed examination yet, mark as PAID and wait for doctor
                logger.info("=== DEBUG: Doctor hasn't completed examination yet, marking as PAID ===");
                appointment.setStatus(Appointment.AppointmentStatus.PAID);
                appointment.setPaymentCompleted(true);
                appointment.setPaymentCompletedAt(java.time.LocalDateTime.now());
                appointment = appointmentRepository.save(appointment);
                response.put("message", "Thanh toán thành công! Chờ bác sĩ hoàn thành khám bệnh.");
            }
            
            // Auto create patient account if email is provided and account doesn't exist
            String email = appointment.getEmail();
            if (email != null && !email.trim().isEmpty()) {
                if (!userRepository.existsByEmail(email)) {
                    try {
                        // Create new patient account
                        User newPatient = new User();
                        newPatient.setUsername(email);
                        newPatient.setEmail(email);
                        newPatient.setFullName(appointment.getFullName());
                        newPatient.setPassword(passwordEncoder.encode("123456"));
                        newPatient.setRole(User.Role.PATIENT);
                        newPatient.setActive(true);
                        
                        User savedPatient = userRepository.save(newPatient);
                        
                        response.put("patientAccountCreated", true);
                        response.put("patientAccount", Map.of(
                            "username", savedPatient.getUsername(),
                            "temporaryPassword", "123456",
                            "message", "Tài khoản bệnh nhân đã được tạo thành công"
                        ));
                        
                        logger.info("=== Patient account created for email: {} ===", email);
                    } catch (Exception e) {
                        logger.error("Error creating patient account for email: {}", email, e);
                        response.put("patientAccountCreated", false);
                        response.put("patientAccountError", "Có lỗi khi tạo tài khoản bệnh nhân: " + e.getMessage());
                    }
                } else {
                    response.put("patientAccountCreated", false);
                    response.put("patientAccountMessage", "Tài khoản với email này đã tồn tại");
                }
            } else {
                response.put("patientAccountCreated", false);
                response.put("patientAccountMessage", "Không có email để tạo tài khoản");
            }
            
            response.put("appointment", appointment);
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            logger.error("Error handling payment: {}", id, e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Có lỗi xảy ra khi xử lý thanh toán: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * PUBLIC: Complete payment and automatically create patient account
     */
    @PostMapping("/public/{id}/complete-payment")
    public ResponseEntity<?> completePayment(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            logger.info("=== Processing payment completion for appointment: {} ===", id);
            
            // Get appointment
            Optional<Appointment> appointmentOpt = appointmentService.getAppointmentById(id);
            if (!appointmentOpt.isPresent()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Appointment not found with ID: " + id);
                return ResponseEntity.notFound().build();
            }
            
            Appointment appointment = appointmentOpt.get();
            
            // Validate appointment status - prevent payment completion for final statuses
            if (appointment.getStatus() == Appointment.AppointmentStatus.COMPLETED ||
                appointment.getStatus() == Appointment.AppointmentStatus.CANCELLED ||
                appointment.getStatus() == Appointment.AppointmentStatus.NO_SHOW) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Cannot complete payment for appointments with status: " + appointment.getStatus() + 
                    ". Payment completion is not allowed for completed, cancelled, or no-show appointments.");
                return ResponseEntity.badRequest().body(error);
            }
            
            String email = appointment.getEmail();
            
            Map<String, Object> response = new HashMap<>();
            response.put("appointmentId", id);
            response.put("message", "Thanh toán thành công!");
            
            // Create patient account if email is provided and account doesn't exist
            if (email != null && !email.trim().isEmpty()) {
                if (!userRepository.existsByEmail(email)) {
                    try {
                        // Create new patient account
                        User newPatient = new User();
                        newPatient.setUsername(email);
                        newPatient.setEmail(email);
                        newPatient.setFullName(appointment.getFullName());
                        newPatient.setPassword(passwordEncoder.encode("123456"));
                        newPatient.setRole(User.Role.PATIENT);
                        newPatient.setActive(true);
                        
                        User savedPatient = userRepository.save(newPatient);
                        
                        response.put("accountCreated", true);
                        response.put("loginCredentials", Map.of(
                            "username", savedPatient.getUsername(),
                            "password", "123456",
                            "message", "Tài khoản của bạn đã được tạo! Bạn có thể đăng nhập để theo dõi lịch hẹn."
                        ));
                        
                        logger.info("=== Patient account created successfully for email: {} ===", email);
                        
                        // Send welcome email with login credentials
                        try {
                            String emailContent = String.format(
                                "Chào %s,\n\n" +
                                "Cảm ơn bạn đã đặt lịch hẹn tại Florism Care.\n\n" +
                                "Tài khoản của bạn đã được tạo thành công:\n" +
                                "- Username: %s\n" +
                                "- Password: 123456\n\n" +
                                "Vui lòng đăng nhập và thay đổi mật khẩu để bảo mật tài khoản.\n\n" +
                                "Trân trọng,\nFlorism Care Team",
                                appointment.getFullName(), email
                            );
                            
                            emailService.sendSimpleEmail(
                                email,
                                "Tài khoản của bạn tại Florism Care",
                                emailContent
                            );
                        } catch (Exception emailError) {
                            logger.error("Failed to send welcome email to: {}", email, emailError);
                        }
                        
                    } catch (Exception e) {
                        logger.error("Error creating patient account for email: {}", email, e);
                        response.put("accountCreated", false);
                        response.put("accountError", "Có lỗi khi tạo tài khoản: " + e.getMessage());
                    }
                } else {
                    response.put("accountCreated", false);
                    response.put("accountMessage", "Tài khoản với email này đã tồn tại. Bạn có thể đăng nhập ngay.");
                }
            }
            
            // Confirm the appointment after successful payment
            try {
                appointment = appointmentService.confirmAppointment(id);
                response.put("appointmentConfirmed", true);
                response.put("appointment", appointment);
            } catch (Exception e) {
                logger.error("Error confirming appointment after payment: {}", id, e);
                response.put("appointmentConfirmed", false);
                response.put("confirmationError", "Lỗi xác nhận lịch hẹn: " + e.getMessage());
            }
            
            logger.info("=== Payment completed successfully for appointment: {} ===", id);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error completing payment for appointment: {}", id, e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Có lỗi xảy ra khi xử lý thanh toán: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * PATIENT: Get appointments for current patient
     */
    @GetMapping("/my-appointments")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<List<Appointment>> getMyAppointments(Authentication authentication) {
        try {
            String username = authentication.getName();
            // Get user's email from username (since username = email for patients)
            List<Appointment> appointments = appointmentRepository.findByEmailContainingIgnoreCase(username);
            return ResponseEntity.ok(appointments);
        } catch (Exception e) {
            logger.error("Error fetching patient appointments for user: {}", authentication.getName(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * PATIENT: Get medical history for current patient
     */
    @GetMapping("/my-medical-history")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<List<Appointment>> getMyMedicalHistory(Authentication authentication) {
        try {
            String username = authentication.getName();
            // Get completed appointments as medical history
            List<Appointment> completedAppointments = appointmentRepository.findByEmailContainingIgnoreCase(username)
                .stream()
                .filter(appointment -> appointment.getStatus() == Appointment.AppointmentStatus.COMPLETED)
                .sorted((a, b) -> b.getAppointmentDate().compareTo(a.getAppointmentDate())) // Sort by date desc
                .toList();
            
            return ResponseEntity.ok(completedAppointments);
        } catch (Exception e) {
            logger.error("Error fetching patient medical history for user: {}", authentication.getName(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * STAFF/ADMIN: Assign doctor to appointment (Step 2 of workflow)
     * This replaces the old confirm-with-doctor endpoint with clearer logic
     */
    @PutMapping("/{id}/assign-doctor")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<?> assignDoctorToAppointment(@PathVariable Long id, @RequestBody Map<String, Long> request) {
        try {
            Long doctorId = request.get("doctorId");
            if (doctorId == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Doctor ID is required");
                return ResponseEntity.badRequest().body(error);
            }
            
            // Get appointment
            Optional<Appointment> appointmentOpt = appointmentService.getAppointmentById(id);
            if (!appointmentOpt.isPresent()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Appointment not found with ID: " + id);
                return ResponseEntity.notFound().build();
            }
            
            Appointment appointment = appointmentOpt.get();
            
            // Validate workflow: can only assign doctor if status is PENDING
            if (appointment.getStatus() != Appointment.AppointmentStatus.PENDING) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Can only assign doctor to PENDING appointments. Current status: " + appointment.getStatus());
                return ResponseEntity.badRequest().body(error);
            }
            
            // Validate doctor exists and has DOCTOR role
            Optional<User> doctorOptional = userRepository.findById(doctorId);
            if (!doctorOptional.isPresent()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Doctor not found with ID: " + doctorId);
                return ResponseEntity.badRequest().body(error);
            }
            
            User doctor = doctorOptional.get();
            if (doctor.getRole() != User.Role.DOCTOR) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "User with ID " + doctorId + " is not a doctor");
                return ResponseEntity.badRequest().body(error);
            }
            
            // Update appointment to AWAITING_DOCTOR_APPROVAL
            appointment.setStatus(Appointment.AppointmentStatus.AWAITING_DOCTOR_APPROVAL);
            appointment.setDoctor(doctor);
            appointment.setDoctorNotifiedAt(java.time.LocalDateTime.now());
            
            Appointment updatedAppointment = appointmentRepository.save(appointment);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Bác sĩ đã được chỉ định. Chờ bác sĩ phản hồi.");
            response.put("appointment", updatedAppointment);
            
            // TODO: Send notification to doctor (email/system notification)
            logger.info("Doctor assigned to appointment {} and notified: {}", id, doctor.getEmail());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error assigning doctor to appointment: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * DOCTOR: Accept appointment (Step 3a of workflow)
     */
    @PutMapping("/{id}/doctor-accept")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> doctorAcceptAppointment(@PathVariable Long id, @RequestBody Map<String, String> request, Authentication authentication) {
        try {
            String response = request.getOrDefault("response", "Accepted by doctor");
            
            // Get appointment
            Optional<Appointment> appointmentOpt = appointmentService.getAppointmentById(id);
            if (!appointmentOpt.isPresent()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Appointment not found with ID: " + id);
                return ResponseEntity.notFound().build();
            }
            
            Appointment appointment = appointmentOpt.get();
            
            // Validate workflow: can only accept if status is AWAITING_DOCTOR_APPROVAL
            if (appointment.getStatus() != Appointment.AppointmentStatus.AWAITING_DOCTOR_APPROVAL) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Can only accept appointments with AWAITING_DOCTOR_APPROVAL status. Current status: " + appointment.getStatus());
                return ResponseEntity.badRequest().body(error);
            }
            
            // Validate that this doctor is assigned to this appointment
            String doctorUsername = authentication.getName();
            // Find current doctor by username
            Optional<User> currentDoctorOpt = userRepository.findByUsername(doctorUsername);
            if (!currentDoctorOpt.isPresent()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Doctor not found");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
            }
            
            User currentDoctor = currentDoctorOpt.get();
            if (appointment.getDoctor() == null || !appointment.getDoctor().getId().equals(currentDoctor.getId())) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "You are not assigned to this appointment");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
            }
            
            // Update appointment to CONFIRMED
            appointment.setStatus(Appointment.AppointmentStatus.CONFIRMED);
            appointment.setDoctorRespondedAt(java.time.LocalDateTime.now());
            appointment.setDoctorResponse("ACCEPTED: " + response);
            
            Appointment confirmedAppointment = appointmentRepository.save(appointment);
            
            Map<String, Object> responseMap = new HashMap<>();
            responseMap.put("message", "Lịch hẹn đã được chấp nhận thành công");
            responseMap.put("appointment", confirmedAppointment);
            
            logger.info("Doctor {} accepted appointment {}", doctorUsername, id);
            
            return ResponseEntity.ok(responseMap);
            
        } catch (Exception e) {
            logger.error("Error accepting appointment: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * DOCTOR: Decline appointment (Step 3b of workflow)
     */
    @PutMapping("/{id}/doctor-decline")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> doctorDeclineAppointment(@PathVariable Long id, @RequestBody Map<String, String> request, Authentication authentication) {
        try {
            String reason = request.getOrDefault("reason", "Declined by doctor");
            
            // Get appointment
            Optional<Appointment> appointmentOpt = appointmentService.getAppointmentById(id);
            if (!appointmentOpt.isPresent()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Appointment not found with ID: " + id);
                return ResponseEntity.notFound().build();
            }
            
            Appointment appointment = appointmentOpt.get();
            
            // Validate workflow: can only decline if status is AWAITING_DOCTOR_APPROVAL
            if (appointment.getStatus() != Appointment.AppointmentStatus.AWAITING_DOCTOR_APPROVAL) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Can only decline appointments with AWAITING_DOCTOR_APPROVAL status. Current status: " + appointment.getStatus());
                return ResponseEntity.badRequest().body(error);
            }
            
            // Validate that this doctor is assigned to this appointment
            String doctorUsername = authentication.getName();
            // Find current doctor by username
            Optional<User> currentDoctorOpt = userRepository.findByUsername(doctorUsername);
            if (!currentDoctorOpt.isPresent()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Doctor not found");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
            }
            
            User currentDoctor = currentDoctorOpt.get();
            if (appointment.getDoctor() == null || !appointment.getDoctor().getId().equals(currentDoctor.getId())) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "You are not assigned to this appointment");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
            }
            
            // Update appointment back to PENDING and clear doctor assignment
            appointment.setStatus(Appointment.AppointmentStatus.PENDING);
            appointment.setDoctor(null);
            appointment.setDoctorRespondedAt(java.time.LocalDateTime.now());
            appointment.setDoctorResponse("DECLINED: " + reason);
            appointment.setDoctorNotifiedAt(null); // Clear notification time
            
            Appointment declinedAppointment = appointmentRepository.save(appointment);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Lịch hẹn đã được từ chối. Trở về trạng thái chờ staff xử lý.");
            response.put("appointment", declinedAppointment);
            
            logger.info("Doctor {} declined appointment {} with reason: {}", doctorUsername, id, reason);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error declining appointment: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * TEST: Simple test endpoint for authentication
     */
    @GetMapping("/test-auth")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<String> testAuthEndpoint() {
        return ResponseEntity.ok("Authentication working for DOCTOR role");
    }
    
    /**
     * DOCTOR: Get appointments pending my approval
     */
    @GetMapping("/pending-my-approval")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<Appointment>> getAppointmentsPendingMyApproval(Authentication authentication) {
        try {
            String doctorUsername = authentication.getName();
            Optional<User> doctorOptional = userRepository.findByUsername(doctorUsername);
            
            if (!doctorOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            User doctor = doctorOptional.get();
            List<Appointment> pendingAppointments = appointmentRepository.findByDoctorAndStatus(
                doctor, 
                Appointment.AppointmentStatus.AWAITING_DOCTOR_APPROVAL
            );
            
            return ResponseEntity.ok(pendingAppointments);
        } catch (Exception e) {
            logger.error("Error fetching appointments pending doctor approval", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/test-pending-approval")
    public ResponseEntity<List<Appointment>> testGetAppointmentsPendingApproval() {
        try {
            // Find all appointments with AWAITING_DOCTOR_APPROVAL status
            List<Appointment> pendingAppointments = appointmentRepository.findByStatus(
                Appointment.AppointmentStatus.AWAITING_DOCTOR_APPROVAL
            );
            
            return ResponseEntity.ok(pendingAppointments);
        } catch (Exception e) {
            logger.error("Error fetching appointments pending doctor approval", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/test-pending-my-approval")
    public ResponseEntity<List<Appointment>> testGetAppointmentsPendingMyApproval(@RequestParam Long doctorId) {
        try {
            // Find doctor by ID
            Optional<User> doctorOptional = userRepository.findById(doctorId);
            
            if (!doctorOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            User doctor = doctorOptional.get();
            List<Appointment> pendingAppointments = appointmentRepository.findByDoctorAndStatus(
                doctor, 
                Appointment.AppointmentStatus.AWAITING_DOCTOR_APPROVAL
            );
            
            return ResponseEntity.ok(pendingAppointments);
        } catch (Exception e) {
            logger.error("Error fetching appointments pending doctor approval", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PostMapping("/test-create-doctor")
    public ResponseEntity<?> testCreateDoctor(@RequestBody Map<String, String> request) {
        try {
            String username = request.getOrDefault("username", "testdoctor");
            String email = request.getOrDefault("email", "testdoctor@test.com");
            String password = request.getOrDefault("password", "123456");
            String fullName = request.getOrDefault("fullName", "Test Doctor");
            
            // Check if user already exists
            if (userRepository.existsByEmail(email) || userRepository.existsByUsername(username)) {
                // Update existing user's password
                Optional<User> userOpt = userRepository.findByEmail(email);
                if (!userOpt.isPresent()) {
                    userOpt = userRepository.findByUsername(username);
                }
                
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    user.setPassword(passwordEncoder.encode(password));
                    User updatedUser = userRepository.save(user);
                    
                    Map<String, Object> response = new HashMap<>();
                    response.put("message", "Doctor password updated");
                    response.put("username", updatedUser.getUsername());
                    response.put("email", updatedUser.getEmail());
                    response.put("password", password); // For testing only
                    return ResponseEntity.ok(response);
                }
            }
            
            // Create new doctor
            User newDoctor = new User();
            newDoctor.setUsername(username);
            newDoctor.setEmail(email);
            newDoctor.setPassword(passwordEncoder.encode(password));
            newDoctor.setFullName(fullName);
            newDoctor.setBirth(java.time.LocalDate.of(1990, 1, 1));
            newDoctor.setGender(User.Gender.MALE);
            newDoctor.setRole(User.Role.DOCTOR);
            newDoctor.setSpecialty(User.MedicalSpecialty.NEUROLOGY);
            newDoctor.setActive(true);
            
            User savedDoctor = userRepository.save(newDoctor);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Doctor created successfully");
            response.put("username", savedDoctor.getUsername());
            response.put("email", savedDoctor.getEmail());
            response.put("password", password); // For testing only
            response.put("id", savedDoctor.getId());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error creating test doctor", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to create doctor: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    @PostMapping("/test-create-pending-appointment")
    public ResponseEntity<?> testCreatePendingAppointment(@RequestBody Map<String, Object> request) {
        try {
            Long doctorId = Long.valueOf(request.getOrDefault("doctorId", "7").toString());
            String patientName = request.getOrDefault("patientName", "Test Patient").toString();
            String patientEmail = request.getOrDefault("patientEmail", "testpatient@test.com").toString();
            String patientPhone = request.getOrDefault("patientPhone", "0123456789").toString();
            
            // Find doctor
            Optional<User> doctorOpt = userRepository.findById(doctorId);
            if (!doctorOpt.isPresent()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Doctor not found with ID: " + doctorId);
                return ResponseEntity.badRequest().body(error);
            }
            
            User doctor = doctorOpt.get();
            
            // Create new appointment
            Appointment appointment = new Appointment();
            appointment.setFullName(patientName);
            appointment.setPhone(patientPhone);
            appointment.setEmail(patientEmail);
            appointment.setAppointmentDate(java.time.LocalDate.now().plusDays(7)); // Next week
            appointment.setAppointmentTime(java.time.LocalTime.of(10, 0)); // 10:00 AM
            appointment.setDepartment(Appointment.Department.NEUROLOGY);
            appointment.setReason("Test appointment for pending approval");
            appointment.setStatus(Appointment.AppointmentStatus.AWAITING_DOCTOR_APPROVAL);
            appointment.setDoctor(doctor);
            appointment.setDoctorNotifiedAt(java.time.LocalDateTime.now());
            appointment.setEmailSent(false);
            appointment.setReminderSent(false);
            appointment.setPaymentRequested(false);
            appointment.setPaymentCompleted(false);
            
            Appointment savedAppointment = appointmentRepository.save(appointment);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Test appointment created successfully");
            response.put("appointmentId", savedAppointment.getId());
            response.put("patientName", savedAppointment.getFullName());
            response.put("doctorName", doctor.getFullName());
            response.put("status", savedAppointment.getStatus());
            response.put("appointmentDate", savedAppointment.getAppointmentDate().toString());
            response.put("appointmentTime", savedAppointment.getAppointmentTime().toString());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error creating test appointment", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to create appointment: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * ADMIN/STAFF: Send payment confirmation email
     */
    @PostMapping("/{id}/send-payment-confirmation")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<?> sendPaymentConfirmationEmail(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            logger.info("=== Sending payment confirmation email for appointment: {} ===", id);
            
            // Get appointment
            Optional<Appointment> appointmentOpt = appointmentService.getAppointmentById(id);
            if (!appointmentOpt.isPresent()) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Appointment not found");
                return ResponseEntity.notFound().build();
            }
            
            Appointment appointment = appointmentOpt.get();
            
            // Validate that appointment is in PAID status
            if (appointment.getStatus() != Appointment.AppointmentStatus.PAID) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Can only send payment confirmation for PAID appointments");
                return ResponseEntity.badRequest().body(error);
            }
            
            // Get email from request or use appointment email
            String patientEmail = (String) request.get("patientEmail");
            if (patientEmail == null || patientEmail.trim().isEmpty()) {
                patientEmail = appointment.getEmail();
            }
            
            if (patientEmail == null || patientEmail.trim().isEmpty()) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "No email address available for this appointment");
                return ResponseEntity.badRequest().body(error);
            }
            
            // Build payment confirmation email content
            String emailContent = buildPaymentConfirmationEmailContent(appointment);
            
            // Send email
            boolean emailSent = emailService.sendSimpleEmail(
                patientEmail,
                "✅ Xác nhận thanh toán thành công - Lịch hẹn khám bệnh",
                emailContent
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", emailSent);
            response.put("message", emailSent ? "Payment confirmation email sent successfully" : "Failed to send payment confirmation email");
            
            if (emailSent) {
                logger.info("=== Payment confirmation email sent successfully to: {} for appointment: {} ===", patientEmail, id);
            } else {
                logger.error("=== Failed to send payment confirmation email to: {} for appointment: {} ===", patientEmail, id);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("=== Error sending payment confirmation email for appointment: {} ===", id, e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to send payment confirmation email: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * ADMIN/STAFF: Send update notification email
     */
    @PostMapping("/{id}/send-update-notification")
    @PreAuthorize("hasRole('ADMIN') or hasRole('STAFF')")
    public ResponseEntity<?> sendUpdateNotification(@PathVariable Long id, @RequestBody EmailUpdateRequest request) {
        try {
            logger.info("=== Sending update notification for appointment: {} ===", id);
            
            // Get appointment details
            Optional<Appointment> appointmentOpt = appointmentService.getAppointmentById(id);
            if (!appointmentOpt.isPresent()) {
                Map<String, Object> error = new HashMap<>();
                error.put("success", false);
                error.put("message", "Appointment not found with ID: " + id);
                return ResponseEntity.notFound().build();
            }
            
            Appointment appointment = appointmentOpt.get();
            
            // Build email content
            String emailContent = buildUpdateEmailContent(
                request.getPatientName(),
                id,
                request.getChanges(),
                request.getNewAppointmentDate(),
                request.getNewAppointmentTime(),
                request.getNewDepartment()
            );
            
            // Send email
            boolean emailSent = emailService.sendSimpleEmail(
                request.getPatientEmail(),
                "Thông báo thay đổi lịch hẹn khám bệnh - Florism Care",
                emailContent
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", emailSent);
            response.put("message", emailSent ? "Email notification sent successfully" : "Failed to send email notification");
            
            logger.info("=== Update notification email result: {} ===", emailSent);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error sending update notification for appointment: {}", id, e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Failed to send notification: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    private String buildUpdateEmailContent(String patientName, Long appointmentId, List<String> changes, String newDate, String newTime, String newDepartment) {
        StringBuilder content = new StringBuilder();
        content.append("Kính chào ").append(patientName).append(",\n\n");
        content.append("Thông tin lịch hẹn khám bệnh của bạn (Mã số: ")
               .append(appointmentId).append(") đã được cập nhật:\n\n");
        
        content.append("Những thay đổi được thực hiện:\n");
        for (String change : changes) {
            content.append("- ").append(change).append("\n");
        }
        
        content.append("\n");
        if (newDate != null && !newDate.isEmpty()) {
            content.append("Ngày hẹn mới: ").append(newDate).append("\n");
        }
        if (newTime != null && !newTime.isEmpty()) {
            content.append("Giờ hẹn mới: ").append(newTime).append("\n");
        }
        if (newDepartment != null && !newDepartment.isEmpty()) {
            content.append("Khoa khám mới: ").append(newDepartment).append("\n");
        }
        
        content.append("\nVui lòng kiểm tra lại thông tin và sắp xếp thời gian phù hợp.\n\n");
        content.append("Mọi thắc mắc vui lòng liên hệ: info@florism.site\n\n");
        content.append("Trân trọng,\n");
        content.append("Phòng khám Florism Care\n");
        content.append("Email: info@florism.site");
        
        return content.toString();
    }

    private String buildPaymentConfirmationEmailContent(Appointment appointment) {
        StringBuilder content = new StringBuilder();
        content.append("Kính chào ").append(appointment.getFullName()).append(",\n\n");
        content.append("Chúng tôi xác nhận đã nhận được thanh toán cho lịch hẹn khám bệnh của bạn.\n\n");
        
        content.append("THÔNG TIN LỊCH HẸN:\n");
        content.append("===================\n");
        content.append("Mã lịch hẹn: #").append(appointment.getId()).append("\n");
        content.append("Ngày khám: ").append(appointment.getAppointmentDate()).append("\n");
        content.append("Giờ khám: ").append(appointment.getAppointmentTime()).append("\n");
        content.append("Khoa khám: ").append(appointment.getDepartment().getDepartmentName()).append("\n");
        
        if (appointment.getDoctor() != null) {
            content.append("Bác sĩ phụ trách: ").append(appointment.getDoctor().getFullName()).append("\n");
        }
        
        if (appointment.getPaymentAmount() != null) {
            content.append("Số tiền đã thanh toán: ").append(String.format("%,.0f VNĐ", appointment.getPaymentAmount())).append("\n");
        }
        
        content.append("\nLưu ý quan trọng:\n");
        content.append("- Vui lòng đến trước giờ hẹn 15 phút\n");
        content.append("- Mang theo CMND/CCCD và thẻ BHYT (nếu có)\n");
        content.append("- Nếu cần hủy hoặc thay đổi lịch hẹn, vui lòng liên hệ trước 24 giờ\n\n");
        
        content.append("Địa chỉ: 123 Đường ABC, Quận 1, TP.HCM\n");
        content.append("Điện thoại: 1900 1234\n");
        content.append("Email: info@florism.site\n\n");
        
        content.append("Cảm ơn bạn đã tin tưởng dịch vụ của chúng tôi.\n\n");
        content.append("Trân trọng,\n");
        content.append("Đội ngũ Florism Care");
        
        return content.toString();
    }
    
    public static class EmailUpdateRequest {
        private String patientEmail;
        private String patientName;
        private List<String> changes;
        private String newAppointmentDate;
        private String newAppointmentTime;
        private String newDepartment;
        
        // Getters and setters
        public String getPatientEmail() { return patientEmail; }
        public void setPatientEmail(String patientEmail) { this.patientEmail = patientEmail; }
        
        public String getPatientName() { return patientName; }
        public void setPatientName(String patientName) { this.patientName = patientName; }
        
        public List<String> getChanges() { return changes; }
        public void setChanges(List<String> changes) { this.changes = changes; }
        
        public String getNewAppointmentDate() { return newAppointmentDate; }
        public void setNewAppointmentDate(String newAppointmentDate) { this.newAppointmentDate = newAppointmentDate; }
        
        public String getNewAppointmentTime() { return newAppointmentTime; }
        public void setNewAppointmentTime(String newAppointmentTime) { this.newAppointmentTime = newAppointmentTime; }
        
        public String getNewDepartment() { return newDepartment; }
        public void setNewDepartment(String newDepartment) { this.newDepartment = newDepartment; }
    }
    
    public static class DepartmentInfo {
        public String code;
        public String departmentName;
        public String specialtyName;
        
        public DepartmentInfo(String code, String departmentName, String specialtyName) {
            this.code = code;
            this.departmentName = departmentName;
            this.specialtyName = specialtyName;
        }
        
        // Getters
        public String getCode() { return code; }
        public String getDepartmentName() { return departmentName; }
        public String getSpecialtyName() { return specialtyName; }
    }
    
    public static class CreateAppointmentRequest {
        public String fullName;
        public String phone;
        public String email;
        public String appointmentDate;
        public String appointmentTime;
        public String department; // Still accept String from frontend
        public String reason;
        
        // Getters and setters
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        
        public String getAppointmentDate() { return appointmentDate; }
        public void setAppointmentDate(String appointmentDate) { this.appointmentDate = appointmentDate; }
        
        public String getAppointmentTime() { return appointmentTime; }
        public void setAppointmentTime(String appointmentTime) { this.appointmentTime = appointmentTime; }
        
        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
        
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }
} 
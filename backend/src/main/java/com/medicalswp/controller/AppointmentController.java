package com.medicalswp.controller;

import com.medicalswp.entity.Appointment;
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
            Appointment confirmedAppointment = appointmentService.confirmAppointment(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Lịch hẹn đã được xác nhận");
            response.put("appointment", confirmedAppointment);
            
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
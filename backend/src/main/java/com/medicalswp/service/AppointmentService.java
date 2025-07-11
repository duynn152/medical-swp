package com.medicalswp.service;

import com.medicalswp.entity.Appointment;
import com.medicalswp.entity.User;
import com.medicalswp.repository.AppointmentRepository;
import com.medicalswp.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class AppointmentService {
    
    private static final Logger logger = LoggerFactory.getLogger(AppointmentService.class);
    
    @Autowired
    private AppointmentRepository appointmentRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private EmailService emailService;
    
    /**
     * Tạo appointment mới
     */
    public Appointment createAppointment(Appointment appointment) {
        logger.info("Creating new appointment for: {}", appointment.getFullName());
        
        // Validate time slot availability
        if (!isTimeSlotAvailable(appointment.getAppointmentDate(), 
                                appointment.getAppointmentTime(), 
                                appointment.getDepartment())) {
            throw new IllegalArgumentException("Time slot is not available");
        }
        
        // Try to link with existing user if email matches
        if (appointment.getEmail() != null) {
            Optional<User> existingUser = userRepository.findByEmail(appointment.getEmail());
            if (existingUser.isPresent()) {
                appointment.setUser(existingUser.get());
                logger.info("Linked appointment with existing user: {}", existingUser.get().getUsername());
            }
        }
        
        // Save appointment
        Appointment savedAppointment = appointmentRepository.save(appointment);
        
        // Send confirmation email asynchronously
        sendConfirmationEmailAsync(savedAppointment);
        
        logger.info("Appointment created successfully with ID: {}", savedAppointment.getId());
        return savedAppointment;
    }
    
    /**
     * Cập nhật appointment
     */
    public Appointment updateAppointment(Long id, Appointment appointmentDetails) {
        logger.info("Updating appointment with ID: {}", id);
        
        Optional<Appointment> appointmentOptional = appointmentRepository.findById(id);
        if (!appointmentOptional.isPresent()) {
            throw new IllegalArgumentException("Appointment not found with ID: " + id);
        }
        
        Appointment appointment = appointmentOptional.get();
        
        // Validate business rules for status changes
        if (appointmentDetails.getStatus() != null) {
            Appointment.AppointmentStatus currentStatus = appointment.getStatus();
            Appointment.AppointmentStatus newStatus = appointmentDetails.getStatus();
            
            // Enforce workflow: Can mark as COMPLETED if:
            // 1. Currently PAID (normal flow: payment -> doctor completes)
            // 2. Currently NEEDS_PAYMENT (doctor completed first, then payment completes the appointment)
            if (newStatus == Appointment.AppointmentStatus.COMPLETED && 
                currentStatus != Appointment.AppointmentStatus.PAID && 
                currentStatus != Appointment.AppointmentStatus.NEEDS_PAYMENT) {
                throw new IllegalArgumentException("Cannot mark appointment as COMPLETED unless it is currently PAID or NEEDS_PAYMENT. Current status: " + currentStatus);
            }
            // All other status transitions are allowed (including setting NEEDS_PAYMENT)
        }
        
        // Update fields only if they are not null (partial update support)
        if (appointmentDetails.getFullName() != null) {
            appointment.setFullName(appointmentDetails.getFullName());
        }
        if (appointmentDetails.getPhone() != null) {
            appointment.setPhone(appointmentDetails.getPhone());
        }
        if (appointmentDetails.getEmail() != null) {
            appointment.setEmail(appointmentDetails.getEmail());
        }
        if (appointmentDetails.getAppointmentDate() != null) {
            appointment.setAppointmentDate(appointmentDetails.getAppointmentDate());
        }
        if (appointmentDetails.getAppointmentTime() != null) {
            appointment.setAppointmentTime(appointmentDetails.getAppointmentTime());
        }
        if (appointmentDetails.getDepartment() != null) {
            appointment.setDepartment(appointmentDetails.getDepartment());
        }
        if (appointmentDetails.getReason() != null) {
            appointment.setReason(appointmentDetails.getReason());
        }
        if (appointmentDetails.getStatus() != null) {
            appointment.setStatus(appointmentDetails.getStatus());
        }
        if (appointmentDetails.getNotes() != null) {
            appointment.setNotes(appointmentDetails.getNotes());
        }
        
        if (appointmentDetails.getDoctor() != null) {
            appointment.setDoctor(appointmentDetails.getDoctor());
        }
        
        Appointment updatedAppointment = appointmentRepository.save(appointment);
        logger.info("Appointment updated successfully: {}", updatedAppointment.getId());
        
        return updatedAppointment;
    }
    
    /**
     * Hủy appointment
     */
    public Appointment cancelAppointment(Long id, String reason) {
        logger.info("Cancelling appointment with ID: {}", id);
        
        Optional<Appointment> appointmentOptional = appointmentRepository.findById(id);
        if (!appointmentOptional.isPresent()) {
            throw new IllegalArgumentException("Appointment not found with ID: " + id);
        }
        
        Appointment appointment = appointmentOptional.get();
        appointment.setStatus(Appointment.AppointmentStatus.CANCELLED);
        
        Appointment cancelledAppointment = appointmentRepository.save(appointment);
        
        // Send cancellation email
        if (appointment.getEmail() != null && !appointment.getEmail().isEmpty()) {
            sendCancellationEmailAsync(appointment, reason);
        }
        
        logger.info("Appointment cancelled successfully: {}", cancelledAppointment.getId());
        return cancelledAppointment;
    }
    
    /**
     * Xác nhận appointment
     */
    public Appointment confirmAppointment(Long id) {
        logger.info("Confirming appointment with ID: {}", id);
        
        Optional<Appointment> appointmentOptional = appointmentRepository.findById(id);
        if (!appointmentOptional.isPresent()) {
            throw new IllegalArgumentException("Appointment not found with ID: " + id);
        }
        
        Appointment appointment = appointmentOptional.get();
        appointment.setStatus(Appointment.AppointmentStatus.CONFIRMED);
        
        return appointmentRepository.save(appointment);
    }
    
    /**
     * Xác nhận appointment với bác sĩ được chỉ định
     */
    public Appointment confirmAppointmentWithDoctor(Long appointmentId, Long doctorId) {
        logger.info("Confirming appointment with ID: {} and assigning doctor ID: {}", appointmentId, doctorId);
        
        // Validate appointment exists
        Optional<Appointment> appointmentOptional = appointmentRepository.findById(appointmentId);
        if (!appointmentOptional.isPresent()) {
            throw new IllegalArgumentException("Appointment not found with ID: " + appointmentId);
        }
        
        // Validate doctor exists and has DOCTOR role
        Optional<User> doctorOptional = userRepository.findById(doctorId);
        if (!doctorOptional.isPresent()) {
            throw new IllegalArgumentException("Doctor not found with ID: " + doctorId);
        }
        
        User doctor = doctorOptional.get();
        if (doctor.getRole() != User.Role.DOCTOR) {
            throw new IllegalArgumentException("User with ID " + doctorId + " is not a doctor");
        }
        
        // Update appointment
        Appointment appointment = appointmentOptional.get();
        appointment.setStatus(Appointment.AppointmentStatus.CONFIRMED);
        appointment.setDoctor(doctor);
        
        Appointment confirmedAppointment = appointmentRepository.save(appointment);
        logger.info("Appointment confirmed successfully with doctor assigned: {}", confirmedAppointment.getId());
        
        return confirmedAppointment;
    }
    
    /**
     * Kiểm tra time slot availability
     */
    public boolean isTimeSlotAvailable(LocalDate date, LocalTime time, Appointment.Department department) {
        Long count = appointmentRepository.countByDateTimeAndDepartment(date, time, department);
        return count < 3; // Max 3 appointments per time slot per department
    }
    
    /**
     * Lấy tất cả appointments
     */
    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAllWithUserAndDoctor();
    }
    
    /**
     * Lấy appointment theo ID
     */
    public Optional<Appointment> getAppointmentById(Long id) {
        return appointmentRepository.findById(id);
    }
    
    /**
     * Lấy appointments theo status
     */
    public List<Appointment> getAppointmentsByStatus(Appointment.AppointmentStatus status) {
        return appointmentRepository.findByStatusWithUserAndDoctor(status);
    }
    
    /**
     * Lấy appointments theo date
     */
    public List<Appointment> getAppointmentsByDate(LocalDate date) {
        return appointmentRepository.findByAppointmentDate(date);
    }
    
    /**
     * Lấy appointments hôm nay
     */
    public List<Appointment> getTodaysAppointments() {
        return appointmentRepository.findTodaysAppointments(LocalDate.now());
    }
    
    /**
     * Lấy upcoming appointments (7 ngày tới)
     */
    public List<Appointment> getUpcomingAppointments() {
        LocalDate today = LocalDate.now();
        LocalDate oneWeekLater = today.plusDays(7);
        return appointmentRepository.findUpcomingAppointments(today, oneWeekLater);
    }
    
    /**
     * Tìm kiếm appointments
     */
    public List<Appointment> searchAppointments(String searchTerm) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return getAllAppointments();
        }
        
        // Search by name, email, or phone
        List<Appointment> nameResults = appointmentRepository.findByFullNameContainingIgnoreCase(searchTerm);
        List<Appointment> emailResults = appointmentRepository.findByEmailContainingIgnoreCase(searchTerm);
        List<Appointment> phoneResults = appointmentRepository.findByPhoneContaining(searchTerm);
        
        // Combine results (using Set to avoid duplicates in real implementation)
        nameResults.addAll(emailResults);
        nameResults.addAll(phoneResults);
        
        return nameResults;
    }
    
    /**
     * Gửi email xác nhận (async)
     */
    @Async
    public void sendConfirmationEmailAsync(Appointment appointment) {
        if (appointment.getEmail() != null && !appointment.getEmail().isEmpty() && !appointment.getEmailSent()) {
            boolean sent = emailService.sendAppointmentConfirmation(appointment);
            if (sent) {
                appointment.setEmailSent(true);
                appointmentRepository.save(appointment);
                logger.info("Confirmation email sent and marked for appointment: {}", appointment.getId());
            }
        }
    }
    
    /**
     * Gửi email hủy lịch (async)
     */
    @Async
    public void sendCancellationEmailAsync(Appointment appointment, String reason) {
        if (appointment.getEmail() != null && !appointment.getEmail().isEmpty()) {
            emailService.sendAppointmentCancellation(appointment, reason);
            logger.info("Cancellation email sent for appointment: {}", appointment.getId());
        }
    }
    
    /**
     * Tự động gửi email nhắc nhở (chạy hàng ngày lúc 8:00 AM)
     */
    @Scheduled(cron = "0 0 8 * * ?")
    public void sendReminderEmails() {
        logger.info("Starting daily reminder email task");
        
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        List<Appointment> appointmentsForReminder = appointmentRepository.findAppointmentsForReminder(tomorrow);
        
        logger.info("Found {} appointments needing reminder emails", appointmentsForReminder.size());
        
        for (Appointment appointment : appointmentsForReminder) {
            try {
                boolean sent = emailService.sendAppointmentReminder(appointment);
                if (sent) {
                    appointment.setReminderSent(true);
                    appointmentRepository.save(appointment);
                    logger.info("Reminder email sent for appointment: {}", appointment.getId());
                }
            } catch (Exception e) {
                logger.error("Failed to send reminder email for appointment: {}", appointment.getId(), e);
            }
        }
        
        logger.info("Completed daily reminder email task");
    }
    
    /**
     * Tự động gửi email xác nhận cho những appointment chưa gửi (chạy mỗi 30 phút)
     */
    @Scheduled(fixedRate = 30 * 60 * 1000) // 30 minutes
    public void sendPendingConfirmationEmails() {
        List<Appointment> appointmentsNeedingEmail = appointmentRepository.findAppointmentsNeedingConfirmationEmail();
        
        if (!appointmentsNeedingEmail.isEmpty()) {
            logger.info("Found {} appointments needing confirmation emails", appointmentsNeedingEmail.size());
            
            for (Appointment appointment : appointmentsNeedingEmail) {
                sendConfirmationEmailAsync(appointment);
            }
        }
    }
    
    /**
     * Thống kê appointments
     */
    public AppointmentStats getAppointmentStats() {
        AppointmentStats stats = new AppointmentStats();
        
        stats.totalAppointments = appointmentRepository.count();
        stats.pendingAppointments = appointmentRepository.countByStatus(Appointment.AppointmentStatus.PENDING);
        stats.confirmedAppointments = appointmentRepository.countByStatus(Appointment.AppointmentStatus.CONFIRMED);
        stats.todaysAppointments = appointmentRepository.countTodaysAppointments(LocalDate.now());
        
        return stats;
    }
    
    /**
     * Inner class cho thống kê
     */
    public static class AppointmentStats {
        public Long totalAppointments;
        public Long pendingAppointments;
        public Long confirmedAppointments;
        public Long todaysAppointments;
        
        // Getters and setters
        public Long getTotalAppointments() { return totalAppointments; }
        public void setTotalAppointments(Long totalAppointments) { this.totalAppointments = totalAppointments; }
        
        public Long getPendingAppointments() { return pendingAppointments; }
        public void setPendingAppointments(Long pendingAppointments) { this.pendingAppointments = pendingAppointments; }
        
        public Long getConfirmedAppointments() { return confirmedAppointments; }
        public void setConfirmedAppointments(Long confirmedAppointments) { this.confirmedAppointments = confirmedAppointments; }
        
        public Long getTodaysAppointments() { return todaysAppointments; }
        public void setTodaysAppointments(Long todaysAppointments) { this.todaysAppointments = todaysAppointments; }
    }
    
    /**
     * Yêu cầu thanh toán cho appointment
     */
    public Appointment requestPayment(Long id, Double amount) {
        logger.info("Requesting payment for appointment with ID: {} and amount: {}", id, amount);
        
        Optional<Appointment> appointmentOptional = appointmentRepository.findById(id);
        if (!appointmentOptional.isPresent()) {
            throw new IllegalArgumentException("Appointment not found with ID: " + id);
        }
        
        Appointment appointment = appointmentOptional.get();
        
        // Validate appointment status - prevent payment requests for final statuses
        if (appointment.getStatus() == Appointment.AppointmentStatus.COMPLETED ||
            appointment.getStatus() == Appointment.AppointmentStatus.CANCELLED ||
            appointment.getStatus() == Appointment.AppointmentStatus.NO_SHOW) {
            throw new IllegalArgumentException("Cannot request payment for appointments with status: " + appointment.getStatus() + 
                ". Payment requests are not allowed for completed, cancelled, or no-show appointments.");
        }
        
        // Validate appointment status - allow payment requests for CONFIRMED, NEEDS_PAYMENT, or already PAYMENT_REQUESTED
        if (appointment.getStatus() != Appointment.AppointmentStatus.CONFIRMED && 
            appointment.getStatus() != Appointment.AppointmentStatus.NEEDS_PAYMENT &&
            appointment.getStatus() != Appointment.AppointmentStatus.PAYMENT_REQUESTED) {
            throw new IllegalArgumentException("Payment can only be requested for confirmed appointments or those needing payment");
        }
        
        // Validate amount
        if (amount == null || amount <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than 0");
        }
        
        // Update appointment
        appointment.setStatus(Appointment.AppointmentStatus.PAYMENT_REQUESTED);
        appointment.setPaymentRequested(true);
        appointment.setPaymentAmount(amount);
        appointment.setPaymentRequestedAt(java.time.LocalDateTime.now());
        
        Appointment updatedAppointment = appointmentRepository.save(appointment);
        
        // Send payment request email
        if (appointment.getEmail() != null && !appointment.getEmail().isEmpty()) {
            sendPaymentRequestEmailAsync(appointment);
        }
        
        logger.info("Payment requested/updated successfully for appointment: {} with amount: {}", updatedAppointment.getId(), amount);
        return updatedAppointment;
    }
    
    /**
     * Gửi email yêu cầu thanh toán (async)
     */
    @Async
    public void sendPaymentRequestEmailAsync(Appointment appointment) {
        if (appointment.getEmail() != null && !appointment.getEmail().isEmpty()) {
            emailService.sendPaymentRequest(appointment);
            logger.info("Payment request email sent for appointment: {}", appointment.getId());
        }
    }
    
    /**
     * Lấy appointments theo doctor username (for DOCTOR role)
     */
    public List<Appointment> getAppointmentsByDoctorUsername(String username) {
        // First find the doctor user by username
        Optional<User> doctorOptional = userRepository.findByUsername(username);
        if (!doctorOptional.isPresent()) {
            throw new IllegalArgumentException("Doctor not found with username: " + username);
        }
        
        User doctor = doctorOptional.get();
        if (doctor.getRole() != User.Role.DOCTOR) {
            throw new IllegalArgumentException("User is not a doctor: " + username);
        }
        
        // Get appointments where this doctor is assigned
        return appointmentRepository.findByDoctor(doctor);
    }

    /**
     * Xóa appointment vĩnh viễn
     */
    public void deleteAppointment(Long id) {
        logger.info("Permanently deleting appointment with ID: {}", id);
        
        Optional<Appointment> appointmentOptional = appointmentRepository.findById(id);
        if (!appointmentOptional.isPresent()) {
            throw new IllegalArgumentException("Appointment not found with ID: " + id);
        }
        
        appointmentRepository.deleteById(id);
        logger.info("Appointment with ID {} has been permanently deleted", id);
    }
} 
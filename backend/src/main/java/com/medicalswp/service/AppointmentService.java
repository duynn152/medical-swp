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
        
        // Update fields
        appointment.setFullName(appointmentDetails.getFullName());
        appointment.setPhone(appointmentDetails.getPhone());
        appointment.setEmail(appointmentDetails.getEmail());
        appointment.setAppointmentDate(appointmentDetails.getAppointmentDate());
        appointment.setAppointmentTime(appointmentDetails.getAppointmentTime());
        appointment.setDepartment(appointmentDetails.getDepartment());
        appointment.setReason(appointmentDetails.getReason());
        appointment.setStatus(appointmentDetails.getStatus());
        appointment.setNotes(appointmentDetails.getNotes());
        
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
    public boolean isTimeSlotAvailable(LocalDate date, LocalTime time, String department) {
        Long count = appointmentRepository.countByDateTimeAndDepartment(date, time, department);
        return count < 3; // Max 3 appointments per time slot per department
    }
    
    /**
     * Lấy tất cả appointments
     */
    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
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
        return appointmentRepository.findByStatus(status);
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
} 
package com.medicalswp.repository;

import com.medicalswp.entity.Appointment;
import com.medicalswp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    
    // Find appointments by status
    List<Appointment> findByStatus(Appointment.AppointmentStatus status);
    
    // Find appointments by status with user and doctor data eagerly loaded
    @Query("SELECT a FROM Appointment a LEFT JOIN FETCH a.user LEFT JOIN FETCH a.doctor WHERE a.status = :status")
    List<Appointment> findByStatusWithUserAndDoctor(@Param("status") Appointment.AppointmentStatus status);
    
    // Find appointments by date
    List<Appointment> findByAppointmentDate(LocalDate date);
    
    // Find appointments by department
    List<Appointment> findByDepartment(Appointment.Department department);
    
    // Find appointments by email
    List<Appointment> findByEmailContainingIgnoreCase(String email);
    
    // Find appointments by user
    List<Appointment> findByUser(User user);
    
    // Find appointments by doctor
    List<Appointment> findByDoctor(User doctor);
    
    // Find appointments in date range
    List<Appointment> findByAppointmentDateBetween(LocalDate startDate, LocalDate endDate);
    
    // Check time slot availability
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.appointmentDate = :date " +
           "AND a.appointmentTime = :time AND a.department = :department " +
           "AND a.status NOT IN ('CANCELLED')")
    Long countByDateTimeAndDepartment(@Param("date") LocalDate date, 
                                     @Param("time") LocalTime time, 
                                     @Param("department") Appointment.Department department);
    
    // Find appointments that need reminder emails (1 day before)
    @Query("SELECT a FROM Appointment a WHERE a.appointmentDate = :reminderDate " +
           "AND a.reminderSent = false AND a.status = 'CONFIRMED' " +
           "AND a.email IS NOT NULL AND a.email != ''")
    List<Appointment> findAppointmentsForReminder(@Param("reminderDate") LocalDate reminderDate);
    
    // Find appointments that need confirmation emails
    @Query("SELECT a FROM Appointment a WHERE a.emailSent = false " +
           "AND a.email IS NOT NULL AND a.email != ''")
    List<Appointment> findAppointmentsNeedingConfirmationEmail();
    
    // Find today's appointments
    @Query("SELECT a FROM Appointment a WHERE a.appointmentDate = :today " +
           "AND a.status IN ('CONFIRMED', 'PENDING') ORDER BY a.appointmentTime")
    List<Appointment> findTodaysAppointments(@Param("today") LocalDate today);
    
    // Find upcoming appointments (next 7 days)
    @Query("SELECT a FROM Appointment a WHERE a.appointmentDate BETWEEN :today AND :oneWeekLater " +
           "AND a.status IN ('CONFIRMED', 'PENDING') ORDER BY a.appointmentDate, a.appointmentTime")
    List<Appointment> findUpcomingAppointments(@Param("today") LocalDate today, 
                                             @Param("oneWeekLater") LocalDate oneWeekLater);
    
    // Search appointments by patient name
    List<Appointment> findByFullNameContainingIgnoreCase(String name);
    
    // Find appointments by phone number
    List<Appointment> findByPhoneContaining(String phone);
    
    // Count appointments by status
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.status = :status")
    Long countByStatus(@Param("status") Appointment.AppointmentStatus status);
    
    // Count appointments for today
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.appointmentDate = :today")
    Long countTodaysAppointments(@Param("today") LocalDate today);
    
    // Find all appointments with user and doctor data eagerly loaded
    @Query("SELECT a FROM Appointment a LEFT JOIN FETCH a.user LEFT JOIN FETCH a.doctor")
    List<Appointment> findAllWithUserAndDoctor();
} 
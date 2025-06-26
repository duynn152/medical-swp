package com.medicalswp.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "appointments")
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Appointment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank
    @Size(max = 100)
    private String fullName;
    
    @NotBlank
    @Size(max = 20)
    private String phone;
    
    @Email
    @Size(max = 100)
    private String email;
    
    @NotNull
    private LocalDate appointmentDate;
    
    @NotNull
    private LocalTime appointmentTime;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Department department;
    
    @Size(max = 1000)
    private String reason;
    
    @Enumerated(EnumType.STRING)
    private AppointmentStatus status = AppointmentStatus.PENDING;
    
    @Column(nullable = false)
    private Boolean emailSent = false;
    
    @Column(nullable = false)
    private Boolean reminderSent = false;
    
    // Reference to user if registered
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    
    // Assigned doctor
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id")
    private User doctor;
    
    @Size(max = 500)
    private String notes; // Doctor's notes
    
    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    // Constructors
    public Appointment() {}
    
    public Appointment(String fullName, String phone, String email, 
                      LocalDate appointmentDate, LocalTime appointmentTime, 
                      Department department, String reason) {
        this.fullName = fullName;
        this.phone = phone;
        this.email = email;
        this.appointmentDate = appointmentDate;
        this.appointmentTime = appointmentTime;
        this.department = department;
        this.reason = reason;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getFullName() {
        return fullName;
    }
    
    public void setFullName(String fullName) {
        this.fullName = fullName;
    }
    
    public String getPhone() {
        return phone;
    }
    
    public void setPhone(String phone) {
        this.phone = phone;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public LocalDate getAppointmentDate() {
        return appointmentDate;
    }
    
    public void setAppointmentDate(LocalDate appointmentDate) {
        this.appointmentDate = appointmentDate;
    }
    
    public LocalTime getAppointmentTime() {
        return appointmentTime;
    }
    
    public void setAppointmentTime(LocalTime appointmentTime) {
        this.appointmentTime = appointmentTime;
    }
    
    public Department getDepartment() {
        return department;
    }
    
    public void setDepartment(Department department) {
        this.department = department;
    }
    
    public String getReason() {
        return reason;
    }
    
    public void setReason(String reason) {
        this.reason = reason;
    }
    
    public AppointmentStatus getStatus() {
        return status;
    }
    
    public void setStatus(AppointmentStatus status) {
        this.status = status;
    }
    
    public Boolean getEmailSent() {
        return emailSent;
    }
    
    public void setEmailSent(Boolean emailSent) {
        this.emailSent = emailSent;
    }
    
    public Boolean getReminderSent() {
        return reminderSent;
    }
    
    public void setReminderSent(Boolean reminderSent) {
        this.reminderSent = reminderSent;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public User getDoctor() {
        return doctor;
    }
    
    public void setDoctor(User doctor) {
        this.doctor = doctor;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public enum AppointmentStatus {
        PENDING,      // Chờ xác nhận
        CONFIRMED,    // Đã xác nhận
        CANCELLED,    // Đã hủy
        COMPLETED,    // Đã hoàn thành
        NO_SHOW       // Không đến
    }
    
    // Department enum synchronized with User.MedicalSpecialty
    public enum Department {
        CARDIOLOGY("Khoa Tim mạch", "Tim mạch"),
        NEUROLOGY("Khoa Thần kinh", "Thần kinh"),
        DERMATOLOGY("Khoa Da liễu", "Da liễu"),
        ORTHOPEDICS("Khoa Chấn thương chỉnh hình", "Chấn thương chỉnh hình"),
        PEDIATRICS("Khoa Nhi", "Nhi khoa"),
        GYNECOLOGY("Khoa Sản phụ khoa", "Phụ khoa"),
        INTERNAL_MEDICINE("Khoa Nội tổng hợp", "Nội khoa"),
        SURGERY("Khoa Ngoại tổng hợp", "Ngoại khoa"),
        ONCOLOGY("Khoa Ung bướu", "Ung bướu"),
        PSYCHIATRY("Khoa Tâm thần", "Tâm thần"),
        OPHTHALMOLOGY("Khoa Mắt", "Mắt"),
        ENT("Khoa Tai mũi họng", "Tai mũi họng"),
        UROLOGY("Khoa Tiết niệu", "Tiết niệu"),
        GASTROENTEROLOGY("Khoa Tiêu hóa", "Tiêu hóa"),
        PULMONOLOGY("Khoa Hô hấp", "Hô hấp"),
        ENDOCRINOLOGY("Khoa Nội tiết", "Nội tiết"),
        NEPHROLOGY("Khoa Thận", "Thận"),
        RHEUMATOLOGY("Khoa Khớp", "Khớp"),
        RADIOLOGY("Khoa Chẩn đoán hình ảnh", "Chẩn đoán hình ảnh"),
        ANESTHESIOLOGY("Khoa Gây mê hồi sức", "Gây mê hồi sức"),
        EMERGENCY_MEDICINE("Khoa Cấp cứu", "Cấp cứu"),
        GENERAL_PRACTICE("Khoa Đa khoa", "Đa khoa");
        
        private final String departmentName;
        private final String specialtyName;
        
        Department(String departmentName, String specialtyName) {
            this.departmentName = departmentName;
            this.specialtyName = specialtyName;
        }
        
        public String getDepartmentName() {
            return departmentName;
        }
        
        public String getSpecialtyName() {
            return specialtyName;
        }
        
        // Get corresponding User.MedicalSpecialty
        public static User.MedicalSpecialty toMedicalSpecialty(Department department) {
            return User.MedicalSpecialty.valueOf(department.name());
        }
        
        // Get Department from User.MedicalSpecialty
        public static Department fromMedicalSpecialty(User.MedicalSpecialty specialty) {
            return Department.valueOf(specialty.name());
        }
    }
    
    @Override
    public String toString() {
        return "Appointment{" +
                "id=" + id +
                ", fullName='" + fullName + '\'' +
                ", phone='" + phone + '\'' +
                ", email='" + email + '\'' +
                ", appointmentDate=" + appointmentDate +
                ", appointmentTime=" + appointmentTime +
                ", department='" + department + '\'' +
                ", status=" + status +
                ", createdAt=" + createdAt +
                '}';
    }
} 
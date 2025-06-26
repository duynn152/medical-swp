package com.medicalswp.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank
    @Size(max = 50)
    @Column(unique = true)
    private String username;
    
    @NotBlank
    @Size(max = 100)
    @Email
    @Column(unique = true)
    private String email;
    
    @NotBlank
    @Size(max = 100)
    private String password;
    
    @NotBlank
    @Size(max = 100)
    private String fullName;
    
    private LocalDate birth;
    
    @Enumerated(EnumType.STRING)
    private Gender gender;
    
    @Enumerated(EnumType.STRING)
    private Role role = Role.PATIENT;
    
    // Medical specialty for doctors
    @Enumerated(EnumType.STRING)
    private MedicalSpecialty specialty;
    
    @Column(nullable = false)
    private Boolean active = true;
    
    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    // Default constructor
    public User() {}
    
    // Constructor with basic fields
    public User(String username, String email, String password, String fullName) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.fullName = fullName;
    }
    
    // Constructor with all fields
    public User(String username, String email, String password, String fullName, 
                LocalDate birth, Gender gender, Role role) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.fullName = fullName;
        this.birth = birth;
        this.gender = gender;
        this.role = role;
    }
    
    // Constructor with specialty
    public User(String username, String email, String password, String fullName, 
                LocalDate birth, Gender gender, Role role, MedicalSpecialty specialty) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.fullName = fullName;
        this.birth = birth;
        this.gender = gender;
        this.role = role;
        this.specialty = specialty;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getPassword() {
        return password;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
    
    public String getFullName() {
        return fullName;
    }
    
    public void setFullName(String fullName) {
        this.fullName = fullName;
    }
    
    public LocalDate getBirth() {
        return birth;
    }
    
    public void setBirth(LocalDate birth) {
        this.birth = birth;
    }
    
    public Gender getGender() {
        return gender;
    }
    
    public void setGender(Gender gender) {
        this.gender = gender;
    }
    
    public Role getRole() {
        return role;
    }
    
    public void setRole(Role role) {
        this.role = role;
    }
    
    public MedicalSpecialty getSpecialty() {
        return specialty;
    }
    
    public void setSpecialty(MedicalSpecialty specialty) {
        this.specialty = specialty;
    }
    
    public Boolean getActive() {
        return active;
    }
    
    public void setActive(Boolean active) {
        this.active = active;
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
    
    public enum Role {
        ADMIN, DOCTOR, STAFF, PATIENT
    }
    
    public enum Gender {
        MALE, FEMALE, OTHER
    }
    
    public enum MedicalSpecialty {
        CARDIOLOGY("Tim mạch"),
        NEUROLOGY("Thần kinh"),
        DERMATOLOGY("Da liễu"),
        ORTHOPEDICS("Chấn thương chỉnh hình"),
        PEDIATRICS("Nhi khoa"),
        GYNECOLOGY("Phụ khoa"),
        INTERNAL_MEDICINE("Nội khoa"),
        SURGERY("Ngoại khoa"),
        ONCOLOGY("Ung bướu"),
        PSYCHIATRY("Tâm thần"),
        OPHTHALMOLOGY("Mắt"),
        ENT("Tai mũi họng"),
        UROLOGY("Tiết niệu"),
        GASTROENTEROLOGY("Tiêu hóa"),
        PULMONOLOGY("Hô hấp"),
        ENDOCRINOLOGY("Nội tiết"),
        NEPHROLOGY("Thận"),
        RHEUMATOLOGY("Khớp"),
        RADIOLOGY("Chẩn đoán hình ảnh"),
        ANESTHESIOLOGY("Gây mê hồi sức"),
        EMERGENCY_MEDICINE("Cấp cứu"),
        GENERAL_PRACTICE("Đa khoa");
        
        private final String displayName;
        
        MedicalSpecialty(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
    
    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", username='" + username + '\'' +
                ", email='" + email + '\'' +
                ", fullName='" + fullName + '\'' +
                ", birth=" + birth +
                ", gender=" + gender +
                ", role=" + role +
                ", specialty=" + specialty +
                ", active=" + active +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
} 
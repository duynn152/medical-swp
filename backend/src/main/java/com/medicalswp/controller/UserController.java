package com.medicalswp.controller;

import com.medicalswp.entity.User;
import com.medicalswp.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import jakarta.validation.Valid;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        Optional<User> user = userRepository.findById(id);
        return user.map(ResponseEntity::ok)
                  .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public List<User> searchUsers(@RequestParam String name) {
        return userRepository.findByFullNameContainingIgnoreCase(name);
    }

    @GetMapping("/role/{role}")
    public List<User> getUsersByRole(@PathVariable User.Role role) {
        return userRepository.findByRole(role);
    }

    @GetMapping("/specialties")
    public List<SpecialtyInfo> getMedicalSpecialties() {
        List<SpecialtyInfo> specialties = new ArrayList<>();
        for (User.MedicalSpecialty specialty : User.MedicalSpecialty.values()) {
            specialties.add(new SpecialtyInfo(specialty.name(), specialty.getDisplayName()));
        }
        return specialties;
    }

    public static class SpecialtyInfo {
        public String code;
        public String displayName;
        
        public SpecialtyInfo(String code, String displayName) {
            this.code = code;
            this.displayName = displayName;
        }
        
        // Getters
        public String getCode() { return code; }
        public String getDisplayName() { return displayName; }
    }

    @PostMapping
    public ResponseEntity<User> createUser(@Valid @RequestBody User user) {
        // Check if username or email already exists
        if (userRepository.existsByUsername(user.getUsername())) {
            return ResponseEntity.badRequest().build();
        }
        if (userRepository.existsByEmail(user.getEmail())) {
            return ResponseEntity.badRequest().build();
        }

        // Encode password
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        
        User savedUser = userRepository.save(user);
        return ResponseEntity.ok(savedUser);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User userDetails) {
        System.out.println("DEBUG: Updating user with ID: " + id);
        System.out.println("DEBUG: User details: " + userDetails);
        
        Optional<User> userOptional = userRepository.findById(id);
        if (!userOptional.isPresent()) {
            System.out.println("DEBUG: User not found with ID: " + id);
            return ResponseEntity.notFound().build();
        }

        User user = userOptional.get();
        System.out.println("DEBUG: Current user: " + user);
        
        // Manual validation for required fields
        if (userDetails.getUsername() == null || userDetails.getUsername().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Username is required");
        }
        if (userDetails.getEmail() == null || userDetails.getEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Email is required");
        }
        if (userDetails.getFullName() == null || userDetails.getFullName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Full name is required");
        }
        
        // Check if username already exists for another user
        if (!user.getUsername().equals(userDetails.getUsername()) && 
            userRepository.existsByUsername(userDetails.getUsername())) {
            System.out.println("DEBUG: Username already exists: " + userDetails.getUsername());
            return ResponseEntity.badRequest().body("Username '" + userDetails.getUsername() + "' already exists");
        }
        
        // Check if email already exists for another user  
        if (!user.getEmail().equals(userDetails.getEmail()) && 
            userRepository.existsByEmail(userDetails.getEmail())) {
            System.out.println("DEBUG: Email already exists: " + userDetails.getEmail());
            return ResponseEntity.badRequest().body("Email '" + userDetails.getEmail() + "' already exists");
        }
        
        user.setUsername(userDetails.getUsername());
        user.setEmail(userDetails.getEmail());
        user.setFullName(userDetails.getFullName());
        user.setBirth(userDetails.getBirth());
        user.setGender(userDetails.getGender());
        user.setRole(userDetails.getRole());
        user.setSpecialty(userDetails.getSpecialty());
        user.setActive(userDetails.getActive());
        
        // Only update password if provided
        if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(userDetails.getPassword()));
        }

        try {
            User updatedUser = userRepository.save(user);
            System.out.println("DEBUG: User updated successfully: " + updatedUser);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            System.out.println("DEBUG: Error saving user: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error updating user: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        // Security: Prevent deletion of ADMIN users
        Optional<User> userOptional = userRepository.findById(id);
        if (userOptional.isPresent() && userOptional.get().getRole() == User.Role.ADMIN) {
            return ResponseEntity.badRequest().body("Cannot delete ADMIN users for security reasons");
        }

        userRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<User> deactivateUser(@PathVariable Long id) {
        Optional<User> userOptional = userRepository.findById(id);
        if (!userOptional.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOptional.get();
        user.setActive(false);
        User updatedUser = userRepository.save(user);
        return ResponseEntity.ok(updatedUser);
    }

    @PostMapping("/import")
    public ResponseEntity<ImportResult> importUsers(@RequestParam("file") MultipartFile file) {
        ImportResult result = new ImportResult();
        
        if (file.isEmpty()) {
            result.errors.add("File is empty");
            return ResponseEntity.badRequest().body(result);
        }

        try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            
            // Skip header row
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                
                try {
                    User user = parseUserFromRow(row, i + 1);
                    if (user != null) {
                        // Check if username or email already exists
                        if (userRepository.existsByUsername(user.getUsername())) {
                            result.errors.add("Row " + (i + 1) + ": Username '" + user.getUsername() + "' already exists");
                            result.failed++;
                            continue;
                        }
                        if (userRepository.existsByEmail(user.getEmail())) {
                            result.errors.add("Row " + (i + 1) + ": Email '" + user.getEmail() + "' already exists");
                            result.failed++;
                            continue;
                        }
                        
                        // Set password to username (encoded)
                        user.setPassword(passwordEncoder.encode(user.getUsername()));
                        user.setActive(true);
                        
                        User savedUser = userRepository.save(user);
                        result.users.add(savedUser);
                        result.success++;
                    }
                } catch (Exception e) {
                    result.errors.add("Row " + (i + 1) + ": " + e.getMessage());
                    result.failed++;
                }
            }
        } catch (IOException e) {
            result.errors.add("Error reading Excel file: " + e.getMessage());
            return ResponseEntity.badRequest().body(result);
        }
        
        return ResponseEntity.ok(result);
    }
    
    private User parseUserFromRow(Row row, int rowNum) {
        // Expected columns: Full Name, Username, Email, Birth Date, Gender, Role, Specialty (for doctors)
        if (row.getPhysicalNumberOfCells() < 3) {
            throw new RuntimeException("Missing required columns (minimum: Full Name, Username, Email)");
        }
        
        User user = new User();
        
        // Full Name (required)
        Cell fullNameCell = row.getCell(0);
        if (fullNameCell == null || fullNameCell.getStringCellValue().trim().isEmpty()) {
            throw new RuntimeException("Full Name is required");
        }
        user.setFullName(fullNameCell.getStringCellValue().trim());
        
        // Username (required)
        Cell usernameCell = row.getCell(1);
        if (usernameCell == null || usernameCell.getStringCellValue().trim().isEmpty()) {
            throw new RuntimeException("Username is required");
        }
        user.setUsername(usernameCell.getStringCellValue().trim());
        
        // Email (required)
        Cell emailCell = row.getCell(2);
        if (emailCell == null || emailCell.getStringCellValue().trim().isEmpty()) {
            throw new RuntimeException("Email is required");
        }
        user.setEmail(emailCell.getStringCellValue().trim());
        
        // Birth Date (optional)
        Cell birthCell = row.getCell(3);
        if (birthCell != null && !birthCell.getStringCellValue().trim().isEmpty()) {
            try {
                LocalDate birthDate = LocalDate.parse(birthCell.getStringCellValue().trim(), DateTimeFormatter.ISO_LOCAL_DATE);
                user.setBirth(birthDate);
            } catch (DateTimeParseException e) {
                throw new RuntimeException("Invalid birth date format. Use YYYY-MM-DD");
            }
        }
        
        // Gender (optional, default to MALE)
        Cell genderCell = row.getCell(4);
        if (genderCell != null && !genderCell.getStringCellValue().trim().isEmpty()) {
            try {
                User.Gender gender = User.Gender.valueOf(genderCell.getStringCellValue().trim().toUpperCase());
                user.setGender(gender);
            } catch (IllegalArgumentException e) {
                user.setGender(User.Gender.MALE); // Default
            }
        } else {
            user.setGender(User.Gender.MALE);
        }
        
        // Role (optional, default to PATIENT)
        Cell roleCell = row.getCell(5);
        if (roleCell != null && !roleCell.getStringCellValue().trim().isEmpty()) {
            try {
                User.Role role = User.Role.valueOf(roleCell.getStringCellValue().trim().toUpperCase());
                // Security: Do not allow ADMIN role to be imported via Excel
                if (role == User.Role.ADMIN) {
                    throw new RuntimeException("ADMIN role cannot be imported via Excel for security reasons");
                }
                user.setRole(role);
            } catch (IllegalArgumentException e) {
                user.setRole(User.Role.PATIENT); // Default
            }
        } else {
            user.setRole(User.Role.PATIENT);
        }
        
        // Specialty (optional, only for doctors)
        Cell specialtyCell = row.getCell(6);
        if (specialtyCell != null && !specialtyCell.getStringCellValue().trim().isEmpty() && 
            user.getRole() == User.Role.DOCTOR) {
            try {
                User.MedicalSpecialty specialty = User.MedicalSpecialty.valueOf(specialtyCell.getStringCellValue().trim().toUpperCase());
                user.setSpecialty(specialty);
            } catch (IllegalArgumentException e) {
                // If invalid specialty, leave it null or set to a default
                user.setSpecialty(User.MedicalSpecialty.GENERAL_PRACTICE);
            }
        }
        
        return user;
    }
    
    public static class ImportResult {
        public int success = 0;
        public int failed = 0;
        public List<String> errors = new ArrayList<>();
        public List<User> users = new ArrayList<>();
        
        // Getters and setters
        public int getSuccess() { return success; }
        public void setSuccess(int success) { this.success = success; }
        
        public int getFailed() { return failed; }
        public void setFailed(int failed) { this.failed = failed; }
        
        public List<String> getErrors() { return errors; }
        public void setErrors(List<String> errors) { this.errors = errors; }
        
        public List<User> getUsers() { return users; }
        public void setUsers(List<User> users) { this.users = users; }
    }

    @PutMapping("/profile")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> updateMyProfile(@RequestBody User profileData, Authentication authentication) {
        try {
            String username = authentication.getName();
            
            // Find current user by username
            Optional<User> userOptional = userRepository.findByUsername(username);
            if (!userOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            User currentUser = userOptional.get();
            
            // Only allow patients to update their own profile
            if (currentUser.getRole() != User.Role.PATIENT) {
                return ResponseEntity.badRequest().body("Only patients can update profile via this endpoint");
            }
            
            // Update allowed fields
            if (profileData.getFullName() != null && !profileData.getFullName().trim().isEmpty()) {
                currentUser.setFullName(profileData.getFullName());
            }
            if (profileData.getBirth() != null) {
                currentUser.setBirth(profileData.getBirth());
            }
            if (profileData.getGender() != null) {
                currentUser.setGender(profileData.getGender());
            }
            if (profileData.getPhone() != null) {
                currentUser.setPhone(profileData.getPhone());
            }
            
            // Save updated user
            User updatedUser = userRepository.save(currentUser);
            
            // Remove sensitive information from response
            updatedUser.setPassword(null);
            
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error updating profile: " + e.getMessage());
        }
    }

    @GetMapping("/profile")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getMyProfile(Authentication authentication) {
        try {
            String username = authentication.getName();
            
            // Find current user by username
            Optional<User> userOptional = userRepository.findByUsername(username);
            if (!userOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            User currentUser = userOptional.get();
            
            // Remove sensitive information from response
            currentUser.setPassword(null);
            
            return ResponseEntity.ok(currentUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching profile: " + e.getMessage());
        }
    }
} 
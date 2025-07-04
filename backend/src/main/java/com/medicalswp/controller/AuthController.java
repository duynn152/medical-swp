package com.medicalswp.controller;

import com.medicalswp.entity.User;
import com.medicalswp.service.UserDetailsServiceImpl;
import com.medicalswp.util.JwtUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Tag(name = "Authentication", description = "API xác thực và quản lý phiên đăng nhập")
@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Operation(
        summary = "Đăng nhập hệ thống", 
        description = "Xác thực người dùng và trả về JWT token để sử dụng cho các API khác"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Đăng nhập thành công",
                content = @Content(mediaType = "application/json", 
                schema = @Schema(implementation = LoginResponse.class))),
        @ApiResponse(responseCode = "400", description = "Thông tin đăng nhập không chính xác")
    })
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Parameter(description = "Thông tin đăng nhập", required = true)
            @Valid @RequestBody LoginRequest loginRequest) {
        try {
            // Authenticate user
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    loginRequest.getUsernameOrEmail(),
                    loginRequest.getPassword()
                )
            );

            // Get user details
            User user = userDetailsService.getUserByUsernameOrEmail(loginRequest.getUsernameOrEmail());
            
            // Generate JWT token
            String jwt = jwtUtil.generateToken(
                user.getUsername(), 
                user.getRole().name(), 
                user.getId()
            );

            return ResponseEntity.ok(new LoginResponse(
                jwt,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getRole().name()
            ));

        } catch (BadCredentialsException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Invalid username/email or password"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Authentication failed: " + e.getMessage()));
        }
    }

    @Operation(
        summary = "Xác thực JWT token", 
        description = "Kiểm tra tính hợp lệ của JWT token và trả về thông tin người dùng"
    )
    @ApiResponse(responseCode = "200", description = "Kết quả xác thực token")
    @PostMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestBody TokenValidationRequest request) {
        try {
            if (jwtUtil.validateToken(request.getToken())) {
                String username = jwtUtil.extractUsername(request.getToken());
                String role = jwtUtil.extractRole(request.getToken());
                Long userId = jwtUtil.extractUserId(request.getToken());
                
                return ResponseEntity.ok(new TokenValidationResponse(true, username, role, userId));
            } else {
                return ResponseEntity.ok(new TokenValidationResponse(false, null, null, null));
            }
        } catch (Exception e) {
            return ResponseEntity.ok(new TokenValidationResponse(false, null, null, null));
        }
    }

    @Operation(
        summary = "Debug thông tin xác thực", 
        description = "Endpoint để debug thông tin xác thực hiện tại (chỉ để phát triển)"
    )
    @GetMapping("/debug")
    public ResponseEntity<?> debugAuth(HttpServletRequest request) {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null) {
                return ResponseEntity.ok("No Authorization header");
            }
            
            if (!authHeader.startsWith("Bearer ")) {
                return ResponseEntity.ok("Authorization header doesn't start with Bearer");
            }
            
            String token = authHeader.substring(7);
            String username = jwtUtil.extractUsername(token);
            String role = jwtUtil.extractRole(token);
            Long userId = jwtUtil.extractUserId(token);
            boolean isValid = jwtUtil.validateToken(token);
            
            return ResponseEntity.ok(Map.of(
                "authHeader", "Present",
                "tokenLength", token.length(),
                "username", username,
                "role", role,
                "userId", userId,
                "isValid", isValid,
                "currentAuth", SecurityContextHolder.getContext().getAuthentication() != null ? 
                    SecurityContextHolder.getContext().getAuthentication().getName() : "No authentication"
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("error", e.getMessage()));
        }
    }

    @Operation(
        summary = "Tạo admin đầu tiên", 
        description = "Tạo tài khoản admin đầu tiên cho hệ thống (chỉ được phép khi chưa có admin nào)"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Tạo admin thành công"),
        @ApiResponse(responseCode = "400", description = "Đã tồn tại admin hoặc dữ liệu không hợp lệ")
    })
    @PostMapping("/create-first-admin")
    public ResponseEntity<?> createFirstAdmin(@Valid @RequestBody CreateFirstAdminRequest request) {
        try {
            // Check if any admin already exists
            List<User> existingAdmins = userDetailsService.getUsersByRole(User.Role.ADMIN);
            if (!existingAdmins.isEmpty()) {
                return ResponseEntity.badRequest().body(new ErrorResponse("Admin users already exist. Use regular user creation."));
            }

            // Create the first admin user
            User newAdmin = new User();
            newAdmin.setUsername(request.getUsername());
            newAdmin.setEmail(request.getEmail());
            newAdmin.setPassword(passwordEncoder.encode(request.getPassword()));
            newAdmin.setFullName(request.getFullName());
            newAdmin.setBirth(LocalDate.parse(request.getBirth()));
            newAdmin.setGender(User.Gender.valueOf(request.getGender()));
            newAdmin.setRole(User.Role.ADMIN);
            newAdmin.setActive(true);

            User savedAdmin = userDetailsService.saveUser(newAdmin);
            
            return ResponseEntity.ok(new CreateFirstAdminResponse(
                savedAdmin.getId(),
                savedAdmin.getUsername(),
                savedAdmin.getEmail(),
                savedAdmin.getFullName(),
                savedAdmin.getRole().name()
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse("Failed to create admin: " + e.getMessage()));
        }
    }

    // Request/Response DTOs
    public static class LoginRequest {
        private String usernameOrEmail;
        private String password;

        public String getUsernameOrEmail() {
            return usernameOrEmail;
        }

        public void setUsernameOrEmail(String usernameOrEmail) {
            this.usernameOrEmail = usernameOrEmail;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }
    }

    public static class LoginResponse {
        private String token;
        private Long userId;
        private String username;
        private String email;
        private String fullName;
        private String role;

        public LoginResponse(String token, Long userId, String username, String email, String fullName, String role) {
            this.token = token;
            this.userId = userId;
            this.username = username;
            this.email = email;
            this.fullName = fullName;
            this.role = role;
        }

        // Getters
        public String getToken() { return token; }
        public Long getUserId() { return userId; }
        public String getUsername() { return username; }
        public String getEmail() { return email; }
        public String getFullName() { return fullName; }
        public String getRole() { return role; }
    }

    public static class TokenValidationRequest {
        private String token;

        public String getToken() {
            return token;
        }

        public void setToken(String token) {
            this.token = token;
        }
    }

    public static class TokenValidationResponse {
        private boolean valid;
        private String username;
        private String role;
        private Long userId;

        public TokenValidationResponse(boolean valid, String username, String role, Long userId) {
            this.valid = valid;
            this.username = username;
            this.role = role;
            this.userId = userId;
        }

        // Getters
        public boolean isValid() { return valid; }
        public String getUsername() { return username; }
        public String getRole() { return role; }
        public Long getUserId() { return userId; }
    }

    public static class ErrorResponse {
        private String message;

        public ErrorResponse(String message) {
            this.message = message;
        }

        public String getMessage() {
            return message;
        }
    }

    public static class CreateFirstAdminRequest {
        private String username;
        private String email;
        private String password;
        private String fullName;
        private String birth;
        private String gender;

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

        public String getBirth() {
            return birth;
        }

        public void setBirth(String birth) {
            this.birth = birth;
        }

        public String getGender() {
            return gender;
        }

        public void setGender(String gender) {
            this.gender = gender;
        }
    }

    public static class CreateFirstAdminResponse {
        private Long userId;
        private String username;
        private String email;
        private String fullName;
        private String role;

        public CreateFirstAdminResponse(Long userId, String username, String email, String fullName, String role) {
            this.userId = userId;
            this.username = username;
            this.email = email;
            this.fullName = fullName;
            this.role = role;
        }

        // Getters
        public Long getUserId() { return userId; }
        public String getUsername() { return username; }
        public String getEmail() { return email; }
        public String getFullName() { return fullName; }
        public String getRole() { return role; }
    }
} 
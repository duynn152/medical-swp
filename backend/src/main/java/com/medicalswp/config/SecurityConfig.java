package com.medicalswp.config;

import com.medicalswp.filter.JwtAuthenticationFilter;
import com.medicalswp.service.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.http.HttpMethod;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig implements WebMvcConfigurer {

    @Value("${cors.allowed-origins}")
    private String allowedOrigins;
    
    @Value("${cors.allowed-methods}")
    private String allowedMethods;
    
    @Value("${cors.allowed-headers}")
    private String allowedHeaders;
    
    @Value("${cors.allow-credentials}")
    private boolean allowCredentials;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    
    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/health", "/actuator/**").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/public/**").permitAll()
                .requestMatchers("/uploads/**").permitAll()
                
                // Allow public access to published blog content
                .requestMatchers(HttpMethod.GET, "/blogs/published", "/blogs/featured", "/blogs/category/**", "/blogs/search").permitAll()
                
                // Allow public access to appointment booking endpoints (phải đứng trước /appointments/**)
                .requestMatchers("/appointments/public/**").permitAll()
                
                // Temporarily allow appointments access for testing
                .requestMatchers(HttpMethod.GET, "/appointments/**").permitAll()
                .requestMatchers(HttpMethod.PUT, "/appointments/*/confirm-with-doctor").permitAll()
                
                // All other blog operations require authentication with proper roles
                .requestMatchers(HttpMethod.GET, "/blogs").hasAnyAuthority("ROLE_ADMIN", "ROLE_DOCTOR", "ROLE_STAFF")
                .requestMatchers(HttpMethod.POST, "/blogs/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_DOCTOR", "ROLE_STAFF")
                .requestMatchers(HttpMethod.PUT, "/blogs/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_DOCTOR", "ROLE_STAFF")
                .requestMatchers(HttpMethod.DELETE, "/blogs/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_DOCTOR", "ROLE_STAFF")
                
                // User management - admin only
                .requestMatchers("/users/**").hasAuthority("ROLE_ADMIN")
                
                // Appointment management - phải đứng sau /appointments/public/**
                // .requestMatchers("/appointments/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_DOCTOR", "ROLE_STAFF")
                
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(HttpSecurity http) throws Exception {
        AuthenticationManagerBuilder authenticationManagerBuilder = 
            http.getSharedObject(AuthenticationManagerBuilder.class);
        authenticationManagerBuilder
            .userDetailsService(userDetailsService)
            .passwordEncoder(passwordEncoder());
        return authenticationManagerBuilder.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Set allowed origins
        configuration.setAllowedOriginPatterns(Arrays.asList(allowedOrigins.split(",")));
        
        // Set allowed methods
        configuration.setAllowedMethods(Arrays.asList(allowedMethods.split(",")));
        
        // Set allowed headers
        if ("*".equals(allowedHeaders)) {
            configuration.setAllowedHeaders(Arrays.asList("*"));
        } else {
            configuration.setAllowedHeaders(Arrays.asList(allowedHeaders.split(",")));
        }
        
        // Set allow credentials
        configuration.setAllowCredentials(allowCredentials);
        
        // Expose headers that might be needed by the frontend
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept"));
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve uploaded blog images
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/")
                .setCachePeriod(3600); // Cache for 1 hour
    }
} 
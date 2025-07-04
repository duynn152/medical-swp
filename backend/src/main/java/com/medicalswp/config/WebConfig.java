package com.medicalswp.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.lang.NonNull;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
    private String[] allowedOrigins;

    @Value("${cors.allowed-methods:GET,POST,PUT,DELETE,OPTIONS}")
    private String allowedMethods;

    @Value("${cors.allowed-headers:*}")
    private String allowedHeaders;

    @Value("${cors.allow-credentials:true}")
    private boolean allowCredentials;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
            .allowedOrigins(allowedOrigins)
            .allowedMethods(allowedMethods.split(","))
            .allowedHeaders(allowedHeaders)
            .allowCredentials(allowCredentials)
            .maxAge(3600);
    }

    @Override
    public void addViewControllers(@NonNull ViewControllerRegistry registry) {
        // Redirect root path to Swagger UI
        registry.addRedirectViewController("/", "/swagger-ui/index.html");
        
        // Redirect /api to Swagger UI
        registry.addRedirectViewController("/api", "/swagger-ui/index.html");
        
        // Handle direct access to swagger-ui.html
        registry.addRedirectViewController("/swagger-ui.html", "/swagger-ui/index.html");
    }
} 
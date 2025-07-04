package com.medicalswp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.lang.NonNull;

@Configuration
public class WebConfig implements WebMvcConfigurer {

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
package com.medicalswp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // Since context-path is /api, the root within the context should redirect to Swagger
        registry.addRedirectViewController("/", "/swagger-ui.html");
        
        // Also handle direct access to /api within the context (this becomes /api/api in full URL)
        registry.addRedirectViewController("/api", "/swagger-ui.html");
        
        // Handle swagger-ui mapping
        registry.addViewController("/swagger-ui.html").setViewName("forward:/swagger-ui/index.html");
    }
} 
package com.medicalswp.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
    info = @Info(
        title = "Florism Care Medical API",
        version = "1.0.0",
        description = "API Documentation for Florism Care - Reproductive Health Platform",
        contact = @Contact(
            name = "Florism Care Team",
            email = "contact@florismcare.com",
            url = "https://florismcare.com"
        ),
        license = @License(
            name = "MIT License",
            url = "https://opensource.org/licenses/MIT"
        )
    ),
    servers = {
        @Server(
            description = "Development Server",
            url = "http://localhost:8080"
        ),
        @Server(
            description = "Production Server", 
            url = "https://your-production-url.com"
        )
    }
)
@SecurityScheme(
    name = "bearerAuth",
    type = SecuritySchemeType.HTTP,
    bearerFormat = "JWT",
    scheme = "bearer",
    description = "JWT Bearer token for authentication. Add 'Bearer ' prefix to your token."
)
public class OpenApiConfig {
    // This class provides OpenAPI configuration through annotations
} 
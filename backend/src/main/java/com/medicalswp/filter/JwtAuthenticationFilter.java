package com.medicalswp.filter;

import com.medicalswp.service.UserDetailsServiceImpl;
import com.medicalswp.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        final String authorizationHeader = request.getHeader("Authorization");
        logger.debug("Processing request: {} {}", request.getMethod(), request.getRequestURI());
        logger.debug("Authorization header: {}", authorizationHeader != null ? "Present" : "Missing");

        String username = null;
        String jwt = null;

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7);
            logger.debug("JWT token extracted, length: {}", jwt.length());
            try {
                username = jwtUtil.extractUsername(jwt);
                logger.debug("Username extracted from JWT: {}", username);
            } catch (Exception e) {
                logger.error("JWT token extraction failed: {}", e.getMessage(), e);
            }
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            logger.debug("Attempting to authenticate user: {}", username);
            try {
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                logger.debug("User details loaded for: {}, authorities: {}", username, userDetails.getAuthorities());

                if (jwtUtil.validateToken(jwt, userDetails)) {
                    logger.debug("JWT token is valid for user: {}", username);
                    UsernamePasswordAuthenticationToken authToken = 
                        new UsernamePasswordAuthenticationToken(
                            userDetails, 
                            null, 
                            userDetails.getAuthorities()
                        );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    logger.debug("Authentication set in SecurityContext for user: {}", username);
                } else {
                    logger.warn("JWT token validation failed for user: {}", username);
                }
            } catch (Exception e) {
                logger.error("Error during authentication process for user {}: {}", username, e.getMessage(), e);
                // Clear any partial authentication
                SecurityContextHolder.clearContext();
            }
        } else if (username == null && authorizationHeader != null) {
            logger.warn("Authorization header present but username could not be extracted");
        }

        filterChain.doFilter(request, response);
    }
} 
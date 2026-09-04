package com.nexus.scm.controller;

import com.nexus.scm.model.User;
import com.nexus.scm.repository.UserRepository;
import com.nexus.scm.security.JwtUtils;
import com.nexus.scm.security.UserDetailsImpl;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private JwtUtils jwtUtils;

    // Seeding default role-based test users on startup
    @PostConstruct
    public void seedUsers() {
        if (!userRepository.existsByUsername("admin")) {
            User admin = User.builder()
                    .username("admin")
                    .email("admin@nexus-scm.com")
                    .password(encoder.encode("adminPassword"))
                    .role("ROLE_ADMIN")
                    .build();
            userRepository.save(admin);
        }

        if (!userRepository.existsByUsername("manager")) {
            User manager = User.builder()
                    .username("manager")
                    .email("manager@nexus-scm.com")
                    .password(encoder.encode("managerPassword"))
                    .role("ROLE_MANAGER")
                    .build();
            userRepository.save(manager);
        }

        if (!userRepository.existsByUsername("operator")) {
            User operator = User.builder()
                    .username("operator")
                    .email("operator@nexus-scm.com")
                    .password(encoder.encode("operatorPassword"))
                    .role("ROLE_OPERATOR")
                    .build();
            userRepository.save(operator);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody Map<String, String> loginRequest) {
        String username = loginRequest.get("username");
        String password = loginRequest.get("password");

        if (username == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username and password are required"));
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();

        Map<String, Object> response = new HashMap<>();
        response.put("token", jwt);
        response.put("id", userDetails.getId());
        response.put("username", userDetails.getUsername());
        response.put("email", userDetails.getEmail());
        response.put("role", userDetails.getRole());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody Map<String, String> signUpRequest) {
        String username = signUpRequest.get("username");
        String email = signUpRequest.get("email");
        String password = signUpRequest.get("password");
        String requestedRole = signUpRequest.getOrDefault("role", "ROLE_OPERATOR");

        if (username == null || email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing required fields"));
        }

        if (userRepository.existsByUsername(username)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Error: Username is already taken!"));
        }

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Error: Email is already in use!"));
        }

        // Validate & map role input
        String role = "ROLE_OPERATOR";
        if (requestedRole != null) {
            String upper = requestedRole.toUpperCase();
            if (upper.equals("ROLE_ADMIN") || upper.equals("ADMIN")) {
                role = "ROLE_ADMIN";
            } else if (upper.equals("ROLE_MANAGER") || upper.equals("MANAGER")) {
                role = "ROLE_MANAGER";
            } else {
                role = "ROLE_OPERATOR";
            }
        }

        User user = User.builder()
                .username(username)
                .email(email)
                .password(encoder.encode(password))
                .role(role)
                .build();

        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "User registered successfully!", "role", role));
    }
}

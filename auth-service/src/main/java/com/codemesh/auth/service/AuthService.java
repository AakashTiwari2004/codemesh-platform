package com.codemesh.auth.service;

import com.codemesh.auth.model.User;
import com.codemesh.auth.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.regex.Pattern;

@Service
public class AuthService {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, JwtService jwtService, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    public String signup(User user) {
        String username = normalize(user.getUsername());
        String email = normalizeEmail(user.getEmail());
        String password = user.getPassword();

        if (username == null || username.isBlank()) {
            return "Username is required!";
        }
        if (username.length() < 3) {
            return "Username must be at least 3 characters!";
        }
        if (email == null || email.isBlank()) {
            return "Email is required!";
        }
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            return "Email format is invalid!";
        }
        if (password == null || password.isBlank()) {
            return "Password is required!";
        }
        if (password.length() < 6) {
            return "Password must be at least 6 characters!";
        }

        if (userRepository.existsByUsername(username)) {
            return "Username already exists!";
        }
        if (userRepository.existsByEmail(email)) {
            return "Email already exists!";
        }

        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        userRepository.save(user);
        return "Signup successful!";
    }

    public String login(User user) {
        String loginId = normalize(user.getUsername());
        if (loginId == null || loginId.isBlank()) {
            loginId = normalizeEmail(user.getEmail());
        }

        if (loginId == null || loginId.isBlank() || user.getPassword() == null || user.getPassword().isBlank()) {
            return "Invalid credentials!";
        }

        Optional<User> foundUser = loginId.contains("@")
                ? userRepository.findByEmail(normalizeEmail(loginId))
                : userRepository.findByUsername(loginId);

        if (foundUser.isEmpty()) {
            return "Invalid credentials!";
        }

        User savedUser = foundUser.get();
        boolean passwordMatched = passwordEncoder.matches(user.getPassword(), savedUser.getPassword());
        if (!passwordMatched && savedUser.getPassword().equals(user.getPassword())) {
            savedUser.setPassword(passwordEncoder.encode(user.getPassword()));
            userRepository.save(savedUser);
            passwordMatched = true;
        }
        if (!passwordMatched) {
            return "Invalid credentials!";
        }

        return jwtService.generateToken(savedUser.getUsername());
    }

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }

    private String normalizeEmail(String email) {
        String normalized = normalize(email);
        return normalized == null ? null : normalized.toLowerCase();
    }
}

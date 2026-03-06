package com.codemesh.auth.service;

import com.codemesh.auth.model.User;
import com.codemesh.auth.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    public String signup(User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            return "Username already exists!";
        }
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            user.setEmail(user.getUsername() + "@local.test");
        }
        userRepository.save(user);
        return "Signup successful!";
    }

    public String login(User user) {
        User savedUser = userRepository.findByUsername(user.getUsername()).orElse(null);
        if (savedUser == null || !savedUser.getPassword().equals(user.getPassword())) {
            return "Invalid credentials!";
        }
        return jwtService.generateToken(user.getUsername());
    }
}

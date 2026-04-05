package com.smartclassroom.service;

import com.smartclassroom.dto.LoginRequest;
import com.smartclassroom.dto.LoginResponse;
import com.smartclassroom.entity.User;
import com.smartclassroom.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {
    
    @Autowired
    private UserRepository userRepository;
    
    public LoginResponse login(LoginRequest request) {
        Optional<User> user = userRepository.findByEmailAndPassword(request.getEmail(), request.getPassword());
        
        if (user.isPresent()) {
            return createLoginResponse(user.get(), "Login successful");
        }
        
        return new LoginResponse(
            null, null, null, null, null, false, 
            "Invalid email or password"
        );
    }
    
    public User registerUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("User already exists");
        }
        return userRepository.save(user);
    }
    
    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }
    
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public LoginResponse createLoginResponse(User user, String message) {
        return new LoginResponse(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getRole().toString(),
            generateToken(user),
            true,
            message
        );
    }
    
    private String generateToken(User user) {
        return UUID.randomUUID().toString();
    }
}

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
            User loggedInUser = user.get();
            return new LoginResponse(
                loggedInUser.getId(),
                loggedInUser.getName(),
                loggedInUser.getEmail(),
                loggedInUser.getRole().toString(),
                generateToken(loggedInUser),
                true,
                "Login successful"
            );
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
    
    private String generateToken(User user) {
        return UUID.randomUUID().toString();
    }
}

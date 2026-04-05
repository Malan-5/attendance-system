package com.smartclassroom.controller;

import com.smartclassroom.dto.LoginRequest;
import com.smartclassroom.dto.LoginResponse;
import com.smartclassroom.dto.FaceLoginRequest;
import com.smartclassroom.entity.User;
import com.smartclassroom.service.FaceRecognitionService;
import com.smartclassroom.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:3000"})
public class AuthController {
    
    @Autowired
    private AuthService authService;

    @Autowired
    private FaceRecognitionService faceRecognitionService;
    
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        if (response.getSuccess()) {
            return ResponseEntity.ok(response);
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    @PostMapping("/face-login")
    public ResponseEntity<LoginResponse> faceLogin(@RequestBody FaceLoginRequest request) {
        return faceRecognitionService.authenticateByFace(request.getEmail(), request.getImageData())
            .filter(user -> user.getRole() != null && user.getRole() != com.smartclassroom.entity.UserRole.STUDENT)
            .map(user -> ResponseEntity.ok(authService.createLoginResponse(user, "Face login successful")))
            .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                new LoginResponse(null, null, null, null, null, false, "Face login failed")
            ));
    }
    
    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody User user) {
        try {
            User createdUser = authService.registerUser(user);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
    
    @GetMapping("/user/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return authService.getUserById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}

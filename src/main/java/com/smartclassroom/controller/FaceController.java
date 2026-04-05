package com.smartclassroom.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartclassroom.dto.FaceRecognitionRequest;
import com.smartclassroom.dto.FaceRecognitionResponse;
import com.smartclassroom.dto.FaceProfileSummaryDTO;
import com.smartclassroom.dto.FaceRegistrationRequest;
import com.smartclassroom.dto.FaceRegistrationResponse;
import com.smartclassroom.service.FaceRecognitionService;

@RestController
@RequestMapping("/api/faces")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:3000"})
public class FaceController {

    private final FaceRecognitionService faceRecognitionService;

    public FaceController(FaceRecognitionService faceRecognitionService) {
        this.faceRecognitionService = faceRecognitionService;
    }

    @PostMapping("/register")
    public ResponseEntity<FaceRegistrationResponse> registerFace(@RequestBody FaceRegistrationRequest request) {
        FaceRegistrationResponse response = faceRecognitionService.registerFace(request);
        return ResponseEntity.status(response.isSuccess() ? HttpStatus.CREATED : HttpStatus.BAD_REQUEST).body(response);
    }

    @PostMapping("/recognize")
    public ResponseEntity<FaceRecognitionResponse> recognizeFace(@RequestBody FaceRecognitionRequest request) {
        return ResponseEntity.ok(faceRecognitionService.recognize(request));
    }

    @GetMapping("/profiles")
    public ResponseEntity<List<FaceProfileSummaryDTO>> getProfiles() {
        return ResponseEntity.ok(faceRecognitionService.getAllProfiles());
    }

    @GetMapping("/profiles/user/{userId}")
    public ResponseEntity<?> getProfileByUserId(@PathVariable Long userId) {
        return faceRecognitionService.getProfileByUserId(userId)
            .<ResponseEntity<?>>map(ResponseEntity::ok)
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Face profile not found")));
    }

    @DeleteMapping("/profiles/{profileId}")
    public ResponseEntity<Map<String, Object>> deleteProfile(@PathVariable Long profileId) {
        faceRecognitionService.deleteProfile(profileId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Face profile deleted"));
    }
}

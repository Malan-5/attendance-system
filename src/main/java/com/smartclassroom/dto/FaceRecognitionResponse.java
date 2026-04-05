package com.smartclassroom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FaceRecognitionResponse {
    private boolean matched;
    private Long faceProfileId;
    private Long userId;
    private Long studentId;
    private Long attendanceId;
    private String name;
    private String role;
    private String className;
    private String attendanceStatus;
    private Double confidence;
    private String message;
}

package com.smartclassroom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FaceRecognitionRequest {
    private Long sessionId;
    private String imageData;
    private String className;
    private String email;
}

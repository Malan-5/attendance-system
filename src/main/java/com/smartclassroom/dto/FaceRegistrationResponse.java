package com.smartclassroom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FaceRegistrationResponse {
    private boolean success;
    private Long profileId;
    private Long userId;
    private Long studentId;
    private String name;
    private Integer sampleCount;
    private String message;
}

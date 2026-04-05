package com.smartclassroom.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FaceProfileSummaryDTO {
    private Long id;
    private Long userId;
    private String name;
    private String email;
    private String role;
    private Long studentId;
    private String className;
    private Integer sampleCount;
    private String sampleImageData;
    private LocalDateTime lastMatchedAt;
}

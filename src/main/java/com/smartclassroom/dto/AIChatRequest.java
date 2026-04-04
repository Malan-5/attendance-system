package com.smartclassroom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for AI chat request
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AIChatRequest {
    private Long userId;
    private String message;
    private String studentName;
    private String teacherName;
    private Long teacherId;
}

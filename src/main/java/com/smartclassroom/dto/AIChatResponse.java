package com.smartclassroom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for AI chat response
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AIChatResponse {
    private boolean success;
    private String response;
    private Long timestamp;
    private String error;
}

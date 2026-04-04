package com.smartclassroom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for successful user creation
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserCreationResponse {
    private Long userId;
    private String name;
    private String email;
    private String role;
    private String message;
    private boolean success;
    private String details;
}

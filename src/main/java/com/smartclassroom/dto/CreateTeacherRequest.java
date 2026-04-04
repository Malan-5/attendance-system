package com.smartclassroom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for admin to create teacher profile
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateTeacherRequest {
    private String name;
    private String email;
    private String password;
    private String phone;
    private String subject;
    private Integer yearsOfExperience;
    private String qualification;
}

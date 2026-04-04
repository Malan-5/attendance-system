package com.smartclassroom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for admin to create student profile
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateStudentRequest {
    private String name;
    private String email;
    private String password;
    private String rollNo;
    private String className;
    private String section;
    private String phone;
    private Integer totalDays;
}

package com.smartclassroom.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateAttendanceSessionRequest {
    private String sessionName;
    private String className;
    private LocalDate sessionDate;
    private LocalTime startTime;
    private Integer lateAfterMinutes;
    private String createdBy;
    private String notes;
}

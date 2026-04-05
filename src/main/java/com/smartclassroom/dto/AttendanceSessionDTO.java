package com.smartclassroom.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceSessionDTO {
    private Long id;
    private String sessionName;
    private String className;
    private LocalDate sessionDate;
    private LocalTime startTime;
    private Integer lateAfterMinutes;
    private Boolean active;
    private String createdBy;
    private String notes;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private Integer recognizedCount;
}

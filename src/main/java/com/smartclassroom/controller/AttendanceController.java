package com.smartclassroom.controller;

import com.smartclassroom.dto.AttendanceDTO;
import com.smartclassroom.entity.Attendance;
import com.smartclassroom.entity.AttendanceStatus;
import com.smartclassroom.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AttendanceController {
    
    @Autowired
    private AttendanceService attendanceService;
    
    @GetMapping
    public ResponseEntity<List<AttendanceDTO>> getAllAttendance() {
        List<Attendance> attendances = attendanceService.getAllAttendance();
        List<AttendanceDTO> dtos = attendanceService.convertToDTOList(attendances);
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<AttendanceDTO> getAttendanceById(@PathVariable Long id) {
        return attendanceService.getAttendanceById(id)
            .map(a -> ResponseEntity.ok(attendanceService.convertToDTO(a)))
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<AttendanceDTO>> getStudentAttendance(@PathVariable Long studentId) {
        List<Attendance> attendances = attendanceService.getStudentAttendance(studentId);
        List<AttendanceDTO> dtos = attendanceService.convertToDTOList(attendances);
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/student/{studentId}/month")
    public ResponseEntity<List<AttendanceDTO>> getStudentAttendanceByMonth(
        @PathVariable Long studentId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<Attendance> attendances = attendanceService.getStudentAttendanceByMonth(
            studentId, 
            startDate, 
            endDate
        );
        List<AttendanceDTO> dtos = attendanceService.convertToDTOList(attendances);
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/class/{className}")
    public ResponseEntity<List<AttendanceDTO>> getClassAttendanceByDate(
        @PathVariable String className,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<Attendance> attendances = attendanceService.getClassAttendanceByDate(className, date);
        List<AttendanceDTO> dtos = attendanceService.convertToDTOList(attendances);
        return ResponseEntity.ok(dtos);
    }
    
    @PostMapping
    public ResponseEntity<AttendanceDTO> markAttendance(@RequestBody Attendance attendance) {
        try {
            Attendance marked = attendanceService.markAttendance(attendance);
            attendanceService.updateStudentAttendanceStats(marked.getStudent().getId());
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(attendanceService.convertToDTO(marked));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
    
    @PostMapping("/batch")
    public ResponseEntity<?> markBatchAttendance(
        @RequestBody List<AttendanceDTO> attendanceDtos) {
        try {
            if (attendanceDtos == null || attendanceDtos.isEmpty()) {
                return ResponseEntity.badRequest().body(
                    java.util.Map.of("success", false, "error", "No attendance records provided")
                );
            }
            
            List<Attendance> marked = new java.util.ArrayList<>();
            for (AttendanceDTO dto : attendanceDtos) {
                if (dto.getStudentId() == null || dto.getStudentId() <= 0) {
                    return ResponseEntity.badRequest().body(
                        java.util.Map.of("success", false, "error", "Invalid student ID in attendance record")
                    );
                }
                
                // Convert DTO to Attendance entity
                Attendance attendance = new Attendance();
                attendance.setAttendanceDate(dto.getAttendanceDate());
                attendance.setStatus(AttendanceStatus.valueOf(dto.getStatus().toUpperCase()));
                attendance.setRemarks(dto.getRemarks() != null ? dto.getRemarks() : "");
                
                // Mark attendance and update stats
                Attendance saved = attendanceService.markAttendance(attendance, dto.getStudentId());
                marked.add(saved);
                attendanceService.updateStudentAttendanceStats(dto.getStudentId());
            }
            List<AttendanceDTO> dtos = attendanceService.convertToDTOList(marked);
            return ResponseEntity.status(HttpStatus.CREATED).body(dtos);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                java.util.Map.of("success", false, "error", e.getMessage())
            );
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<AttendanceDTO> updateAttendance(
        @PathVariable Long id,
        @RequestBody Attendance attendance) {
        try {
            return attendanceService.getAttendanceById(id)
                .map(a -> {
                    a.setStatus(attendance.getStatus());
                    a.setCheckInTime(attendance.getCheckInTime());
                    a.setCheckOutTime(attendance.getCheckOutTime());
                    a.setRemarks(attendance.getRemarks());
                    Attendance updated = attendanceService.markAttendance(a);
                    attendanceService.updateStudentAttendanceStats(a.getStudent().getId());
                    return ResponseEntity.ok(attendanceService.convertToDTO(updated));
                })
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAttendance(@PathVariable Long id) {
        attendanceService.deleteAttendance(id);
        return ResponseEntity.noContent().build();
    }
}

package com.smartclassroom.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartclassroom.dto.AttendanceSessionDTO;
import com.smartclassroom.dto.CreateAttendanceSessionRequest;
import com.smartclassroom.dto.FaceRecognitionRequest;
import com.smartclassroom.dto.FaceRecognitionResponse;
import com.smartclassroom.service.AttendanceSessionService;

@RestController
@RequestMapping("/api/attendance-sessions")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:3000"})
public class AttendanceSessionController {

    private final AttendanceSessionService attendanceSessionService;

    public AttendanceSessionController(AttendanceSessionService attendanceSessionService) {
        this.attendanceSessionService = attendanceSessionService;
    }

    @PostMapping
    public ResponseEntity<AttendanceSessionDTO> createSession(@RequestBody CreateAttendanceSessionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(attendanceSessionService.createSession(request));
    }

    @GetMapping
    public ResponseEntity<List<AttendanceSessionDTO>> getAllSessions() {
        return ResponseEntity.ok(attendanceSessionService.getAllSessions());
    }

    @GetMapping("/active")
    public ResponseEntity<List<AttendanceSessionDTO>> getActiveSessions() {
        return ResponseEntity.ok(attendanceSessionService.getActiveSessions());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AttendanceSessionDTO> getSession(@PathVariable Long id) {
        return attendanceSessionService.getSession(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/scan")
    public ResponseEntity<FaceRecognitionResponse> scanAttendance(
        @PathVariable Long id,
        @RequestBody FaceRecognitionRequest request
    ) {
        return ResponseEntity.ok(attendanceSessionService.scanAndMarkAttendance(id, request));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<Map<String, Object>> completeSession(@PathVariable Long id) {
        return ResponseEntity.ok(attendanceSessionService.completeSession(id));
    }
}

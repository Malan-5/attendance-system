package com.smartclassroom.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.smartclassroom.dto.AttendanceSessionDTO;
import com.smartclassroom.dto.CreateAttendanceSessionRequest;
import com.smartclassroom.dto.FaceRecognitionRequest;
import com.smartclassroom.dto.FaceRecognitionResponse;
import com.smartclassroom.entity.Attendance;
import com.smartclassroom.entity.AttendanceSession;
import com.smartclassroom.entity.AttendanceStatus;
import com.smartclassroom.entity.Student;
import com.smartclassroom.repository.AttendanceRepository;
import com.smartclassroom.repository.AttendanceSessionRepository;
import com.smartclassroom.repository.StudentRepository;

@Service
public class AttendanceSessionService {

    private final AttendanceSessionRepository attendanceSessionRepository;
    private final StudentRepository studentRepository;
    private final AttendanceRepository attendanceRepository;
    private final AttendanceService attendanceService;
    private final FaceRecognitionService faceRecognitionService;

    public AttendanceSessionService(
        AttendanceSessionRepository attendanceSessionRepository,
        StudentRepository studentRepository,
        AttendanceRepository attendanceRepository,
        AttendanceService attendanceService,
        FaceRecognitionService faceRecognitionService
    ) {
        this.attendanceSessionRepository = attendanceSessionRepository;
        this.studentRepository = studentRepository;
        this.attendanceRepository = attendanceRepository;
        this.attendanceService = attendanceService;
        this.faceRecognitionService = faceRecognitionService;
    }

    public AttendanceSessionDTO createSession(CreateAttendanceSessionRequest request) {
        AttendanceSession session = new AttendanceSession();
        session.setSessionName(request.getSessionName() != null && !request.getSessionName().isBlank()
            ? request.getSessionName()
            : "Attendance Session");
        session.setClassName(request.getClassName());
        session.setSessionDate(request.getSessionDate() != null ? request.getSessionDate() : LocalDate.now());
        session.setStartTime(request.getStartTime() != null ? request.getStartTime() : LocalTime.now());
        session.setLateAfterMinutes(request.getLateAfterMinutes() != null ? request.getLateAfterMinutes() : 10);
        session.setCreatedBy(request.getCreatedBy());
        session.setNotes(request.getNotes());
        session.setActive(true);
        session.setStartedAt(LocalDateTime.now());

        AttendanceSession saved = attendanceSessionRepository.save(session);
        return convertToDTO(saved);
    }

    public List<AttendanceSessionDTO> getAllSessions() {
        return attendanceSessionRepository.findAll().stream()
            .sorted((left, right) -> right.getStartedAt().compareTo(left.getStartedAt()))
            .map(this::convertToDTO)
            .toList();
    }

    public List<AttendanceSessionDTO> getActiveSessions() {
        return attendanceSessionRepository.findByActiveTrueOrderByStartedAtDesc().stream()
            .map(this::convertToDTO)
            .toList();
    }

    public Optional<AttendanceSessionDTO> getSession(Long id) {
        return attendanceSessionRepository.findById(id).map(this::convertToDTO);
    }

    public FaceRecognitionResponse scanAndMarkAttendance(Long sessionId, FaceRecognitionRequest request) {
        AttendanceSession session = attendanceSessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Attendance session not found"));

        if (!Boolean.TRUE.equals(session.getActive())) {
            throw new RuntimeException("Attendance session is already closed");
        }

        FaceRecognitionRequest recognitionRequest = new FaceRecognitionRequest(
            sessionId,
            request.getImageData(),
            session.getClassName(),
            request.getEmail()
        );
        FaceRecognitionResponse match = faceRecognitionService.recognizeStudentForClass(recognitionRequest);
        if (!match.isMatched() || match.getStudentId() == null) {
            return match;
        }

        Student student = studentRepository.findById(match.getStudentId())
            .orElseThrow(() -> new RuntimeException("Matched student record not found"));

        LocalTime scanTime = LocalTime.now();
        LocalTime lateThreshold = session.getStartTime().plusMinutes(session.getLateAfterMinutes());
        AttendanceStatus status = scanTime.isAfter(lateThreshold) ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

        Attendance attendance = new Attendance();
        attendance.setAttendanceDate(session.getSessionDate());
        attendance.setStatus(status);
        attendance.setCheckInTime(scanTime);
        attendance.setRemarks("Marked using face recognition session #" + session.getId());
        attendance.setMarkedBy(session.getCreatedBy() != null ? session.getCreatedBy() : "Face Recognition");

        Attendance saved = attendanceService.markAttendance(attendance, student.getId());
        attendanceService.updateStudentAttendanceStats(student.getId());

        match.setAttendanceId(saved.getId());
        match.setAttendanceStatus(saved.getStatus().name());
        match.setMessage("Attendance marked for " + student.getUser().getName());
        return match;
    }

    public Map<String, Object> completeSession(Long sessionId) {
        AttendanceSession session = attendanceSessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Attendance session not found"));

        List<Student> students = studentRepository.findByClassName(session.getClassName());
        int absentMarked = 0;

        for (Student student : students) {
            Optional<Attendance> existing = attendanceRepository.findByStudentAndAttendanceDate(student, session.getSessionDate());
            if (existing.isEmpty()) {
                Attendance attendance = new Attendance();
                attendance.setAttendanceDate(session.getSessionDate());
                attendance.setStatus(AttendanceStatus.ABSENT);
                attendance.setRemarks("Automatically marked absent when session closed");
                attendance.setMarkedBy(session.getCreatedBy() != null ? session.getCreatedBy() : "Session Closure");
                attendanceService.markAttendance(attendance, student.getId());
                attendanceService.updateStudentAttendanceStats(student.getId());
                absentMarked++;
            }
        }

        session.setActive(false);
        session.setEndedAt(LocalDateTime.now());
        attendanceSessionRepository.save(session);

        Map<String, Object> summary = new HashMap<>();
        summary.put("success", true);
        summary.put("sessionId", session.getId());
        summary.put("className", session.getClassName());
        summary.put("absentMarked", absentMarked);
        summary.put("recognizedCount", getRecognizedCount(session));
        summary.put("message", "Attendance session closed successfully");
        return summary;
    }

    public AttendanceSessionDTO convertToDTO(AttendanceSession session) {
        return new AttendanceSessionDTO(
            session.getId(),
            session.getSessionName(),
            session.getClassName(),
            session.getSessionDate(),
            session.getStartTime(),
            session.getLateAfterMinutes(),
            session.getActive(),
            session.getCreatedBy(),
            session.getNotes(),
            session.getStartedAt(),
            session.getEndedAt(),
            getRecognizedCount(session)
        );
    }

    private Integer getRecognizedCount(AttendanceSession session) {
        List<Attendance> attendanceRecords = attendanceRepository.findByClassAndDate(session.getClassName(), session.getSessionDate());
        return attendanceRecords.size();
    }
}

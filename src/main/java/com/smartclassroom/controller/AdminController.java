package com.smartclassroom.controller;

import com.smartclassroom.dto.StudentDTO;
import com.smartclassroom.dto.AttendanceDTO;
import com.smartclassroom.dto.CreateStudentRequest;
import com.smartclassroom.dto.CreateTeacherRequest;
import com.smartclassroom.dto.UserCreationResponse;
import com.smartclassroom.entity.User;
import com.smartclassroom.entity.Teacher;
import com.smartclassroom.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:3000"})
public class AdminController {

    @Autowired
    private AdminService adminService;

    // ============ TEACHER MANAGEMENT ============

    /**
     * Get all teachers
     * GET /api/admin/teachers
     */
    @GetMapping("/teachers")
    public ResponseEntity<?> getAllTeachers() {
        try {
            List<User> teachers = adminService.getAllTeachers();
            return ResponseEntity.ok(teachers);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to fetch teachers: " + e.getMessage()));
        }
    }

    /**
     * Get teacher by ID
     * GET /api/admin/teachers/{id}
     */
    @GetMapping("/teachers/{id}")
    public ResponseEntity<?> getTeacherById(@PathVariable Long id) {
        try {
            User teacher = adminService.getTeacherById(id);
            return ResponseEntity.ok(teacher);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Teacher not found: " + e.getMessage()));
        }
    }

    // ============ STUDENT MANAGEMENT ============

    /**
     * Get all students across all teachers
     * GET /api/admin/students
     */
    @GetMapping("/students")
    public ResponseEntity<?> getAllStudents() {
        try {
            List<StudentDTO> students = adminService.getAllStudents();
            return ResponseEntity.ok(students);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to fetch students: " + e.getMessage()));
        }
    }

    /**
     * Get students by class
     * GET /api/admin/students/class/{className}
     */
    @GetMapping("/students/class/{className}")
    public ResponseEntity<?> getStudentsByClass(@PathVariable String className) {
        try {
            List<StudentDTO> students = adminService.getStudentsByClass(className);
            return ResponseEntity.ok(students);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to fetch students by class: " + e.getMessage()));
        }
    }

    /**
     * Get students by teacher ID
     * GET /api/admin/teachers/{teacherId}/students
     */
    @GetMapping("/teachers/{teacherId}/students")
    public ResponseEntity<?> getStudentsByTeacher(@PathVariable Long teacherId) {
        try {
            List<StudentDTO> students = adminService.getStudentsByTeacher(teacherId);
            return ResponseEntity.ok(students);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to fetch teacher's students: " + e.getMessage()));
        }
    }

    /**
     * Get students with low attendance
     * GET /api/admin/students/low-attendance/{threshold}
     */
    @GetMapping("/students/low-attendance/{threshold}")
    public ResponseEntity<?> getStudentsWithLowAttendance(@PathVariable int threshold) {
        try {
            List<StudentDTO> students = adminService.getStudentsWithLowAttendance(threshold);
            return ResponseEntity.ok(students);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to fetch low attendance students: " + e.getMessage()));
        }
    }

    // ============ ATTENDANCE MANAGEMENT ============

    /**
     * Get all attendance records
     * GET /api/admin/attendance
     */
    @GetMapping("/attendance")
    public ResponseEntity<?> getAllAttendance() {
        try {
            List<AttendanceDTO> records = adminService.getAllAttendance();
            return ResponseEntity.ok(records);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to fetch attendance: " + e.getMessage()));
        }
    }

    /**
     * Get attendance by date range
     * GET /api/admin/attendance/range?startDate=2024-01-01&endDate=2024-01-31
     */
    @GetMapping("/attendance/range")
    public ResponseEntity<?> getAttendanceByDateRange(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        try {
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);
            List<AttendanceDTO> records = adminService.getAttendanceByDateRange(start, end);
            return ResponseEntity.ok(records);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to fetch attendance by date range: " + e.getMessage()));
        }
    }

    /**
     * Get attendance by class
     * GET /api/admin/attendance/class/{className}
     */
    @GetMapping("/attendance/class/{className}")
    public ResponseEntity<?> getAttendanceByClass(@PathVariable String className) {
        try {
            List<AttendanceDTO> records = adminService.getAttendanceByClass(className);
            return ResponseEntity.ok(records);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to fetch attendance by class: " + e.getMessage()));
        }
    }

    // ============ STATISTICS & REPORTS ============

    /**
     * Get overall statistics
     * GET /api/admin/statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<?> getStatistics() {
        try {
            Map<String, Object> stats = adminService.getStatistics();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to fetch statistics: " + e.getMessage()));
        }
    }

    /**
     * Get class-wise statistics
     * GET /api/admin/statistics/class
     */
    @GetMapping("/statistics/class")
    public ResponseEntity<?> getClassWiseStatistics() {
        try {
            List<Map<String, Object>> stats = adminService.getClassWiseStatistics();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to fetch class statistics: " + e.getMessage()));
        }
    }

    /**
     * Get attendance report by class
     * GET /api/admin/report/attendance/class/{className}
     */
    @GetMapping("/report/attendance/class/{className}")
    public ResponseEntity<?> getAttendanceReportByClass(@PathVariable String className) {
        try {
            Map<String, Object> report = adminService.getAttendanceReportByClass(className);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to generate report: " + e.getMessage()));
        }
    }

    /**
     * Get detailed attendance report
     * GET /api/admin/report/detailed
     */
    @GetMapping("/report/detailed")
    public ResponseEntity<?> getDetailedReport() {
        try {
            Map<String, Object> report = adminService.getDetailedReport();
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to generate detailed report: " + e.getMessage()));
        }
    }

    // ============ USER MANAGEMENT ============

    /**
     * Get all users (teachers, students, admins)
     * GET /api/admin/users
     */
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        try {
            List<User> users = adminService.getAllUsers();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to fetch users: " + e.getMessage()));
        }
    }

    /**
     * Get user by ID
     * GET /api/admin/users/{id}
     */
    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        try {
            User user = adminService.getUserById(id);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "User not found: " + e.getMessage()));
        }
    }

    /**
     * Get user statistics by role
     * GET /api/admin/users/statistics/role
     */
    @GetMapping("/users/statistics/role")
    public ResponseEntity<?> getUserStatisticsByRole() {
        try {
            Map<String, Long> stats = adminService.getUserStatisticsByRole();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to fetch user statistics: " + e.getMessage()));
        }
    }

    // ============ ADMIN CREATE STUDENT PROFILE ============

    /**
     * Admin creates a new student profile with login credentials
     * POST /api/admin/students/create
     * 
     * Request body:
     * {
     *   "name": "John Doe",
     *   "email": "john@example.com",
     *   "password": "password123",
     *   "rollNo": "CS001",
     *   "className": "10A",
     *   "section": "A",
     *   "phone": "9876543210",
     *   "totalDays": 200
     * }
     */
    @PostMapping("/students/create")
    public ResponseEntity<?> createStudentProfile(@RequestBody CreateStudentRequest request) {
        try {
            UserCreationResponse response = adminService.createStudentProfile(request);
            if (response.isSuccess()) {
                return ResponseEntity.status(201).body(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            UserCreationResponse response = new UserCreationResponse(null, null, null, null,
                    "Failed", false, "Error: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Bulk create multiple student profiles
     * POST /api/admin/students/bulk-create
     */
    @PostMapping("/students/bulk-create")
    public ResponseEntity<?> bulkCreateStudents(@RequestBody List<CreateStudentRequest> requests) {
        try {
            List<UserCreationResponse> responses = adminService.bulkCreateStudents(requests);
            long successCount = responses.stream().filter(UserCreationResponse::isSuccess).count();
            
            Map<String, Object> result = Map.of(
                "totalRequests", requests.size(),
                "successCount", successCount,
                "failedCount", requests.size() - successCount,
                "details", responses
            );
            return ResponseEntity.status(201).body(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Error in bulk creation: " + e.getMessage()));
        }
    }

    // ============ ADMIN CREATE TEACHER PROFILE ============

    /**
     * Admin creates a new teacher profile with login credentials
     * POST /api/admin/teachers/create
     * 
     * Request body:
     * {
     *   "name": "Mrs. Jane Smith",
     *   "email": "jane@example.com",
     *   "password": "password123",
     *   "phone": "9876543210",
     *   "subject": "Mathematics",
     *   "yearsOfExperience": 5,
     *   "qualification": "M.Tech"
     * }
     */
    @PostMapping("/teachers/create")
    public ResponseEntity<?> createTeacherProfile(@RequestBody CreateTeacherRequest request) {
        try {
            UserCreationResponse response = adminService.createTeacherProfile(request);
            if (response.isSuccess()) {
                return ResponseEntity.status(201).body(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            UserCreationResponse response = new UserCreationResponse(null, null, null, null,
                    "Failed", false, "Error: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Bulk create multiple teacher profiles
     * POST /api/admin/teachers/bulk-create
     */
    @PostMapping("/teachers/bulk-create")
    public ResponseEntity<?> bulkCreateTeachers(@RequestBody List<CreateTeacherRequest> requests) {
        try {
            List<UserCreationResponse> responses = adminService.bulkCreateTeachers(requests);
            long successCount = responses.stream().filter(UserCreationResponse::isSuccess).count();
            
            Map<String, Object> result = Map.of(
                "totalRequests", requests.size(),
                "successCount", successCount,
                "failedCount", requests.size() - successCount,
                "details", responses
            );
            return ResponseEntity.status(201).body(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Error in bulk creation: " + e.getMessage()));
        }
    }

    // ============ GET TEACHER DETAILS ============

    /**
     * Get all teachers with their details
     * GET /api/admin/teachers/list/all
     */
    @GetMapping("/teachers/list/all")
    public ResponseEntity<?> getAllTeachersWithDetails() {
        try {
            List<Teacher> teachers = adminService.getAllTeachersWithDetails();
            return ResponseEntity.ok(teachers);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to fetch teachers: " + e.getMessage()));
        }
    }

    /**
     * Update teacher profile by admin
     * PUT /api/admin/teachers/{teacherId}
     */
    @PutMapping("/teachers/{teacherId}")
    public ResponseEntity<?> updateTeacher(@PathVariable Long teacherId, @RequestBody CreateTeacherRequest request) {
        try {
            Teacher updatedTeacher = adminService.updateTeacherProfile(teacherId, request);
            return ResponseEntity.ok(updatedTeacher);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to update teacher: " + e.getMessage()));
        }
    }

    /**
     * Diagnostic endpoint to check database status
     * GET /api/admin/diagnostic
     */
    @GetMapping("/diagnostic")
    public ResponseEntity<?> getDiagnosticInfo() {
        try {
            Map<String, Object> diagnostics = adminService.getDiagnosticInfo();
            return ResponseEntity.ok(diagnostics);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to get diagnostic info: " + e.getMessage()));
        }
    }

    /**
     * Create test attendance records for debugging
     * POST /api/admin/test/create-attendance
     */
    @PostMapping("/test/create-attendance")
    public ResponseEntity<?> createTestAttendance() {
        try {
            // Get first student
            List<java.util.Map<String, Object>> students = (List) adminService.getDiagnosticInfo().get("students");
            if (students.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No students found"));
            }
            
            Long firstStudentId = (Long) students.get(0).get("id");
            Map<String, Object> result = adminService.createTestAttendance(firstStudentId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Failed to create test attendance: " + e.getMessage()));
        }
    }
}


package com.smartclassroom.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.smartclassroom.dto.AttendanceDTO;
import com.smartclassroom.dto.CreateStudentRequest;
import com.smartclassroom.dto.CreateTeacherRequest;
import com.smartclassroom.dto.StudentDTO;
import com.smartclassroom.dto.UserCreationResponse;
import com.smartclassroom.entity.Attendance;
import com.smartclassroom.entity.AttendanceSession;
import com.smartclassroom.entity.Student;
import com.smartclassroom.entity.Teacher;
import com.smartclassroom.entity.User;
import com.smartclassroom.entity.UserRole;
import com.smartclassroom.repository.AttendanceRepository;
import com.smartclassroom.repository.AttendanceSessionRepository;
import com.smartclassroom.repository.FaceProfileRepository;
import com.smartclassroom.repository.StudentRepository;
import com.smartclassroom.repository.TeacherRepository;
import com.smartclassroom.repository.UserRepository;

@Service
public class AdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    private FaceProfileRepository faceProfileRepository;

    @Autowired
    private AttendanceSessionRepository attendanceSessionRepository;

    // ============ TEACHER MANAGEMENT ============

    public List<User> getAllTeachers() {
        return userRepository.findByRole(UserRole.TEACHER);
    }

    public User getTeacherById(Long id) {
        Optional<User> user = userRepository.findById(id);
        if (user.isPresent() && user.get().getRole() == UserRole.TEACHER) {
            return user.get();
        }
        throw new RuntimeException("Teacher not found with ID: " + id);
    }

    // ============ STUDENT MANAGEMENT ============

    public List<StudentDTO> getAllStudents() {
        return studentRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<StudentDTO> getStudentsByClass(String className) {
        return studentRepository.findByClassName(className).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<StudentDTO> getStudentsByTeacher(Long teacherId) {
        return studentRepository.findByUserId(teacherId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<StudentDTO> getStudentsWithLowAttendance(int threshold) {
        return studentRepository.findAll().stream()
                .map(this::convertToDTO)
                .filter(s -> s.getAttendancePercentage() < threshold)
                .collect(Collectors.toList());
    }

    // ============ ATTENDANCE MANAGEMENT ============

    public List<AttendanceDTO> getAllAttendance() {
        return attendanceRepository.findAll().stream()
                .map(this::convertAttendanceToDTO)
                .collect(Collectors.toList());
    }

    public List<AttendanceDTO> getAttendanceByDateRange(LocalDate startDate, LocalDate endDate) {
        return attendanceRepository.findByAttendanceDateBetween(startDate, endDate).stream()
                .map(this::convertAttendanceToDTO)
                .collect(Collectors.toList());
    }

    public List<AttendanceDTO> getAttendanceByClass(String className) {
        List<Student> students = studentRepository.findByClassName(className);
        List<Long> studentIds = students.stream()
                .map(Student::getId)
                .collect(Collectors.toList());

        return attendanceRepository.findAll().stream()
                .filter(a -> studentIds.contains(a.getStudent().getId()))
                .map(this::convertAttendanceToDTO)
                .collect(Collectors.toList());
    }

    // ============ STATISTICS & REPORTS ============

    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new HashMap<>();

        // User statistics
        stats.put("totalTeachers", userRepository.findByRole(UserRole.TEACHER).size());
        stats.put("totalStudents", studentRepository.findAll().size());
        stats.put("totalAdmins", userRepository.findByRole(UserRole.ADMIN).size());

        // Attendance statistics
        List<Student> allStudents = studentRepository.findAll();
        double avgAttendance = allStudents.stream()
                .mapToDouble(s -> calculateAttendancePercentage(s))
                .average()
                .orElse(0.0);
        stats.put("averageAttendance", Math.round(avgAttendance * 100.0) / 100.0);

        // Low attendance count
        long lowAttendanceCount = allStudents.stream()
                .filter(s -> calculateAttendancePercentage(s) < 75)
                .count();
        stats.put("lowAttendanceStudents", lowAttendanceCount);

        // Good attendance count
        long goodAttendanceCount = allStudents.stream()
                .filter(s -> calculateAttendancePercentage(s) >= 75)
                .count();
        stats.put("goodAttendanceStudents", goodAttendanceCount);

        long lateRecords = attendanceRepository.findAll().stream()
                .filter(a -> a.getStatus() == com.smartclassroom.entity.AttendanceStatus.LATE)
                .count();
        long absentRecords = attendanceRepository.findAll().stream()
                .filter(a -> a.getStatus() == com.smartclassroom.entity.AttendanceStatus.ABSENT)
                .count();
        stats.put("lateRecords", lateRecords);
        stats.put("absentRecords", absentRecords);
        stats.put("registeredFaceProfiles", faceProfileRepository.count());
        stats.put("activeAttendanceSessions", attendanceSessionRepository.findByActiveTrueOrderByStartedAtDesc().size());

        return stats;
    }

    public List<Map<String, Object>> getClassWiseStatistics() {
        List<String> classes = studentRepository.findAll().stream()
                .map(Student::getClassName)
                .distinct()
                .collect(Collectors.toList());

        return classes.stream()
                .map(className -> {
                    Map<String, Object> classStat = new HashMap<>();
                    List<Student> classStudents = studentRepository.findByClassName(className);
                    classStat.put("className", className);
                    classStat.put("studentCount", classStudents.size());

                    double avgAttendance = classStudents.stream()
                            .mapToDouble(this::calculateAttendancePercentage)
                            .average()
                            .orElse(0.0);
                    classStat.put("averageAttendance", Math.round(avgAttendance * 100.0) / 100.0);

                    long lowAttendance = classStudents.stream()
                            .filter(s -> calculateAttendancePercentage(s) < 75)
                            .count();
                    classStat.put("lowAttendanceCount", lowAttendance);

                    return classStat;
                })
                .collect(Collectors.toList());
    }

    public Map<String, Object> getAttendanceReportByClass(String className) {
        Map<String, Object> report = new HashMap<>();
        List<Student> classStudents = studentRepository.findByClassName(className);

        report.put("className", className);
        report.put("totalStudents", classStudents.size());

        double avgAttendance = classStudents.stream()
                .mapToDouble(this::calculateAttendancePercentage)
                .average()
                .orElse(0.0);
        report.put("averageAttendance", Math.round(avgAttendance * 100.0) / 100.0);

        List<Map<String, Object>> studentDetails = classStudents.stream()
                .map(s -> {
                    Map<String, Object> detail = new HashMap<>();
                    detail.put("studentId", s.getId());
                    detail.put("rollNo", s.getRollNo());
                    detail.put("attendancePercentage", calculateAttendancePercentage(s));
                    detail.put("presentDays", s.getPresentDays() != null ? s.getPresentDays() : 0);
                    detail.put("totalDays", s.getTotalDays() != null ? s.getTotalDays() : 0);
                    return detail;
                })
                .collect(Collectors.toList());

        report.put("studentDetails", studentDetails);
        return report;
    }

    public Map<String, Object> getDetailedReport() {
        Map<String, Object> report = new HashMap<>();

        report.put("generatedDate", LocalDate.now().toString());
        report.put("overallStatistics", getStatistics());
        report.put("classWiseStatistics", getClassWiseStatistics());

        // Total attendance records
        report.put("totalAttendanceRecords", attendanceRepository.findAll().size());

        return report;
    }

    // ============ USER MANAGEMENT ============

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long id) {
        Optional<User> user = userRepository.findById(id);
        if (user.isPresent()) {
            return user.get();
        }
        throw new RuntimeException("User not found with ID: " + id);
    }

    public Map<String, Long> getUserStatisticsByRole() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("TEACHER", (long) userRepository.findByRole(UserRole.TEACHER).size());
        stats.put("STUDENT", (long) userRepository.findByRole(UserRole.STUDENT).size());
        stats.put("ADMIN", (long) userRepository.findByRole(UserRole.ADMIN).size());
        return stats;
    }

    // ============ HELPER METHODS ============

    private StudentDTO convertToDTO(Student student) {
        StudentDTO dto = new StudentDTO();
        dto.setId(student.getId());
        dto.setUserId(student.getUser() != null ? student.getUser().getId() : null);
        dto.setName(student.getUser() != null ? student.getUser().getName() : "");
        dto.setEmail(student.getUser() != null ? student.getUser().getEmail() : "");
        dto.setRollNo(student.getRollNo());
        dto.setClassName(student.getClassName());
        dto.setSection(student.getSection());
        dto.setPhone(student.getPhone());
        dto.setTotalDays(student.getTotalDays() != null ? student.getTotalDays() : 0);
        dto.setPresentDays(student.getPresentDays() != null ? student.getPresentDays() : 0);
        dto.setAttendancePercentage(calculateAttendancePercentage(student));
        return dto;
    }

    private AttendanceDTO convertAttendanceToDTO(Attendance attendance) {
        AttendanceDTO dto = new AttendanceDTO();
        dto.setId(attendance.getId());
        dto.setStudentId(attendance.getStudent() != null ? attendance.getStudent().getId() : null);
        dto.setAttendanceDate(attendance.getAttendanceDate());
        dto.setStatus(attendance.getStatus() != null ? attendance.getStatus().toString() : "");
        dto.setRemarks(attendance.getRemarks());
        return dto;
    }

    private double calculateAttendancePercentage(Student student) {
        if (student.getTotalDays() == null || student.getTotalDays() == 0) {
            return 0.0;
        }
        int presentDays = student.getPresentDays() != null ? student.getPresentDays() : 0;
        return Math.round((double) presentDays / student.getTotalDays() * 10000.0) / 100.0;
    }

    // ============ ADMIN CREATE STUDENT ============

    /**
     * Admin creates a new student profile with user account
     * @param request - CreateStudentRequest containing student and user details
     * @return UserCreationResponse with created user and student info
     */
    public UserCreationResponse createStudentProfile(CreateStudentRequest request) {
        try {
            // Validate input
            if (request.getName() == null || request.getName().isEmpty()) {
                return new UserCreationResponse(null, null, null, null, 
                    "Failed", false, "Student name is required");
            }
            if (request.getEmail() == null || request.getEmail().isEmpty()) {
                return new UserCreationResponse(null, null, null, null, 
                    "Failed", false, "Email is required");
            }
            if (request.getRollNo() == null || request.getRollNo().isEmpty()) {
                return new UserCreationResponse(null, null, null, null, 
                    "Failed", false, "Roll number is required");
            }
            if (request.getClassName() == null || request.getClassName().isEmpty()) {
                return new UserCreationResponse(null, null, null, null, 
                    "Failed", false, "Class name is required");
            }

            // Check if email already exists
            if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                return new UserCreationResponse(null, null, null, null, 
                    "Failed", false, "Email already exists");
            }

            // Check if roll number already exists
            if (studentRepository.findByRollNo(request.getRollNo()).isPresent()) {
                return new UserCreationResponse(null, null, null, null, 
                    "Failed", false, "Roll number already exists");
            }

            // Create User
            User user = new User();
            user.setName(request.getName());
            user.setEmail(request.getEmail());
            user.setPassword(request.getPassword() != null ? request.getPassword() : generateDefaultPassword());
            user.setRole(UserRole.STUDENT);
            User savedUser = userRepository.save(user);

            // Create Student
            Student student = new Student();
            student.setUser(savedUser);
            student.setRollNo(request.getRollNo());
            student.setClassName(request.getClassName());
            student.setSection(request.getSection());
            student.setPhone(request.getPhone());
            student.setTotalDays(request.getTotalDays() != null ? request.getTotalDays() : 0);
            student.setPresentDays(0);
            student.setAbsentDays(0);
            student.setLateDays(0);
            student.setAttendancePercentage(0.0);
            studentRepository.save(student);

            return new UserCreationResponse(
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                "STUDENT",
                "Student profile created successfully",
                true,
                "Roll No: " + request.getRollNo() + ", Class: " + request.getClassName()
            );

        } catch (Exception e) {
            return new UserCreationResponse(null, null, null, null, 
                "Failed", false, "Error creating student: " + e.getMessage());
        }
    }

    // ============ ADMIN CREATE TEACHER ============

    /**
     * Admin creates a new teacher profile with user account
     * @param request - CreateTeacherRequest containing teacher and user details
     * @return UserCreationResponse with created user and teacher info
     */
    public UserCreationResponse createTeacherProfile(CreateTeacherRequest request) {
        try {
            // Validate input
            if (request.getName() == null || request.getName().isEmpty()) {
                return new UserCreationResponse(null, null, null, null, 
                    "Failed", false, "Teacher name is required");
            }
            if (request.getEmail() == null || request.getEmail().isEmpty()) {
                return new UserCreationResponse(null, null, null, null, 
                    "Failed", false, "Email is required");
            }

            // Check if email already exists
            if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                return new UserCreationResponse(null, null, null, null, 
                    "Failed", false, "Email already exists");
            }

            // Create User
            User user = new User();
            user.setName(request.getName());
            user.setEmail(request.getEmail());
            user.setPassword(request.getPassword() != null ? request.getPassword() : generateDefaultPassword());
            user.setRole(UserRole.TEACHER);
            User savedUser = userRepository.save(user);

            // Create Teacher
            Teacher teacher = new Teacher();
            teacher.setUser(savedUser);
            teacher.setSubject(request.getSubject());
            teacher.setYearsOfExperience(request.getYearsOfExperience());
            teacher.setQualification(request.getQualification());
            teacher.setPhone(request.getPhone());
            teacherRepository.save(teacher);

            return new UserCreationResponse(
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                "TEACHER",
                "Teacher profile created successfully",
                true,
                "Subject: " + (request.getSubject() != null ? request.getSubject() : "Not specified")
            );

        } catch (Exception e) {
            return new UserCreationResponse(null, null, null, null, 
                "Failed", false, "Error creating teacher: " + e.getMessage());
        }
    }

    // ============ HELPER METHOD ============

    /**
     * Generate a default password if not provided
     * @return default password
     */
    private String generateDefaultPassword() {
        return "Password@" + System.currentTimeMillis();
    }

    /**
     * Get all teachers with their details
     * @return List of teachers
     */
    public List<Teacher> getAllTeachersWithDetails() {
        return teacherRepository.findAll();
    }

    /**
     * Get teacher by user ID
     * @param userId - User ID
     * @return Teacher object if found
     */
    public Optional<Teacher> getTeacherByUserId(Long userId) {
        return teacherRepository.findByUserId(userId);
    }

    /**
     * Update teacher profile (by admin)
     * @param teacherId - Teacher ID
     * @param request - UpdatedTeacherRequest
     * @return Updated teacher
     */
    public Teacher updateTeacherProfile(Long teacherId, CreateTeacherRequest request) {
        Optional<Teacher> teacherOpt = teacherRepository.findById(teacherId);
        if (teacherOpt.isEmpty()) {
            throw new RuntimeException("Teacher not found");
        }

        Teacher teacher = teacherOpt.get();
        
        if (request.getSubject() != null) {
            teacher.setSubject(request.getSubject());
        }
        if (request.getYearsOfExperience() != null) {
            teacher.setYearsOfExperience(request.getYearsOfExperience());
        }
        if (request.getQualification() != null) {
            teacher.setQualification(request.getQualification());
        }
        if (request.getPhone() != null) {
            teacher.setPhone(request.getPhone());
        }

        return teacherRepository.save(teacher);
    }

    /**
     * Bulk create students from list
     * @param requests - List of CreateStudentRequest
     * @return List of UserCreationResponse
     */
    public List<UserCreationResponse> bulkCreateStudents(List<CreateStudentRequest> requests) {
        List<UserCreationResponse> responses = new ArrayList<>();
        for (CreateStudentRequest request : requests) {
            responses.add(createStudentProfile(request));
        }
        return responses;
    }

    /**
     * Bulk create teachers from list
     * @param requests - List of CreateTeacherRequest
     * @return List of UserCreationResponse
     */
    public List<UserCreationResponse> bulkCreateTeachers(List<CreateTeacherRequest> requests) {
        List<UserCreationResponse> responses = new ArrayList<>();
        for (CreateTeacherRequest request : requests) {
            responses.add(createTeacherProfile(request));
        }
        return responses;
    }

    /**
     * Get diagnostic information about database status
     */
    public Map<String, Object> getDiagnosticInfo() {
        Map<String, Object> diagnostics = new HashMap<>();
        
        // Count records
        long totalUsers = userRepository.count();
        long totalStudents = studentRepository.count();
        long totalTeachers = teacherRepository.count();
        long totalAttendance = attendanceRepository.count();
        long totalFaceProfiles = faceProfileRepository.count();
        long totalSessions = attendanceSessionRepository.count();
        long activeSessions = attendanceSessionRepository.findByActiveTrueOrderByStartedAtDesc().size();
        
        diagnostics.put("totalUsers", totalUsers);
        diagnostics.put("totalStudents", totalStudents);
        diagnostics.put("totalTeachers", totalTeachers);
        diagnostics.put("totalAttendanceRecords", totalAttendance);
        diagnostics.put("totalFaceProfiles", totalFaceProfiles);
        diagnostics.put("totalAttendanceSessions", totalSessions);
        diagnostics.put("activeAttendanceSessions", activeSessions);
        
        // Get student info
        List<Student> students = studentRepository.findAll();
        List<Map<String, Object>> studentInfo = new ArrayList<>();
        for (Student student : students) {
            Map<String, Object> sInfo = new HashMap<>();
            sInfo.put("id", student.getId());
            sInfo.put("name", student.getUser() != null ? student.getUser().getName() : "N/A");
            sInfo.put("userId", student.getUser() != null ? student.getUser().getId() : null);
            sInfo.put("rollNo", student.getRollNo());
            sInfo.put("className", student.getClassName());
            studentInfo.add(sInfo);
        }
        diagnostics.put("students", studentInfo);
        
        // Get attendance info by student
        Map<Long, Integer> attendanceByStudent = new HashMap<>();
        List<Attendance> allAttendance = attendanceRepository.findAll();
        for (Attendance a : allAttendance) {
            Long studentId = a.getStudent().getId();
            attendanceByStudent.put(studentId, attendanceByStudent.getOrDefault(studentId, 0) + 1);
        }
        diagnostics.put("attendanceByStudent", attendanceByStudent);
        
        // Get first few attendance records as sample
        List<Map<String, Object>> attendanceSample = new ArrayList<>();
        allAttendance.stream().limit(5).forEach(a -> {
            Map<String, Object> aInfo = new HashMap<>();
            aInfo.put("id", a.getId());
            aInfo.put("studentId", a.getStudent() != null ? a.getStudent().getId() : null);
            aInfo.put("studentName", a.getStudent() != null && a.getStudent().getUser() != null ? a.getStudent().getUser().getName() : "N/A");
            aInfo.put("date", a.getAttendanceDate());
            aInfo.put("status", a.getStatus());
            attendanceSample.add(aInfo);
        });
        diagnostics.put("attendanceSample", attendanceSample);

        List<AttendanceSession> sessions = attendanceSessionRepository.findAll();
        List<Map<String, Object>> sessionInfo = new ArrayList<>();
        sessions.stream().limit(5).forEach(session -> {
            Map<String, Object> info = new HashMap<>();
            info.put("id", session.getId());
            info.put("sessionName", session.getSessionName());
            info.put("className", session.getClassName());
            info.put("sessionDate", session.getSessionDate());
            info.put("active", session.getActive());
            sessionInfo.add(info);
        });
        diagnostics.put("attendanceSessions", sessionInfo);
        
        return diagnostics;
    }

    /**
     * Create test attendance records for debugging
     */
    public Map<String, Object> createTestAttendance(Long studentId) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            Optional<Student> studentOpt = studentRepository.findById(studentId);
            if (studentOpt.isEmpty()) {
                result.put("success", false);
                result.put("error", "Student not found");
                return result;
            }
            
            Student student = studentOpt.get();
            List<Attendance> created = new ArrayList<>();
            
            // Create attendance records for last 5 days
            for (int i = 0; i < 5; i++) {
                Attendance attendance = new Attendance();
                attendance.setStudent(student);
                attendance.setAttendanceDate(LocalDate.now().minusDays(i));
                attendance.setStatus(i % 2 == 0 ? com.smartclassroom.entity.AttendanceStatus.PRESENT : com.smartclassroom.entity.AttendanceStatus.ABSENT);
                attendance.setRemarks("Test attendance record");
                attendance.setMarkedBy("Admin-Test");
                
                Attendance saved = attendanceRepository.save(attendance);
                created.add(saved);
            }
            
            result.put("success", true);
            result.put("recordsCreated", created.size());
            result.put("studentId", studentId);
            result.put("studentName", student.getUser() != null ? student.getUser().getName() : "N/A");
            result.put("message", "Created " + created.size() + " test attendance records");
            
        } catch (Exception e) {
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        
        return result;
    }
}


package com.smartclassroom.service;

import com.smartclassroom.dto.AttendanceDTO;
import com.smartclassroom.entity.Attendance;
import com.smartclassroom.entity.AttendanceStatus;
import com.smartclassroom.entity.Student;
import com.smartclassroom.repository.AttendanceRepository;
import com.smartclassroom.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AttendanceService {
    
    @Autowired
    private AttendanceRepository attendanceRepository;
    
    @Autowired
    private StudentRepository studentRepository;
    
    @Autowired
    private StudentService studentService;
    
    public Attendance markAttendance(Attendance attendance) {
        // Check if attendance already marked for this student on this date
        Optional<Attendance> existing = attendanceRepository.findByStudentAndAttendanceDate(
            attendance.getStudent(), 
            attendance.getAttendanceDate()
        );
        
        if (existing.isPresent()) {
            Attendance a = existing.get();
            a.setStatus(attendance.getStatus());
            a.setCheckInTime(attendance.getCheckInTime());
            a.setCheckOutTime(attendance.getCheckOutTime());
            a.setRemarks(attendance.getRemarks());
            a.setMarkedBy(attendance.getMarkedBy());
            return attendanceRepository.save(a);
        }
        
        return attendanceRepository.save(attendance);
    }
    
    // Overloaded method for batch marking with studentId
    public Attendance markAttendance(Attendance attendance, Long studentId) {
        Optional<Student> student = studentRepository.findById(studentId);
        if (student.isEmpty()) {
            throw new IllegalArgumentException("Student with ID " + studentId + " not found");
        }
        
        attendance.setStudent(student.get());
        
        // Check if attendance already marked for this student on this date
        Optional<Attendance> existing = attendanceRepository.findByStudentAndAttendanceDate(
            student.get(), 
            attendance.getAttendanceDate()
        );
        
        if (existing.isPresent()) {
            Attendance a = existing.get();
            a.setStatus(attendance.getStatus());
            a.setCheckInTime(attendance.getCheckInTime());
            a.setCheckOutTime(attendance.getCheckOutTime());
            a.setRemarks(attendance.getRemarks());
            a.setMarkedBy(attendance.getMarkedBy());
            return attendanceRepository.save(a);
        }
        
        return attendanceRepository.save(attendance);
    }

    
    public Optional<Attendance> getAttendanceById(Long id) {
        return attendanceRepository.findById(id);
    }
    
    public List<Attendance> getStudentAttendance(Long studentId) {
        Optional<Student> student = studentRepository.findById(studentId);
        if (student.isPresent()) {
            return attendanceRepository.findByStudent(student.get());
        }
        return List.of();
    }
    
    public List<Attendance> getStudentAttendanceByMonth(Long studentId, LocalDate startDate, LocalDate endDate) {
        Optional<Student> student = studentRepository.findById(studentId);
        if (student.isPresent()) {
            return attendanceRepository.findByStudentAndAttendanceDateBetween(
                student.get(), 
                startDate, 
                endDate
            );
        }
        return List.of();
    }
    
    public List<Attendance> getClassAttendanceByDate(String className, LocalDate date) {
        return attendanceRepository.findByClassAndDate(className, date);
    }
    
    public List<Attendance> getAllAttendance() {
        return attendanceRepository.findAll();
    }
    
    public void deleteAttendance(Long id) {
        attendanceRepository.deleteById(id);
    }
    
    public void updateStudentAttendanceStats(Long studentId) {
        Optional<Student> studentOpt = studentRepository.findById(studentId);
        if (studentOpt.isPresent()) {
            Student student = studentOpt.get();
            List<Attendance> attendances = attendanceRepository.findByStudent(student);
            
            int totalDays = attendances.size();
            int presentDays = (int) attendances.stream()
                .filter(a -> a.getStatus() == AttendanceStatus.PRESENT)
                .count();
            int absentDays = (int) attendances.stream()
                .filter(a -> a.getStatus() == AttendanceStatus.ABSENT)
                .count();
            int lateDays = (int) attendances.stream()
                .filter(a -> a.getStatus() == AttendanceStatus.LATE)
                .count();
            
            student.setTotalDays(totalDays);
            student.setPresentDays(presentDays);
            student.setAbsentDays(absentDays);
            student.setLateDays(lateDays);
            student.calculateAttendancePercentage();
            
            studentRepository.save(student);
        }
    }
    
    public AttendanceDTO convertToDTO(Attendance attendance) {
        return new AttendanceDTO(
            attendance.getId(),
            attendance.getStudent().getId(),
            attendance.getStudent().getUser().getName(),
            attendance.getStudent().getRollNo(),
            attendance.getAttendanceDate(),
            attendance.getStatus().toString(),
            attendance.getCheckInTime(),
            attendance.getCheckOutTime(),
            attendance.getRemarks(),
            attendance.getMarkedBy()
        );
    }
    
    public List<AttendanceDTO> convertToDTOList(List<Attendance> attendances) {
        return attendances.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
}

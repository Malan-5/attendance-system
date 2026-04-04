package com.smartclassroom.service;

import com.smartclassroom.dto.StudentDTO;
import com.smartclassroom.entity.Student;
import com.smartclassroom.entity.User;
import com.smartclassroom.repository.StudentRepository;
import com.smartclassroom.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class StudentService {
    
    @Autowired
    private StudentRepository studentRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    public Student createStudent(Student student) {
        student.calculateAttendancePercentage();
        return studentRepository.save(student);
    }
    
    public Student updateStudent(Long id, Student studentDetails) {
        Optional<Student> student = studentRepository.findById(id);
        if (student.isPresent()) {
            Student s = student.get();
            s.setClassName(studentDetails.getClassName());
            s.setSection(studentDetails.getSection());
            s.setPhone(studentDetails.getPhone());
            s.setTotalDays(studentDetails.getTotalDays());
            s.setPresentDays(studentDetails.getPresentDays());
            s.setAbsentDays(studentDetails.getAbsentDays());
            s.setLateDays(studentDetails.getLateDays());
            s.calculateAttendancePercentage();
            return studentRepository.save(s);
        }
        throw new RuntimeException("Student not found");
    }
    
    public Optional<Student> getStudentById(Long id) {
        return studentRepository.findById(id);
    }
    
    public Optional<Student> getStudentByRollNo(String rollNo) {
        return studentRepository.findByRollNo(rollNo);
    }
    
    public Optional<Student> getStudentByUserId(Long userId) {
        return studentRepository.findByUserId(userId);
    }
    
    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }
    
    public List<Student> getStudentsByClass(String className) {
        return studentRepository.findByClassName(className);
    }
    
    public List<Student> getStudentsWithLowAttendance() {
        return studentRepository.findStudentsWithLowAttendance();
    }
    
    public void deleteStudent(Long id) {
        studentRepository.deleteById(id);
    }
    
    public StudentDTO convertToDTO(Student student) {
        return new StudentDTO(
            student.getId(),
            student.getUser() != null ? student.getUser().getId() : null,
            student.getUser() != null ? student.getUser().getName() : "N/A",
            student.getUser() != null ? student.getUser().getEmail() : "N/A",
            student.getRollNo(),
            student.getClassName(),
            student.getSection(),
            student.getPhone(),
            student.getTotalDays(),
            student.getPresentDays(),
            student.getAbsentDays(),
            student.getLateDays(),
            student.getAttendancePercentage()
        );
    }
    
    public List<StudentDTO> convertToDTOList(List<Student> students) {
        return students.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
}

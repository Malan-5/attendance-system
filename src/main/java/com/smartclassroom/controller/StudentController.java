package com.smartclassroom.controller;

import com.smartclassroom.dto.StudentDTO;
import com.smartclassroom.entity.Student;
import com.smartclassroom.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:3000"})
public class StudentController {
    
    @Autowired
    private StudentService studentService;
    
    @GetMapping
    public ResponseEntity<List<StudentDTO>> getAllStudents() {
        List<Student> students = studentService.getAllStudents();
        List<StudentDTO> dtos = studentService.convertToDTOList(students);
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<StudentDTO> getStudentById(@PathVariable Long id) {
        return studentService.getStudentById(id)
            .map(s -> ResponseEntity.ok(studentService.convertToDTO(s)))
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<StudentDTO> getStudentByUserId(@PathVariable Long userId) {
        return studentService.getStudentByUserId(userId)
            .map(s -> ResponseEntity.ok(studentService.convertToDTO(s)))
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/rollno/{rollNo}")
    public ResponseEntity<StudentDTO> getStudentByRollNo(@PathVariable String rollNo) {
        return studentService.getStudentByRollNo(rollNo)
            .map(s -> ResponseEntity.ok(studentService.convertToDTO(s)))
            .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/class/{className}")
    public ResponseEntity<List<StudentDTO>> getStudentsByClass(@PathVariable String className) {
        List<Student> students = studentService.getStudentsByClass(className);
        List<StudentDTO> dtos = studentService.convertToDTOList(students);
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/low-attendance")
    public ResponseEntity<List<StudentDTO>> getStudentsWithLowAttendance() {
        List<Student> students = studentService.getStudentsWithLowAttendance();
        List<StudentDTO> dtos = studentService.convertToDTOList(students);
        return ResponseEntity.ok(dtos);
    }
    
    @PostMapping
    public ResponseEntity<StudentDTO> createStudent(@RequestBody Student student) {
        try {
            Student created = studentService.createStudent(student);
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(studentService.convertToDTO(created));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<StudentDTO> updateStudent(
        @PathVariable Long id, 
        @RequestBody Student student) {
        try {
            Student updated = studentService.updateStudent(id, student);
            return ResponseEntity.ok(studentService.convertToDTO(updated));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStudent(@PathVariable Long id) {
        studentService.deleteStudent(id);
        return ResponseEntity.noContent().build();
    }
}

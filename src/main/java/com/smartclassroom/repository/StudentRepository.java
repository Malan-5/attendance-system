package com.smartclassroom.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.smartclassroom.entity.Student;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByRollNo(String rollNo);
    Optional<Student> findByUserId(Long userId);
    List<Student> findByClassName(String className);
    
    @Query("SELECT s FROM Student s WHERE s.attendancePercentage < 75")
    List<Student> findStudentsWithLowAttendance();
}

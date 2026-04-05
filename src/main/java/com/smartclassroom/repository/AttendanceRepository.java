package com.smartclassroom.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.smartclassroom.entity.Attendance;
import com.smartclassroom.entity.Student;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    
    Optional<Attendance> findByStudentAndAttendanceDate(Student student, LocalDate date);
    
    List<Attendance> findByStudent(Student student);
    
    List<Attendance> findByStudentAndAttendanceDateBetween(
        Student student, 
        LocalDate startDate, 
        LocalDate endDate
    );

    List<Attendance> findByAttendanceDate(LocalDate attendanceDate);
    
    List<Attendance> findByAttendanceDateBetween(LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT a FROM Attendance a WHERE a.student.id = :studentId AND a.attendanceDate = :date")
    Optional<Attendance> findByStudentIdAndDate(@Param("studentId") Long studentId, @Param("date") LocalDate date);
    
    @Query("SELECT a FROM Attendance a WHERE a.student.className = :className AND a.attendanceDate = :date")
    List<Attendance> findByClassAndDate(@Param("className") String className, @Param("date") LocalDate date);
}


package com.smartclassroom.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.smartclassroom.entity.AttendanceSession;

@Repository
public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, Long> {
    List<AttendanceSession> findByActiveTrueOrderByStartedAtDesc();
    List<AttendanceSession> findBySessionDateOrderByStartTimeDesc(LocalDate sessionDate);
    List<AttendanceSession> findByClassNameOrderBySessionDateDescStartTimeDesc(String className);
}

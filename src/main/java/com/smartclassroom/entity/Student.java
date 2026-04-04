package com.smartclassroom.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "students")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Student {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
    
    @Column(nullable = false, unique = true)
    private String rollNo;
    
    @Column(nullable = false)
    private String className;
    
    @Column
    private String section;
    
    @Column
    private String phone;
    
    @Column(name = "total_days")
    private Integer totalDays = 0;
    
    @Column(name = "present_days")
    private Integer presentDays = 0;
    
    @Column(name = "absent_days")
    private Integer absentDays = 0;
    
    @Column(name = "late_days")
    private Integer lateDays = 0;
    
    @Column(name = "attendance_percentage")
    private Double attendancePercentage = 0.0;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public void calculateAttendancePercentage() {
        if (totalDays > 0) {
            this.attendancePercentage = (double) presentDays / totalDays * 100;
        }
    }
}

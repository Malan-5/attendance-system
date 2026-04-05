package com.smartclassroom.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.TemporalAdjusters;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.smartclassroom.entity.Attendance;
import com.smartclassroom.entity.AttendanceStatus;
import com.smartclassroom.entity.Student;
import com.smartclassroom.repository.AttendanceRepository;
import com.smartclassroom.repository.StudentRepository;

@Service
public class ReportService {

    private final AttendanceRepository attendanceRepository;
    private final StudentRepository studentRepository;

    public ReportService(AttendanceRepository attendanceRepository, StudentRepository studentRepository) {
        this.attendanceRepository = attendanceRepository;
        this.studentRepository = studentRepository;
    }

    public Map<String, Object> getDailyReport(LocalDate date) {
        return buildSummary(date, date, "daily");
    }

    public Map<String, Object> getWeeklyReport(LocalDate anyDateInWeek) {
        LocalDate startDate = anyDateInWeek.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate endDate = startDate.plusDays(6);
        return buildSummary(startDate, endDate, "weekly");
    }

    public Map<String, Object> getMonthlyReport(YearMonth yearMonth) {
        return buildSummary(yearMonth.atDay(1), yearMonth.atEndOfMonth(), "monthly");
    }

    public String exportCsv(LocalDate startDate, LocalDate endDate) {
        List<Attendance> records = attendanceRepository.findByAttendanceDateBetween(startDate, endDate);
        StringBuilder csv = new StringBuilder();
        csv.append("Attendance ID,Student ID,Student Name,Roll No,Class,Date,Status,Check In,Marked By\n");

        for (Attendance record : records) {
            Student student = record.getStudent();
            csv.append(record.getId()).append(',')
                .append(student.getId()).append(',')
                .append(escape(student.getUser().getName())).append(',')
                .append(escape(student.getRollNo())).append(',')
                .append(escape(student.getClassName())).append(',')
                .append(record.getAttendanceDate()).append(',')
                .append(record.getStatus()).append(',')
                .append(record.getCheckInTime() != null ? record.getCheckInTime() : "").append(',')
                .append(escape(record.getMarkedBy()))
                .append('\n');
        }

        return csv.toString();
    }

    private Map<String, Object> buildSummary(LocalDate startDate, LocalDate endDate, String scope) {
        List<Attendance> records = attendanceRepository.findByAttendanceDateBetween(startDate, endDate);
        List<Student> students = studentRepository.findAll();

        long presentCount = records.stream().filter(record -> record.getStatus() == AttendanceStatus.PRESENT).count();
        long lateCount = records.stream().filter(record -> record.getStatus() == AttendanceStatus.LATE).count();
        long absentCount = records.stream().filter(record -> record.getStatus() == AttendanceStatus.ABSENT).count();
        long totalRecords = records.size();

        double attendanceRate = totalRecords == 0
            ? 0.0
            : Math.round((((presentCount + lateCount) * 100.0) / totalRecords) * 100.0) / 100.0;

        List<Map<String, Object>> classBreakdown = records.stream()
            .collect(Collectors.groupingBy(record -> record.getStudent().getClassName()))
            .entrySet()
            .stream()
            .map(entry -> {
                long classPresent = entry.getValue().stream().filter(record -> record.getStatus() == AttendanceStatus.PRESENT).count();
                long classLate = entry.getValue().stream().filter(record -> record.getStatus() == AttendanceStatus.LATE).count();
                long classAbsent = entry.getValue().stream().filter(record -> record.getStatus() == AttendanceStatus.ABSENT).count();
                Map<String, Object> classSummary = new HashMap<>();
                classSummary.put("className", entry.getKey());
                classSummary.put("totalRecords", entry.getValue().size());
                classSummary.put("presentCount", classPresent);
                classSummary.put("lateCount", classLate);
                classSummary.put("absentCount", classAbsent);
                classSummary.put("attendanceRate", entry.getValue().isEmpty()
                    ? 0.0
                    : Math.round((((classPresent + classLate) * 100.0) / entry.getValue().size()) * 100.0) / 100.0);
                return classSummary;
            })
            .sorted((left, right) -> String.valueOf(left.get("className")).compareTo(String.valueOf(right.get("className"))))
            .toList();

        List<Map<String, Object>> lowAttendanceStudents = students.stream()
            .filter(student -> (student.getAttendancePercentage() != null ? student.getAttendancePercentage() : 0.0) < 75.0)
            .map(student -> {
                Map<String, Object> item = new HashMap<>();
                item.put("studentId", student.getId());
                item.put("name", student.getUser().getName());
                item.put("rollNo", student.getRollNo());
                item.put("className", student.getClassName());
                item.put("attendancePercentage", student.getAttendancePercentage());
                return item;
            })
            .toList();

        Map<String, Object> summary = new HashMap<>();
        summary.put("scope", scope);
        summary.put("startDate", startDate);
        summary.put("endDate", endDate);
        summary.put("totalRecords", totalRecords);
        summary.put("presentCount", presentCount);
        summary.put("lateCount", lateCount);
        summary.put("absentCount", absentCount);
        summary.put("attendanceRate", attendanceRate);
        summary.put("classBreakdown", classBreakdown);
        summary.put("lowAttendanceStudents", lowAttendanceStudents);
        return summary;
    }

    private String escape(String value) {
        if (value == null) {
            return "";
        }
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }
}

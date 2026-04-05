package com.smartclassroom.controller;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.smartclassroom.service.ReportService;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:5174", "http://localhost:3000"})
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/daily")
    public ResponseEntity<Map<String, Object>> getDailyReport(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return ResponseEntity.ok(reportService.getDailyReport(date));
    }

    @GetMapping("/weekly")
    public ResponseEntity<Map<String, Object>> getWeeklyReport(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return ResponseEntity.ok(reportService.getWeeklyReport(date));
    }

    @GetMapping("/monthly")
    public ResponseEntity<Map<String, Object>> getMonthlyReport(
        @RequestParam int year,
        @RequestParam int month
    ) {
        return ResponseEntity.ok(reportService.getMonthlyReport(YearMonth.of(year, month)));
    }

    @GetMapping(value = "/export", produces = "text/csv")
    public ResponseEntity<String> exportCsv(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        String csv = reportService.exportCsv(startDate, endDate);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=attendance-report.csv")
            .contentType(new MediaType("text", "csv"))
            .body(csv);
    }
}

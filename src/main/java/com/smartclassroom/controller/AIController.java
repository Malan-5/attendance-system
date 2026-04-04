package com.smartclassroom.controller;

import com.smartclassroom.service.AIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

/**
 * AI Controller for handling OpenAI integration endpoints.
 * Provides endpoints for AI-powered chat and suggestions.
 */
@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AIController {

    @Autowired
    private AIService aiService;

    /**
     * Get AI response for a student message
     * POST /api/ai/chat
     */
    @PostMapping("/chat")
    public ResponseEntity<?> getAIResponse(@RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.parseLong(request.get("userId").toString());
            String message = request.get("message").toString();
            String studentName = request.get("studentName").toString();
            String teacherName = request.get("teacherName").toString();

            String response = aiService.getAIResponse(userId, message, studentName, teacherName);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("response", response);
            result.put("timestamp", System.currentTimeMillis());

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Generate attendance improvement suggestions
     * POST /api/ai/suggestions
     */
    @PostMapping("/suggestions")
    public ResponseEntity<?> generateSuggestions(@RequestBody Map<String, Object> request) {
        try {
            String studentName = request.get("studentName").toString();
            double attendancePercentage = Double.parseDouble(request.get("attendancePercentage").toString());
            int daysAbsent = Integer.parseInt(request.get("daysAbsent").toString());

            String suggestions = aiService.generateAttendanceSuggestions(
                studentName, 
                attendancePercentage, 
                daysAbsent
            );

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("suggestions", suggestions);
            result.put("timestamp", System.currentTimeMillis());

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Check if AI service is configured
     * GET /api/ai/status
     */
    @GetMapping("/status")
    public ResponseEntity<?> getAIStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("configured", aiService.isConfigured());
        status.put("message", aiService.isConfigured() 
            ? "AI service is ready" 
            : "AI service not configured. Please set OPENAI_API_KEY environment variable.");
        return ResponseEntity.ok(status);
    }

    /**
     * Clear conversation history for a user
     * DELETE /api/ai/history/{userId}
     */
    @DeleteMapping("/history/{userId}")
    public ResponseEntity<?> clearHistory(@PathVariable Long userId) {
        try {
            aiService.clearConversationHistory(userId);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Conversation history cleared");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Get conversation history size for a user
     * GET /api/ai/history/{userId}
     */
    @GetMapping("/history/{userId}")
    public ResponseEntity<?> getHistorySize(@PathVariable Long userId) {
        Map<String, Object> result = new HashMap<>();
        result.put("userId", userId);
        result.put("historySize", aiService.getConversationHistorySize(userId));
        return ResponseEntity.ok(result);
    }
}

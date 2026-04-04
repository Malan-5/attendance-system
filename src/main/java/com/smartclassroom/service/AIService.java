package com.smartclassroom.service;

import com.theokanning.openai.completion.chat.ChatCompletionRequest;
import com.theokanning.openai.completion.chat.ChatMessage;
import com.theokanning.openai.completion.chat.ChatMessageRole;
import com.theokanning.openai.service.OpenAiService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

/**
 * AI Service for integrating OpenAI ChatGPT with the attendance system.
 * Provides intelligent responses for student-teacher communications about attendance.
 */
@Service
public class AIService {

    @Value("${openai.api.key:}")
    private String apiKey;

    @Value("${openai.model:gpt-3.5-turbo}")
    private String model;

    @Value("${openai.temperature:0.7}")
    private Double temperature;

    @Value("${openai.max-tokens:500}")
    private Integer maxTokens;

    // Store conversation history per user
    private final ConcurrentHashMap<String, List<ChatMessage>> conversationHistory = new ConcurrentHashMap<>();

    /**
     * Get AI response for student message about attendance
     * @param userId Student user ID (for tracking conversation)
     * @param studentMessage Message from student
     * @param studentName Name of the student
     * @param teacherName Name of the teacher
     * @return AI-generated response
     */
    public String getAIResponse(Long userId, String studentMessage, String studentName, String teacherName) {
        // Check if API key is configured
        if (apiKey == null || apiKey.isEmpty()) {
            return "I'm not configured yet. Please contact your administrator.";
        }

        try {
            OpenAiService service = new OpenAiService(apiKey);
            
            // Get or create conversation history
            String conversationKey = "user_" + userId;
            List<ChatMessage> messages = conversationHistory.computeIfAbsent(
                conversationKey, 
                k -> new ArrayList<>()
            );

            // Add system context
            if (messages.isEmpty()) {
                messages.add(new ChatMessage(
                    ChatMessageRole.SYSTEM.value(),
                    "You are a helpful assistant in a smart classroom attendance system. " +
                    "You help students discuss attendance issues with their teacher " + teacherName + ". " +
                    "Student name: " + studentName + ". " +
                    "Be supportive, professional, and provide constructive suggestions for attendance improvement. " +
                    "Keep responses concise (under 100 words)."
                ));
            }

            // Add student message
            messages.add(new ChatMessage(ChatMessageRole.USER.value(), studentMessage));

            // Create request with conversation history
            ChatCompletionRequest request = ChatCompletionRequest.builder()
                .model(model)
                .messages(messages)
                .temperature(temperature)
                .maxTokens(maxTokens)
                .build();

            // Get response
            String response = service.createChatCompletion(request)
                .getChoices()
                .get(0)
                .getMessage()
                .getContent();

            // Add AI response to history
            messages.add(new ChatMessage(ChatMessageRole.ASSISTANT.value(), response));

            // Keep only last 10 messages to avoid token limit
            if (messages.size() > 10) {
                messages.remove(1); // Remove oldest user message (keep system message)
            }

            return response;

        } catch (Exception e) {
            return "I encountered an error: " + e.getMessage() + ". Please try again or contact your teacher directly.";
        }
    }

    /**
     * Generate attendance improvement suggestions using AI
     * @param studentName Name of the student
     * @param currentAttendancePercentage Current attendance percentage
     * @param daysAbsent Number of days absent
     * @return AI-generated suggestions
     */
    public String generateAttendanceSuggestions(String studentName, double currentAttendancePercentage, int daysAbsent) {
        if (apiKey == null || apiKey.isEmpty()) {
            return "Unable to generate suggestions. Please contact your teacher.";
        }

        try {
            OpenAiService service = new OpenAiService(apiKey);

            List<ChatMessage> messages = new ArrayList<>();
            messages.add(new ChatMessage(
                ChatMessageRole.SYSTEM.value(),
                "You are an educational advisor helping students improve attendance. Provide 3-4 specific, actionable suggestions."
            ));

            String prompt = String.format(
                "Student: %s has %.1f%% attendance with %d days absent. " +
                "Provide personalized suggestions to improve attendance.",
                studentName, currentAttendancePercentage, daysAbsent
            );

            messages.add(new ChatMessage(ChatMessageRole.USER.value(), prompt));

            ChatCompletionRequest request = ChatCompletionRequest.builder()
                .model(model)
                .messages(messages)
                .temperature(temperature)
                .maxTokens(maxTokens)
                .build();

            return service.createChatCompletion(request)
                .getChoices()
                .get(0)
                .getMessage()
                .getContent();

        } catch (Exception e) {
            return "Unable to generate suggestions at this time.";
        }
    }

    /**
     * Clear conversation history for a user
     * @param userId User ID
     */
    public void clearConversationHistory(Long userId) {
        conversationHistory.remove("user_" + userId);
    }

    /**
     * Check if OpenAI is configured
     * @return true if API key is set
     */
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isEmpty();
    }

    /**
     * Get conversation history size for a user
     * @param userId User ID
     * @return Number of messages in history
     */
    public int getConversationHistorySize(Long userId) {
        String key = "user_" + userId;
        return conversationHistory.getOrDefault(key, new ArrayList<>()).size();
    }
}

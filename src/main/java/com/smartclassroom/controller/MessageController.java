package com.smartclassroom.controller;

import com.smartclassroom.dto.MessageDTO;
import com.smartclassroom.entity.Message;
import com.smartclassroom.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class MessageController {
    
    @Autowired
    private MessageService messageService;
    
    @PostMapping
    public ResponseEntity<MessageDTO> sendMessage(@RequestBody Message message) {
        try {
            Message saved = messageService.sendMessage(message);
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(messageService.convertToDTO(saved));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
    
    @GetMapping("/conversation/{userId1}/{userId2}")
    public ResponseEntity<List<MessageDTO>> getConversation(
        @PathVariable Long userId1,
        @PathVariable Long userId2) {
        List<Message> messages = messageService.getConversation(userId1, userId2);
        List<MessageDTO> dtos = messageService.convertToDTOList(messages);
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/received/{userId}")
    public ResponseEntity<List<MessageDTO>> getReceivedMessages(@PathVariable Long userId) {
        List<Message> messages = messageService.getReceivedMessages(userId);
        List<MessageDTO> dtos = messageService.convertToDTOList(messages);
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/sent/{userId}")
    public ResponseEntity<List<MessageDTO>> getSentMessages(@PathVariable Long userId) {
        List<Message> messages = messageService.getSentMessages(userId);
        List<MessageDTO> dtos = messageService.convertToDTOList(messages);
        return ResponseEntity.ok(dtos);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<MessageDTO> getMessageById(@PathVariable Long id) {
        return messageService.getMessageById(id)
            .map(m -> ResponseEntity.ok(messageService.convertToDTO(m)))
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}/read")
    public ResponseEntity<MessageDTO> markAsRead(@PathVariable Long id) {
        try {
            Message message = messageService.markAsRead(id);
            return ResponseEntity.ok(messageService.convertToDTO(message));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/unread/{userId}")
    public ResponseEntity<Long> getUnreadCount(@PathVariable Long userId) {
        long count = messageService.getUnreadMessageCount(userId);
        return ResponseEntity.ok(count);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMessage(@PathVariable Long id) {
        messageService.deleteMessage(id);
        return ResponseEntity.noContent().build();
    }
}

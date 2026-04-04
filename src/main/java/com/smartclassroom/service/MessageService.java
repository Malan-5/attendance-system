package com.smartclassroom.service;

import com.smartclassroom.dto.MessageDTO;
import com.smartclassroom.entity.Message;
import com.smartclassroom.entity.User;
import com.smartclassroom.repository.MessageRepository;
import com.smartclassroom.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class MessageService {
    
    @Autowired
    private MessageRepository messageRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    public Message sendMessage(Message message) {
        return messageRepository.save(message);
    }
    
    public List<Message> getConversation(Long userId1, Long userId2) {
        Optional<User> user1 = userRepository.findById(userId1);
        Optional<User> user2 = userRepository.findById(userId2);
        
        if (user1.isPresent() && user2.isPresent()) {
            return messageRepository.findConversation(user1.get(), user2.get());
        }
        return List.of();
    }
    
    public List<Message> getReceivedMessages(Long userId) {
        Optional<User> user = userRepository.findById(userId);
        if (user.isPresent()) {
            return messageRepository.findByReceiverOrderByCreatedAtDesc(user.get());
        }
        return List.of();
    }
    
    public List<Message> getSentMessages(Long userId) {
        Optional<User> user = userRepository.findById(userId);
        if (user.isPresent()) {
            return messageRepository.findBySenderOrderByCreatedAtDesc(user.get());
        }
        return List.of();
    }
    
    public Optional<Message> getMessageById(Long id) {
        return messageRepository.findById(id);
    }
    
    public Message markAsRead(Long messageId) {
        Optional<Message> message = messageRepository.findById(messageId);
        if (message.isPresent()) {
            Message m = message.get();
            m.setIsRead(true);
            return messageRepository.save(m);
        }
        throw new RuntimeException("Message not found");
    }
    
    public long getUnreadMessageCount(Long userId) {
        Optional<User> user = userRepository.findById(userId);
        if (user.isPresent()) {
            return messageRepository.countByReceiverAndIsReadFalse(user.get());
        }
        return 0;
    }
    
    public void deleteMessage(Long id) {
        messageRepository.deleteById(id);
    }
    
    public MessageDTO convertToDTO(Message message) {
        return new MessageDTO(
            message.getId(),
            message.getSender().getId(),
            message.getSender().getName(),
            message.getReceiver().getId(),
            message.getReceiver().getName(),
            message.getContent(),
            message.getReferenceAttendanceId(),
            message.getIsRead(),
            message.getCreatedAt()
        );
    }
    
    public List<MessageDTO> convertToDTOList(List<Message> messages) {
        return messages.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
}

package com.smartclassroom.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.smartclassroom.entity.Message;
import com.smartclassroom.entity.User;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    
    @Query("SELECT m FROM Message m WHERE " +
           "(m.sender = :user1 AND m.receiver = :user2) OR " +
           "(m.sender = :user2 AND m.receiver = :user1) " +
           "ORDER BY m.createdAt ASC")
    List<Message> findConversation(@Param("user1") User user1, @Param("user2") User user2);
    
    List<Message> findByReceiverOrderByCreatedAtDesc(User receiver);
    
    List<Message> findBySenderOrderByCreatedAtDesc(User sender);
    
    long countByReceiverAndIsReadFalse(User receiver);
}

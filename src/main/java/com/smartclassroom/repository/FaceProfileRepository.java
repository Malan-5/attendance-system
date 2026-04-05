package com.smartclassroom.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.smartclassroom.entity.FaceProfile;

@Repository
public interface FaceProfileRepository extends JpaRepository<FaceProfile, Long> {
    Optional<FaceProfile> findByUserId(Long userId);
    boolean existsByUserId(Long userId);
}

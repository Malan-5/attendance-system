package com.smartclassroom.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FaceRegistrationRequest {
    private Long userId;
    private List<String> imageSamples;
    private String imageData;
}

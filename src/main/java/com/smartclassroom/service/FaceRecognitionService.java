package com.smartclassroom.service;

import java.awt.Graphics2D;
import java.awt.Image;
import java.awt.color.ColorSpace;
import java.awt.image.BufferedImage;
import java.awt.image.ColorConvertOp;
import java.io.ByteArrayInputStream;
import java.math.BigInteger;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

import javax.imageio.ImageIO;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.smartclassroom.dto.FaceRecognitionRequest;
import com.smartclassroom.dto.FaceRecognitionResponse;
import com.smartclassroom.dto.FaceProfileSummaryDTO;
import com.smartclassroom.dto.FaceRegistrationRequest;
import com.smartclassroom.dto.FaceRegistrationResponse;
import com.smartclassroom.entity.FaceProfile;
import com.smartclassroom.entity.Student;
import com.smartclassroom.entity.User;
import com.smartclassroom.repository.FaceProfileRepository;
import com.smartclassroom.repository.StudentRepository;
import com.smartclassroom.repository.UserRepository;

@Service
public class FaceRecognitionService {

    private final FaceProfileRepository faceProfileRepository;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;

    @Value("${face.match.threshold:14}")
    private Integer faceMatchThreshold;

    public FaceRecognitionService(
        FaceProfileRepository faceProfileRepository,
        UserRepository userRepository,
        StudentRepository studentRepository
    ) {
        this.faceProfileRepository = faceProfileRepository;
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
    }

    public FaceRegistrationResponse registerFace(FaceRegistrationRequest request) {
        if (request.getUserId() == null) {
            return new FaceRegistrationResponse(false, null, null, null, null, 0, "User ID is required");
        }

        Optional<User> userOpt = userRepository.findById(request.getUserId());
        if (userOpt.isEmpty()) {
            return new FaceRegistrationResponse(false, null, request.getUserId(), null, null, 0, "User not found");
        }

        List<String> rawSamples = new ArrayList<>();
        if (request.getImageSamples() != null) {
            request.getImageSamples().stream()
                .filter(sample -> sample != null && !sample.isBlank())
                .forEach(rawSamples::add);
        }
        if (rawSamples.isEmpty() && request.getImageData() != null && !request.getImageData().isBlank()) {
            rawSamples.add(request.getImageData());
        }

        if (rawSamples.isEmpty()) {
            return new FaceRegistrationResponse(false, null, request.getUserId(), null, userOpt.get().getName(), 0,
                "At least one captured face image is required");
        }

        List<String> descriptors = rawSamples.stream()
            .map(this::computeDescriptor)
            .filter(descriptor -> descriptor != null && !descriptor.isBlank())
            .toList();

        if (descriptors.isEmpty()) {
            return new FaceRegistrationResponse(false, null, request.getUserId(), null, userOpt.get().getName(), 0,
                "Unable to process the captured images");
        }

        FaceProfile profile = faceProfileRepository.findByUserId(request.getUserId()).orElseGet(FaceProfile::new);
        profile.setUser(userOpt.get());
        profile.setDescriptorData(String.join(",", descriptors));
        profile.setSampleImageData(rawSamples.get(0));
        profile.setSampleCount(descriptors.size());

        FaceProfile saved = faceProfileRepository.save(profile);
        Long studentId = studentRepository.findByUserId(request.getUserId()).map(Student::getId).orElse(null);

        return new FaceRegistrationResponse(
            true,
            saved.getId(),
            userOpt.get().getId(),
            studentId,
            userOpt.get().getName(),
            descriptors.size(),
            "Face profile saved successfully"
        );
    }

    public FaceRecognitionResponse recognizeStudentForClass(FaceRecognitionRequest request) {
        FaceRecognitionResponse response = recognize(request);
        if (!response.isMatched()) {
            return response;
        }

        if (!"STUDENT".equalsIgnoreCase(response.getRole())) {
            response.setMatched(false);
            response.setMessage("Matched user is not a student");
            return response;
        }

        if (request.getClassName() != null && !request.getClassName().isBlank()) {
            String normalizedRequestClass = request.getClassName().trim();
            if (response.getClassName() == null || !response.getClassName().equalsIgnoreCase(normalizedRequestClass)) {
                response.setMatched(false);
                response.setMessage("Matched student does not belong to class " + normalizedRequestClass);
            }
        }

        return response;
    }

    public FaceRecognitionResponse recognize(FaceRecognitionRequest request) {
        if (request.getImageData() == null || request.getImageData().isBlank()) {
            return new FaceRecognitionResponse(false, null, null, null, null, null, null, null, null, 0.0,
                "Captured image is required");
        }

        String probeDescriptor = computeDescriptor(request.getImageData());
        if (probeDescriptor == null || probeDescriptor.isBlank()) {
            return new FaceRecognitionResponse(false, null, null, null, null, null, null, null, null, 0.0,
                "Unable to process the captured image");
        }

        List<FaceProfile> profiles = faceProfileRepository.findAll();
        if (profiles.isEmpty()) {
            return new FaceRecognitionResponse(false, null, null, null, null, null, null, null, null, 0.0,
                "No face profiles are registered yet");
        }

        MatchCandidate bestMatch = profiles.stream()
            .map(profile -> buildMatchCandidate(profile, probeDescriptor))
            .filter(candidate -> candidate != null)
            .min(Comparator.comparingInt(MatchCandidate::distance))
            .orElse(null);

        if (bestMatch == null || bestMatch.distance() > faceMatchThreshold) {
            return new FaceRecognitionResponse(false, null, null, null, null, null, null, null, null, 0.0,
                "No registered face matched the current capture");
        }

        FaceProfile profile = bestMatch.profile();
        profile.setLastMatchedAt(LocalDateTime.now());
        faceProfileRepository.save(profile);

        User user = profile.getUser();
        Optional<Student> studentOpt = studentRepository.findByUserId(user.getId());
        String className = studentOpt.map(Student::getClassName).orElse(null);

        return new FaceRecognitionResponse(
            true,
            profile.getId(),
            user.getId(),
            studentOpt.map(Student::getId).orElse(null),
            null,
            user.getName(),
            user.getRole().name(),
            className,
            null,
            calculateConfidence(bestMatch.distance()),
            "Face matched successfully"
        );
    }

    public Optional<User> authenticateByFace(String email, String imageData) {
        if (email == null || email.isBlank() || imageData == null || imageData.isBlank()) {
            return Optional.empty();
        }

        Optional<User> userOpt = userRepository.findByEmail(email.trim().toLowerCase(Locale.ROOT));
        if (userOpt.isEmpty()) {
            return Optional.empty();
        }

        Optional<FaceProfile> profileOpt = faceProfileRepository.findByUserId(userOpt.get().getId());
        if (profileOpt.isEmpty()) {
            return Optional.empty();
        }

        String probeDescriptor = computeDescriptor(imageData);
        MatchCandidate candidate = buildMatchCandidate(profileOpt.get(), probeDescriptor);
        if (candidate != null && candidate.distance() <= faceMatchThreshold) {
            FaceProfile profile = profileOpt.get();
            profile.setLastMatchedAt(LocalDateTime.now());
            faceProfileRepository.save(profile);
            return Optional.of(userOpt.get());
        }

        return Optional.empty();
    }

    public Optional<FaceProfileSummaryDTO> getProfileByUserId(Long userId) {
        return faceProfileRepository.findByUserId(userId).map(this::convertToSummary);
    }

    public List<FaceProfileSummaryDTO> getAllProfiles() {
        return faceProfileRepository.findAll().stream()
            .map(this::convertToSummary)
            .toList();
    }

    public void deleteProfile(Long profileId) {
        faceProfileRepository.deleteById(profileId);
    }

    private MatchCandidate buildMatchCandidate(FaceProfile profile, String probeDescriptor) {
        if (profile == null || profile.getDescriptorData() == null || probeDescriptor == null) {
            return null;
        }

        return Arrays.stream(profile.getDescriptorData().split(","))
            .map(String::trim)
            .filter(descriptor -> !descriptor.isBlank())
            .map(descriptor -> new MatchCandidate(profile, hammingDistance(descriptor, probeDescriptor)))
            .min(Comparator.comparingInt(MatchCandidate::distance))
            .orElse(null);
    }

    private String computeDescriptor(String imageData) {
        try {
            byte[] bytes = decodeImage(imageData);
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(bytes));
            if (image == null) {
                return null;
            }

            BufferedImage square = cropToSquare(image);
            BufferedImage scaled = scale(square, 8, 8);
            BufferedImage grayscale = new BufferedImage(8, 8, BufferedImage.TYPE_BYTE_GRAY);
            ColorConvertOp colorConvert = new ColorConvertOp(ColorSpace.getInstance(ColorSpace.CS_GRAY), null);
            colorConvert.filter(scaled, grayscale);

            int[] pixels = grayscale.getRaster().getPixels(0, 0, 8, 8, (int[]) null);
            double average = Arrays.stream(pixels).average().orElse(0.0);

            StringBuilder bitString = new StringBuilder();
            for (int pixel : pixels) {
                bitString.append(pixel >= average ? '1' : '0');
            }

            StringBuilder hex = new StringBuilder();
            for (int i = 0; i < bitString.length(); i += 4) {
                String nibble = bitString.substring(i, i + 4);
                hex.append(Integer.toHexString(Integer.parseInt(nibble, 2)));
            }
            return hex.toString();
        } catch (Exception e) {
            return null;
        }
    }

    private byte[] decodeImage(String imageData) {
        String base64 = imageData;
        int commaIndex = imageData.indexOf(',');
        if (commaIndex >= 0) {
            base64 = imageData.substring(commaIndex + 1);
        }
        return Base64.getDecoder().decode(base64);
    }

    private BufferedImage cropToSquare(BufferedImage source) {
        int size = Math.min(source.getWidth(), source.getHeight());
        int x = (source.getWidth() - size) / 2;
        int y = (source.getHeight() - size) / 2;
        return source.getSubimage(x, y, size, size);
    }

    private BufferedImage scale(BufferedImage source, int width, int height) {
        Image tmp = source.getScaledInstance(width, height, Image.SCALE_SMOOTH);
        BufferedImage resized = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = resized.createGraphics();
        g2d.drawImage(tmp, 0, 0, null);
        g2d.dispose();
        return resized;
    }

    private int hammingDistance(String hexA, String hexB) {
        BigInteger a = new BigInteger(hexA, 16);
        BigInteger b = new BigInteger(hexB, 16);
        return a.xor(b).bitCount();
    }

    private double calculateConfidence(int distance) {
        double confidence = 100.0 - ((distance / 64.0) * 100.0);
        return Math.max(0.0, Math.round(confidence * 100.0) / 100.0);
    }

    private FaceProfileSummaryDTO convertToSummary(FaceProfile profile) {
        Optional<Student> studentOpt = studentRepository.findByUserId(profile.getUser().getId());
        return new FaceProfileSummaryDTO(
            profile.getId(),
            profile.getUser().getId(),
            profile.getUser().getName(),
            profile.getUser().getEmail(),
            profile.getUser().getRole().name(),
            studentOpt.map(Student::getId).orElse(null),
            studentOpt.map(Student::getClassName).orElse(null),
            profile.getSampleCount(),
            profile.getSampleImageData(),
            profile.getLastMatchedAt()
        );
    }

    private record MatchCandidate(FaceProfile profile, int distance) {
    }
}

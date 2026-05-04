package com.kakeibu.service;

import com.kakeibu.entity.RefreshToken;
import com.kakeibu.entity.User;
import com.kakeibu.repository.RefreshTokenRepository;
import com.kakeibu.repository.UserRepository;
import com.kakeibu.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       JwtUtil jwtUtil,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Map<String, Object> anonymousLogin(String deviceId) {
        User user = userRepository.findByDeviceId(deviceId).orElseGet(() -> {
            User u = new User();
            u.setId(UUID.randomUUID().toString());
            u.setAnonymous(true);
            u.setDeviceId(deviceId);
            return userRepository.save(u);
        });
        return issueTokens(user);
    }

    @Transactional
    public Map<String, Object> login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다."));

        if (user.getPassword() == null || !passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        Map<String, Object> tokens = issueTokens(user);
        tokens.put("email", user.getEmail());
        return tokens;
    }

    @Transactional
    public Map<String, Object> register(String userId, String email, String password) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        if (!user.isAnonymous()) {
            throw new IllegalStateException("이미 등록된 계정입니다.");
        }
        if (userRepository.existsByEmail(email)) {
            throw new IllegalStateException("이미 사용 중인 이메일입니다.");
        }

        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setAnonymous(false);
        user.setDeviceId(null);
        userRepository.save(user);

        Map<String, Object> tokens = issueTokens(user);
        tokens.put("email", email);
        return tokens;
    }

    @Transactional
    public String refreshAccessToken(String rawRefreshToken) {
        String hash = jwtUtil.hashToken(rawRefreshToken);
        RefreshToken stored = refreshTokenRepository.findByToken(hash)
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 토큰입니다."));

        if (stored.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(stored);
            throw new IllegalArgumentException("만료된 토큰입니다.");
        }

        // verify JWT signature too
        String userId;
        try {
            userId = jwtUtil.parseRefreshToken(rawRefreshToken).getSubject();
        } catch (Exception e) {
            throw new IllegalArgumentException("유효하지 않은 토큰입니다.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 토큰입니다."));

        return jwtUtil.generateAccessToken(user.getId(), user.isAnonymous());
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken != null && !rawRefreshToken.isBlank()) {
            String hash = jwtUtil.hashToken(rawRefreshToken);
            refreshTokenRepository.deleteByToken(hash);
        }
    }

    public User getMe(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }

    private Map<String, Object> issueTokens(User user) {
        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.isAnonymous());
        String rawRefreshToken = jwtUtil.generateRefreshToken(user.getId());

        RefreshToken rt = new RefreshToken();
        rt.setId(UUID.randomUUID().toString());
        rt.setUserId(user.getId());
        rt.setToken(jwtUtil.hashToken(rawRefreshToken));
        rt.setExpiresAt(LocalDateTime.now().plusSeconds(jwtUtil.getRefreshExpiration() / 1000));
        refreshTokenRepository.save(rt);

        return new java.util.LinkedHashMap<>(Map.of(
                "accessToken", accessToken,
                "refreshToken", rawRefreshToken
        ));
    }
}

package com.kakeibu.security;

import com.kakeibu.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Date;
import java.util.HexFormat;

@Component
public class JwtUtil {

    private final SecretKey accessKey;
    private final SecretKey refreshKey;
    private final long accessExpiration;
    private final long refreshExpiration;

    public JwtUtil(JwtProperties props) {
        this.accessKey = Keys.hmacShaKeyFor(padSecret(props.secret()));
        this.refreshKey = Keys.hmacShaKeyFor(padSecret(props.refreshSecret()));
        this.accessExpiration = props.expiration();
        this.refreshExpiration = props.refreshExpiration();
    }

    private byte[] padSecret(String secret) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length >= 32) return bytes;
        byte[] padded = new byte[32];
        System.arraycopy(bytes, 0, padded, 0, bytes.length);
        return padded;
    }

    public String generateAccessToken(String userId, boolean isAnonymous) {
        return Jwts.builder()
                .subject(userId)
                .claim("isAnonymous", isAnonymous)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessExpiration))
                .signWith(accessKey)
                .compact();
    }

    public String generateRefreshToken(String userId) {
        return Jwts.builder()
                .subject(userId)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshExpiration))
                .signWith(refreshKey)
                .compact();
    }

    public Claims parseAccessToken(String token) {
        return Jwts.parser().verifyWith(accessKey).build().parseSignedClaims(token).getPayload();
    }

    public Claims parseRefreshToken(String token) {
        return Jwts.parser().verifyWith(refreshKey).build().parseSignedClaims(token).getPayload();
    }

    public boolean validateAccessToken(String token) {
        try {
            parseAccessToken(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String getUserIdFromAccessToken(String token) {
        return parseAccessToken(token).getSubject();
    }

    public boolean getIsAnonymousFromAccessToken(String token) {
        Object val = parseAccessToken(token).get("isAnonymous");
        return Boolean.TRUE.equals(val);
    }

    public long getRefreshExpiration() {
        return refreshExpiration;
    }

    public String hashToken(String token) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }
}

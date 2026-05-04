package com.kakeibu.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(
        String secret,
        String refreshSecret,
        long expiration,
        long refreshExpiration
) {}

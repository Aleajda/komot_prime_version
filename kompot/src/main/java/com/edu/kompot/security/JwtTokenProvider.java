package com.edu.kompot.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;
import java.util.function.Function;

@Component
public class JwtTokenProvider {

	@Value("${jwt.secret}")
	private String jwtSecret;

	@Value("${jwt.expiration}")
	private Long jwtExpiration;

	@Value("${jwt.refresh-expiration}")
	private Long refreshExpiration;

	private SecretKey getSigningKey() {
		return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
	}

	public String generateAccessToken(UUID userId) {
		return generateToken(userId, jwtExpiration);
	}

	public String generateRefreshToken(UUID userId) {
		return generateToken(userId, refreshExpiration);
	}

	private String generateToken(UUID userId, Long expiration) {
		Date now = new Date();
		Date expiryDate = new Date(now.getTime() + expiration);

		return Jwts.builder()
				.subject(userId.toString())
				.issuedAt(now)
				.expiration(expiryDate)
				.signWith(getSigningKey())
				.compact();
	}

	public UUID getUserIdFromToken(String token) {
		Claims claims = getAllClaimsFromToken(token);
		return UUID.fromString(claims.getSubject());
	}

	public Date getExpirationDateFromToken(String token) {
		return getClaimFromToken(token, Claims::getExpiration);
	}

	public <T> T getClaimFromToken(String token, Function<Claims, T> claimsResolver) {
		Claims claims = getAllClaimsFromToken(token);
		return claimsResolver.apply(claims);
	}

	private Claims getAllClaimsFromToken(String token) {
		return Jwts.parser()
				.verifyWith(getSigningKey())
				.build()
				.parseSignedClaims(token)
				.getPayload();
	}

	public Boolean validateToken(String token) {
		try {
			Jwts.parser()
					.verifyWith(getSigningKey())
					.build()
					.parseSignedClaims(token);
			return true;
		} catch (Exception e) {
			return false;
		}
	}
}










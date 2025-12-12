package com.edu.kompot.service;

import com.edu.kompot.dto.request.LoginRequest;
import com.edu.kompot.dto.request.RegisterRequest;
import com.edu.kompot.dto.response.AuthResponse;
import com.edu.kompot.dto.response.UserResponse;
import com.edu.kompot.exception.CustomException;
import com.edu.kompot.entity.User;
import com.edu.kompot.repository.UserRepository;
import com.edu.kompot.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtTokenProvider tokenProvider;
	private final AuthenticationManager authenticationManager;

	@Transactional
	public AuthResponse register(RegisterRequest request) {
		if (userRepository.existsByEmail(request.getEmail())) {
			throw new CustomException("Email already exists");
		}

		User user = User.builder()
				.email(request.getEmail())
				.password(passwordEncoder.encode(request.getPassword()))
				.username(request.getUsername())
				.firstName(request.getFirstName())
				.lastName(request.getLastName())
				.role(User.Role.USER)
				.isActive(true)
				.build();

		user = userRepository.save(user);

		String accessToken = tokenProvider.generateAccessToken(user.getId());
		String refreshToken = tokenProvider.generateRefreshToken(user.getId());

		return AuthResponse.builder()
				.accessToken(accessToken)
				.refreshToken(refreshToken)
				.user(mapToUserResponse(user))
				.build();
	}

	public AuthResponse login(LoginRequest request) {
		Authentication authentication = authenticationManager.authenticate(
				new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
		);

		User user = userRepository.findByEmail(request.getEmail())
				.orElseThrow(() -> new CustomException("User not found"));

		String accessToken = tokenProvider.generateAccessToken(user.getId());
		String refreshToken = tokenProvider.generateRefreshToken(user.getId());

		return AuthResponse.builder()
				.accessToken(accessToken)
				.refreshToken(refreshToken)
				.user(mapToUserResponse(user))
				.build();
	}

	private UserResponse mapToUserResponse(User user) {
		return UserResponse.builder()
				.id(user.getId())
				.email(user.getEmail())
				.username(user.getUsername())
				.firstName(user.getFirstName())
				.lastName(user.getLastName())
				.avatar(user.getAvatar())
				.role(user.getRole())
				.isActive(user.getIsActive())
				.createdAt(user.getCreatedAt())
				.updatedAt(user.getUpdatedAt())
				.build();
	}
}


package com.edu.kompot.service;

import com.edu.kompot.dto.response.UserResponse;
import com.edu.kompot.entity.User;
import com.edu.kompot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminService {

	private final UserRepository userRepository;

	public Page<UserResponse> getAllUsers(Pageable pageable) {
		return userRepository.findAll(pageable)
				.map(this::mapToUserResponse);
	}

	@Transactional
	public UserResponse updateUserRole(UUID userId, User.Role role) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new RuntimeException("User not found"));
		user.setRole(role);
		user = userRepository.save(user);
		return mapToUserResponse(user);
	}

	@Transactional
	public UserResponse toggleUserStatus(UUID userId) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new RuntimeException("User not found"));
		user.setIsActive(!user.getIsActive());
		user = userRepository.save(user);
		return mapToUserResponse(user);
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


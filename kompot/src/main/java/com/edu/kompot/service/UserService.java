package com.edu.kompot.service;

import com.edu.kompot.dto.response.UserResponse;
import com.edu.kompot.exception.CustomException;
import com.edu.kompot.entity.User;
import com.edu.kompot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

	private final UserRepository userRepository;

	public UserResponse getUserById(UUID id) {
		User user = userRepository.findById(id)
				.orElseThrow(() -> new CustomException("User not found"));
		return mapToUserResponse(user);
	}

	public Page<UserResponse> getAllUsers(Pageable pageable) {
		return userRepository.findAll(pageable)
				.map(this::mapToUserResponse);
	}

	public List<UserResponse> searchUsers(String query) {
		if (query == null || query.isBlank()) {
			return List.of();
		}
		return userRepository.findTop20ByEmailContainingIgnoreCaseOrUsernameContainingIgnoreCase(query, query)
				.stream()
				.map(this::mapToUserResponse)
				.collect(Collectors.toList());
	}

	@Transactional
	public UserResponse updateUser(UUID id, UserResponse userResponse) {
		User user = userRepository.findById(id)
				.orElseThrow(() -> new CustomException("User not found"));

		if (userResponse.getUsername() != null) {
			user.setUsername(userResponse.getUsername());
		}
		if (userResponse.getFirstName() != null) {
			user.setFirstName(userResponse.getFirstName());
		}
		if (userResponse.getLastName() != null) {
			user.setLastName(userResponse.getLastName());
		}
		if (userResponse.getAvatar() != null) {
			user.setAvatar(userResponse.getAvatar());
		}

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


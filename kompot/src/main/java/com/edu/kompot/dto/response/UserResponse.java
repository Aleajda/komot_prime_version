package com.edu.kompot.dto.response;

import com.edu.kompot.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
	private UUID id;
	private String email;
	private String username;
	private String firstName;
	private String lastName;
	private String avatar;
	private User.Role role;
	private Boolean isActive;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;
}


package com.edu.kompot.dto.response;

import com.edu.kompot.entity.Friendship;
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
public class FriendshipResponse {
	private UUID id;
	private UserResponse requester;
	private UserResponse addressee;
	private Friendship.Status status;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;
}



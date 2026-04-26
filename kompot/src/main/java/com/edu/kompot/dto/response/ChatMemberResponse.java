package com.edu.kompot.dto.response;

import com.edu.kompot.entity.ChatMember;
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
public class ChatMemberResponse {
	private UUID id;
	private UUID chatId;
	private UserResponse user;
	private ChatMember.Role role;
	private boolean owner;
	private LocalDateTime joinedAt;
}








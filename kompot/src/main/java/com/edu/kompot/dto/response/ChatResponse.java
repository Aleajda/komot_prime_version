package com.edu.kompot.dto.response;

import com.edu.kompot.entity.Chat;
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
public class ChatResponse {
	private UUID id;
	private Chat.ChatType type;
	private String name;
	private UUID teamId;
	private UUID projectId;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;
}






package com.edu.kompot.dto.request;

import com.edu.kompot.entity.Chat;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class ChatCreateRequest {

	@NotNull(message = "Chat type is required")
	private Chat.ChatType type;

	private String name;

	private UUID teamId;

	private UUID projectId;
}






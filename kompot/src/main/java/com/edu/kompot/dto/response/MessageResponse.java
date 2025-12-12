package com.edu.kompot.dto.response;

import com.edu.kompot.entity.Message;
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
public class MessageResponse {
	private UUID id;
	private UUID chatId;
	private UUID senderId;
	private String content;
	private Message.MessageType type;
	private String fileUrl;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;
}


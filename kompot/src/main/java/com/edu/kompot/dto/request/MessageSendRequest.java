package com.edu.kompot.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageSendRequest {
	private String content;
	private String type;
	private UUID chatId;
}


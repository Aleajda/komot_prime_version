package com.edu.kompot.controller;

import com.edu.kompot.dto.request.MessageSendRequest;
import com.edu.kompot.dto.response.MessageResponse;
import com.edu.kompot.entity.Message;
import com.edu.kompot.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import java.util.UUID;

@Controller
@RequiredArgsConstructor
@Slf4j
public class MessageController {

	private final ChatService chatService;
	private final SimpMessagingTemplate messagingTemplate;

	@MessageMapping("/chat.send")
	public void sendMessage(@Payload MessageSendRequest request, Authentication authentication) {
		log.info("=== WEB SOCKET MESSAGE RECEIVED ===");
		log.info("Request object: {}", request);
		log.info("Request chatId: {}", request != null ? request.getChatId() : "NULL");
		log.info("Request content: {}", request != null ? request.getContent() : "NULL");
		
		try {
			UUID senderId = UUID.fromString(authentication.getName());
			UUID chatId = request != null ? request.getChatId() : null;
			
			log.info("Parsed chatId: {}, senderId: {}", chatId, senderId);
			
			if (chatId == null) {
				log.error("!!! CHATID IS NULL !!! Cannot send message. Request: {}", request);
				return;
			}

			if (request == null || request.getContent() == null || request.getContent().trim().isEmpty()) {
				log.error("!!! CONTENT IS NULL OR EMPTY !!! Request: {}", request);
				return;
			}

			MessageResponse messageResponse = MessageResponse.builder()
					.content(request.getContent())
					.type(request.getType() != null ? Message.MessageType.valueOf(request.getType()) : Message.MessageType.TEXT)
					.chatId(chatId)
					.build();

			MessageResponse sentMessage = chatService.sendMessage(messageResponse, chatId, senderId);
			String destination = "/topic/chat." + chatId;
			log.info("Sending message to destination: {}, messageId: {}", destination, sentMessage != null ? sentMessage.getId() : "NULL");
			
			messagingTemplate.convertAndSend(destination, sentMessage);
			log.info("Message sent successfully to {}", destination);
		} catch (Exception e) {
			log.error("!!! ERROR SENDING MESSAGE VIA WEBSOCKET !!!", e);
		}
		log.info("=== END WEB SOCKET MESSAGE ===");
	}

	@MessageMapping("/chat.typing")
	public void handleTyping(@DestinationVariable UUID chatId, @Payload String userId, Authentication authentication) {
		UUID currentUserId = UUID.fromString(authentication.getName());
		messagingTemplate.convertAndSend("/topic/chat." + chatId + ".typing", currentUserId.toString());
	}
}



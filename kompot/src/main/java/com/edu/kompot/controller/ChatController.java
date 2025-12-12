package com.edu.kompot.controller;

import com.edu.kompot.dto.request.ChatCreateRequest;
import com.edu.kompot.dto.response.ChatMemberResponse;
import com.edu.kompot.dto.response.ChatResponse;
import com.edu.kompot.dto.response.MessageResponse;
import com.edu.kompot.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
public class ChatController {

	private final ChatService chatService;

	@GetMapping
	public ResponseEntity<List<ChatResponse>> getUserChats(Authentication authentication) {
		UUID userId = UUID.fromString(authentication.getName());
		return ResponseEntity.ok(chatService.getUserChats(userId));
	}

	@PostMapping
	public ResponseEntity<ChatResponse> createChat(@RequestBody ChatCreateRequest request, Authentication authentication) {
		UUID userId = UUID.fromString(authentication.getName());
		return ResponseEntity.ok(chatService.createChat(request, userId));
	}

	@GetMapping("/{chatId}/messages")
	public ResponseEntity<List<MessageResponse>> getChatMessages(@PathVariable UUID chatId) {
		return ResponseEntity.ok(chatService.getChatMessages(chatId));
	}

	@GetMapping("/{chatId}/members")
	public ResponseEntity<List<ChatMemberResponse>> getChatMembers(@PathVariable UUID chatId) {
		return ResponseEntity.ok(chatService.getChatMembers(chatId));
	}

	@PostMapping("/{chatId}/messages")
	public ResponseEntity<MessageResponse> sendMessage(@PathVariable UUID chatId, @RequestBody MessageResponse messageResponse, Authentication authentication) {
		UUID senderId = UUID.fromString(authentication.getName());
		return ResponseEntity.ok(chatService.sendMessage(messageResponse, chatId, senderId));
	}

	@PostMapping("/{chatId}/members")
	public ResponseEntity<Void> addMemberToChat(@PathVariable UUID chatId, @RequestParam UUID userId, Authentication authentication) {
		UUID requesterId = UUID.fromString(authentication.getName());
		chatService.addMemberToChat(chatId, userId, requesterId);
		return ResponseEntity.ok().build();
	}

	@DeleteMapping("/{chatId}/members/{userId}")
	public ResponseEntity<Void> removeMemberFromChat(@PathVariable UUID chatId, @PathVariable UUID userId, Authentication authentication) {
		UUID requesterId = UUID.fromString(authentication.getName());
		chatService.removeMemberFromChat(chatId, userId, requesterId);
		return ResponseEntity.noContent().build();
	}

	@PostMapping("/direct/{userId}")
	public ResponseEntity<ChatResponse> getOrCreateDirectChat(@PathVariable UUID userId, Authentication authentication) {
		UUID currentUserId = UUID.fromString(authentication.getName());
		return ResponseEntity.ok(chatService.getOrCreateDirectChat(currentUserId, userId));
	}
}






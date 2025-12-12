package com.edu.kompot.controller;

import com.edu.kompot.dto.response.FriendshipResponse;
import com.edu.kompot.dto.response.UserResponse;
import com.edu.kompot.service.FriendshipService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendshipController {

	private final FriendshipService friendshipService;

	@PostMapping("/request/{userId}")
	public ResponseEntity<FriendshipResponse> sendFriendRequest(@PathVariable UUID userId, Authentication authentication) {
		UUID requesterId = UUID.fromString(authentication.getName());
		return ResponseEntity.ok(friendshipService.sendFriendRequest(requesterId, userId));
	}

	@PostMapping("/accept/{friendshipId}")
	public ResponseEntity<FriendshipResponse> acceptFriendRequest(@PathVariable UUID friendshipId, Authentication authentication) {
		UUID userId = UUID.fromString(authentication.getName());
		return ResponseEntity.ok(friendshipService.acceptFriendRequest(userId, friendshipId));
	}

	@PostMapping("/reject/{friendshipId}")
	public ResponseEntity<Void> rejectFriendRequest(@PathVariable UUID friendshipId, Authentication authentication) {
		UUID userId = UUID.fromString(authentication.getName());
		friendshipService.rejectFriendRequest(userId, friendshipId);
		return ResponseEntity.ok().build();
	}

	@DeleteMapping("/{friendId}")
	public ResponseEntity<Void> removeFriend(@PathVariable UUID friendId, Authentication authentication) {
		UUID userId = UUID.fromString(authentication.getName());
		friendshipService.removeFriend(userId, friendId);
		return ResponseEntity.ok().build();
	}

	@GetMapping
	public ResponseEntity<List<UserResponse>> getFriends(Authentication authentication) {
		UUID userId = UUID.fromString(authentication.getName());
		return ResponseEntity.ok(friendshipService.getFriends(userId));
	}

	@GetMapping("/requests")
	public ResponseEntity<List<FriendshipResponse>> getPendingRequests(Authentication authentication) {
		UUID userId = UUID.fromString(authentication.getName());
		return ResponseEntity.ok(friendshipService.getPendingRequests(userId));
	}

	@GetMapping("/followers")
	public ResponseEntity<List<UserResponse>> getFollowers(Authentication authentication) {
		UUID userId = UUID.fromString(authentication.getName());
		return ResponseEntity.ok(friendshipService.getFollowers(userId));
	}

	@GetMapping("/check/{userId}")
	public ResponseEntity<Boolean> areFriends(@PathVariable UUID userId, Authentication authentication) {
		UUID currentUserId = UUID.fromString(authentication.getName());
		return ResponseEntity.ok(friendshipService.areFriends(currentUserId, userId));
	}
}



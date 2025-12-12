package com.edu.kompot.controller;

import com.edu.kompot.dto.response.UserResponse;
import com.edu.kompot.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

	private final UserService userService;

	@GetMapping
	public ResponseEntity<Page<UserResponse>> getAllUsers(Pageable pageable) {
		return ResponseEntity.ok(userService.getAllUsers(pageable));
	}

	@GetMapping("/search")
	public ResponseEntity<List<UserResponse>> searchUsers(@RequestParam String query) {
		return ResponseEntity.ok(userService.searchUsers(query));
	}

	@GetMapping("/{id}")
	public ResponseEntity<UserResponse> getUserById(@PathVariable UUID id) {
		return ResponseEntity.ok(userService.getUserById(id));
	}

	@GetMapping("/me")
	public ResponseEntity<UserResponse> getCurrentUser(Authentication authentication) {
		UUID userId = UUID.fromString(authentication.getName());
		return ResponseEntity.ok(userService.getUserById(userId));
	}

	@PutMapping("/{id}")
	public ResponseEntity<UserResponse> updateUser(@PathVariable UUID id, @RequestBody UserResponse userResponse) {
		return ResponseEntity.ok(userService.updateUser(id, userResponse));
	}
}






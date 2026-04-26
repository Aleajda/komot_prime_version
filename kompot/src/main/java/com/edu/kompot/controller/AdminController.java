package com.edu.kompot.controller;

import com.edu.kompot.dto.response.AdminStatsResponse;
import com.edu.kompot.dto.response.AdminTeamSummary;
import com.edu.kompot.dto.response.UserResponse;
import com.edu.kompot.entity.User;
import com.edu.kompot.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

	private final AdminService adminService;

	@GetMapping("/users")
	public ResponseEntity<Page<UserResponse>> getAllUsers(Pageable pageable) {
		return ResponseEntity.ok(adminService.getAllUsers(pageable));
	}

	@GetMapping("/statistics")
	public ResponseEntity<AdminStatsResponse> getStatistics() {
		return ResponseEntity.ok(adminService.getStatistics());
	}

	@GetMapping("/teams")
	public ResponseEntity<List<AdminTeamSummary>> getTeams() {
		return ResponseEntity.ok(adminService.getTeamSummaries());
	}

	@PutMapping("/users/{userId}/role")
	public ResponseEntity<UserResponse> updateUserRole(@PathVariable UUID userId, @RequestParam User.Role role) {
		return ResponseEntity.ok(adminService.updateUserRole(userId, role));
	}

	@PutMapping("/users/{userId}/status")
	public ResponseEntity<UserResponse> toggleUserStatus(@PathVariable UUID userId) {
		return ResponseEntity.ok(adminService.toggleUserStatus(userId));
	}
}


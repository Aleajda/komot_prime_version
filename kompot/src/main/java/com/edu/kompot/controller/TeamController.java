package com.edu.kompot.controller;

import com.edu.kompot.dto.response.TeamResponse;
import com.edu.kompot.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {

	private final TeamService teamService;

	@GetMapping
	public ResponseEntity<List<TeamResponse>> getUserTeams(Authentication authentication) {
		UUID userId = UUID.fromString(authentication.getName());
		return ResponseEntity.ok(teamService.getUserTeams(userId));
	}

	@PostMapping
	public ResponseEntity<TeamResponse> createTeam(@RequestBody TeamResponse teamResponse, Authentication authentication) {
		UUID ownerId = UUID.fromString(authentication.getName());
		return ResponseEntity.ok(teamService.createTeam(teamResponse, ownerId));
	}

	@GetMapping("/{id}")
	public ResponseEntity<TeamResponse> getTeamById(@PathVariable UUID id) {
		return ResponseEntity.ok(teamService.getTeamById(id));
	}

	@PutMapping("/{id}")
	public ResponseEntity<TeamResponse> updateTeam(@PathVariable UUID id, @RequestBody TeamResponse teamResponse) {
		return ResponseEntity.ok(teamService.updateTeam(id, teamResponse));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> deleteTeam(@PathVariable UUID id) {
		teamService.deleteTeam(id);
		return ResponseEntity.noContent().build();
	}
}











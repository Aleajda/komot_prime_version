package com.edu.kompot.controller;

import com.edu.kompot.dto.response.ProjectResponse;
import com.edu.kompot.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProjectController {

	private final ProjectService projectService;

	@GetMapping("/teams/{teamId}/projects")
	public ResponseEntity<List<ProjectResponse>> getTeamProjects(
			@PathVariable UUID teamId,
			Authentication authentication
	) {
		UUID userId = UUID.fromString(authentication.getName());
		return ResponseEntity.ok(projectService.getTeamProjects(teamId, userId));
	}

	@PostMapping("/teams/{teamId}/projects")
	public ResponseEntity<ProjectResponse> createProject(
			@PathVariable UUID teamId,
			@RequestBody ProjectResponse projectResponse,
			Authentication authentication
	) {
		UUID userId = UUID.fromString(authentication.getName());
		return ResponseEntity.ok(projectService.createProject(projectResponse, teamId, userId));
	}

	@GetMapping("/projects/{id}")
	public ResponseEntity<ProjectResponse> getProjectById(@PathVariable UUID id) {
		return ResponseEntity.ok(projectService.getProjectById(id));
	}

	@PutMapping("/projects/{id}")
	public ResponseEntity<ProjectResponse> updateProject(
			@PathVariable UUID id,
			@RequestBody ProjectResponse projectResponse,
			Authentication authentication
	) {
		UUID userId = UUID.fromString(authentication.getName());
		return ResponseEntity.ok(projectService.updateProject(id, projectResponse, userId));
	}

	@DeleteMapping("/projects/{id}")
	public ResponseEntity<Void> deleteProject(@PathVariable UUID id, Authentication authentication) {
		UUID userId = UUID.fromString(authentication.getName());
		projectService.deleteProject(id, userId);
		return ResponseEntity.noContent().build();
	}
}











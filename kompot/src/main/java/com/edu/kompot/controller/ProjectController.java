package com.edu.kompot.controller;

import com.edu.kompot.dto.response.ProjectResponse;
import com.edu.kompot.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProjectController {

	private final ProjectService projectService;

	@GetMapping("/teams/{teamId}/projects")
	public ResponseEntity<List<ProjectResponse>> getTeamProjects(@PathVariable UUID teamId) {
		return ResponseEntity.ok(projectService.getTeamProjects(teamId));
	}

	@PostMapping("/teams/{teamId}/projects")
	public ResponseEntity<ProjectResponse> createProject(@PathVariable UUID teamId, @RequestBody ProjectResponse projectResponse) {
		return ResponseEntity.ok(projectService.createProject(projectResponse, teamId));
	}

	@GetMapping("/projects/{id}")
	public ResponseEntity<ProjectResponse> getProjectById(@PathVariable UUID id) {
		return ResponseEntity.ok(projectService.getProjectById(id));
	}

	@PutMapping("/projects/{id}")
	public ResponseEntity<ProjectResponse> updateProject(@PathVariable UUID id, @RequestBody ProjectResponse projectResponse) {
		return ResponseEntity.ok(projectService.updateProject(id, projectResponse));
	}

	@DeleteMapping("/projects/{id}")
	public ResponseEntity<Void> deleteProject(@PathVariable UUID id) {
		projectService.deleteProject(id);
		return ResponseEntity.noContent().build();
	}
}










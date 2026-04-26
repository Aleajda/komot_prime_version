package com.edu.kompot.controller;

import com.edu.kompot.dto.response.TaskResponse;
import com.edu.kompot.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TaskController {

	private final TaskService taskService;

	@GetMapping("/projects/{projectId}/tasks")
	public ResponseEntity<List<TaskResponse>> getProjectTasks(@PathVariable UUID projectId) {
		return ResponseEntity.ok(taskService.getProjectTasks(projectId));
	}

	@PostMapping("/projects/{projectId}/tasks")
	public ResponseEntity<TaskResponse> createTask(@PathVariable UUID projectId, @RequestBody TaskResponse taskResponse, Authentication authentication) {
		UUID creatorId = UUID.fromString(authentication.getName());
		return ResponseEntity.ok(taskService.createTask(taskResponse, projectId, creatorId));
	}

	@GetMapping("/tasks/{id}")
	public ResponseEntity<TaskResponse> getTaskById(@PathVariable UUID id) {
		return ResponseEntity.ok(taskService.getTaskById(id));
	}

	@PutMapping("/tasks/{id}")
	public ResponseEntity<TaskResponse> updateTask(
			@PathVariable UUID id,
			@RequestBody TaskResponse taskResponse,
			Authentication authentication
	) {
		UUID userId = UUID.fromString(authentication.getName());
		return ResponseEntity.ok(taskService.updateTask(id, taskResponse, userId));
	}

	@DeleteMapping("/tasks/{id}")
	public ResponseEntity<Void> deleteTask(@PathVariable UUID id, Authentication authentication) {
		UUID userId = UUID.fromString(authentication.getName());
		taskService.deleteTask(id, userId);
		return ResponseEntity.noContent().build();
	}
}











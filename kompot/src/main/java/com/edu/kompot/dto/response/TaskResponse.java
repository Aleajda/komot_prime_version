package com.edu.kompot.dto.response;

import com.edu.kompot.entity.Task;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskResponse {
	private UUID id;
	private String title;
	private String description;
	private UUID projectId;
	private UUID assigneeId;
	private UUID creatorId;
	private Task.TaskStatus status;
	private Task.TaskPriority priority;
	private LocalDateTime dueDate;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;
}


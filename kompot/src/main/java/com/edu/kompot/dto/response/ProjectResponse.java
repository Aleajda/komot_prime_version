package com.edu.kompot.dto.response;

import com.edu.kompot.entity.Project;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectResponse {
	private UUID id;
	private String name;
	private String description;
	private UUID teamId;
	private Project.ProjectStatus status;
	private Set<UUID> editorIds;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;
}


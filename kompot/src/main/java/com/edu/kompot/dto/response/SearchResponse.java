package com.edu.kompot.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchResponse {
	private List<ProjectHint> projects;
	private List<TaskHint> tasks;

	@Data
	@NoArgsConstructor
	@AllArgsConstructor
	@Builder
	public static class ProjectHint {
		private UUID id;
		private String name;
		private UUID teamId;
		private String teamName;
	}

	@Data
	@NoArgsConstructor
	@AllArgsConstructor
	@Builder
	public static class TaskHint {
		private UUID id;
		private String title;
		private UUID projectId;
		private String projectName;
		private UUID teamId;
		private String teamName;
	}
}


package com.edu.kompot.service;

import com.edu.kompot.dto.response.SearchResponse;
import com.edu.kompot.entity.TeamMember;
import com.edu.kompot.repository.ProjectRepository;
import com.edu.kompot.repository.TaskRepository;
import com.edu.kompot.repository.TeamMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SearchService {

	private final TeamMemberRepository teamMemberRepository;
	private final ProjectRepository projectRepository;
	private final TaskRepository taskRepository;

	public SearchResponse search(UUID userId, String query) {
		if (query == null || query.isBlank()) {
			return SearchResponse.builder()
					.projects(List.of())
					.tasks(List.of())
					.build();
		}

		String trimmed = query.trim();
		List<UUID> teamIds = teamMemberRepository.findByUserId(userId).stream()
				.map(TeamMember::getTeam)
				.map(team -> team.getId())
				.toList();

		if (teamIds.isEmpty()) {
			return SearchResponse.builder()
					.projects(List.of())
					.tasks(List.of())
					.build();
		}

		var projects = projectRepository.findTop10ByTeamIdInAndNameContainingIgnoreCaseOrderByUpdatedAtDesc(teamIds, trimmed)
				.stream()
				.map(project -> SearchResponse.ProjectHint.builder()
						.id(project.getId())
						.name(project.getName())
						.teamId(project.getTeam().getId())
						.teamName(project.getTeam().getName())
						.build())
				.toList();

		var tasks = taskRepository.findTop10ByProjectTeamIdInAndTitleContainingIgnoreCaseOrderByUpdatedAtDesc(teamIds, trimmed)
				.stream()
				.map(task -> SearchResponse.TaskHint.builder()
						.id(task.getId())
						.title(task.getTitle())
						.projectId(task.getProject().getId())
						.projectName(task.getProject().getName())
						.teamId(task.getProject().getTeam().getId())
						.teamName(task.getProject().getTeam().getName())
						.build())
				.toList();

		return SearchResponse.builder()
				.projects(projects)
				.tasks(tasks)
				.build();
	}
}


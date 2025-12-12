package com.edu.kompot.service;

import com.edu.kompot.dto.response.ProjectResponse;
import com.edu.kompot.exception.CustomException;
import com.edu.kompot.entity.Project;
import com.edu.kompot.entity.Team;
import com.edu.kompot.repository.ProjectRepository;
import com.edu.kompot.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

	private final ProjectRepository projectRepository;
	private final TeamRepository teamRepository;

	public List<ProjectResponse> getTeamProjects(UUID teamId) {
		return projectRepository.findByTeamId(teamId).stream()
				.map(this::mapToProjectResponse)
				.collect(Collectors.toList());
	}

	@Transactional
	public ProjectResponse createProject(ProjectResponse projectResponse, UUID teamId) {
		Team team = teamRepository.findById(teamId)
				.orElseThrow(() -> new CustomException("Team not found"));

		Project project = Project.builder()
				.name(projectResponse.getName())
				.description(projectResponse.getDescription())
				.team(team)
				.status(projectResponse.getStatus() != null ? projectResponse.getStatus() : Project.ProjectStatus.ACTIVE)
				.build();

		project = projectRepository.save(project);
		return mapToProjectResponse(project);
	}

	public ProjectResponse getProjectById(UUID id) {
		Project project = projectRepository.findById(id)
				.orElseThrow(() -> new CustomException("Project not found"));
		return mapToProjectResponse(project);
	}

	@Transactional
	public ProjectResponse updateProject(UUID id, ProjectResponse projectResponse) {
		Project project = projectRepository.findById(id)
				.orElseThrow(() -> new CustomException("Project not found"));

		if (projectResponse.getName() != null) {
			project.setName(projectResponse.getName());
		}
		if (projectResponse.getDescription() != null) {
			project.setDescription(projectResponse.getDescription());
		}
		if (projectResponse.getStatus() != null) {
			project.setStatus(projectResponse.getStatus());
		}

		project = projectRepository.save(project);
		return mapToProjectResponse(project);
	}

	@Transactional
	public void deleteProject(UUID id) {
		if (!projectRepository.existsById(id)) {
			throw new CustomException("Project not found");
		}
		projectRepository.deleteById(id);
	}

	private ProjectResponse mapToProjectResponse(Project project) {
		return ProjectResponse.builder()
				.id(project.getId())
				.name(project.getName())
				.description(project.getDescription())
				.teamId(project.getTeam().getId())
				.status(project.getStatus())
				.createdAt(project.getCreatedAt())
				.updatedAt(project.getUpdatedAt())
				.build();
	}
}


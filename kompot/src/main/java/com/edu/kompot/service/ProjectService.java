package com.edu.kompot.service;

import com.edu.kompot.dto.response.ProjectResponse;
import com.edu.kompot.exception.CustomException;
import com.edu.kompot.entity.Project;
import com.edu.kompot.entity.Team;
import com.edu.kompot.entity.User;
import com.edu.kompot.repository.ProjectRepository;
import com.edu.kompot.repository.TeamMemberRepository;
import com.edu.kompot.repository.TeamRepository;
import com.edu.kompot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

	private final ProjectRepository projectRepository;
	private final TeamRepository teamRepository;
	private final TeamMemberRepository teamMemberRepository;
	private final UserRepository userRepository;

	public List<ProjectResponse> getTeamProjects(UUID teamId) {
		return projectRepository.findByTeamId(teamId).stream()
				.map(this::mapToProjectResponse)
				.collect(Collectors.toList());
	}

	@Transactional
	public ProjectResponse createProject(ProjectResponse projectResponse, UUID teamId, UUID currentUserId) {
		Team team = teamRepository.findById(teamId)
				.orElseThrow(() -> new CustomException("Team not found"));

		validateTeamMember(team, currentUserId);

		Set<UUID> editorIds = normalizeEditorIds(projectResponse.getEditorIds(), currentUserId);

		Project project = Project.builder()
				.name(projectResponse.getName())
				.description(projectResponse.getDescription())
				.team(team)
				.status(projectResponse.getStatus() != null ? projectResponse.getStatus() : Project.ProjectStatus.ACTIVE)
				.editorIds(editorIds)
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
	public ProjectResponse updateProject(UUID id, ProjectResponse projectResponse, UUID currentUserId) {
		Project project = projectRepository.findById(id)
				.orElseThrow(() -> new CustomException("Project not found"));
		validateProjectEditor(project, currentUserId);

		if (projectResponse.getName() != null) {
			project.setName(projectResponse.getName());
		}
		if (projectResponse.getDescription() != null) {
			project.setDescription(projectResponse.getDescription());
		}
		if (projectResponse.getStatus() != null) {
			project.setStatus(projectResponse.getStatus());
		}
		if (projectResponse.getEditorIds() != null) {
			project.setEditorIds(normalizeEditorIds(projectResponse.getEditorIds(), project.getTeam().getOwner().getId()));
		}

		project = projectRepository.save(project);
		return mapToProjectResponse(project);
	}

	@Transactional
	public void deleteProject(UUID id, UUID currentUserId) {
		Project project = projectRepository.findById(id)
				.orElseThrow(() -> new CustomException("Project not found"));
		validateProjectEditor(project, currentUserId);
		projectRepository.delete(project);
	}

	private ProjectResponse mapToProjectResponse(Project project) {
		return ProjectResponse.builder()
				.id(project.getId())
				.name(project.getName())
				.description(project.getDescription())
				.teamId(project.getTeam().getId())
				.status(project.getStatus())
				.editorIds(project.getEditorIds())
				.createdAt(project.getCreatedAt())
				.updatedAt(project.getUpdatedAt())
				.build();
	}

	private Set<UUID> normalizeEditorIds(Set<UUID> requestedEditorIds, UUID requiredEditorId) {
		Set<UUID> editorIds = requestedEditorIds == null ? new HashSet<>() : new HashSet<>(requestedEditorIds);
		editorIds.add(requiredEditorId);
		return editorIds;
	}

	private void validateProjectEditor(Project project, UUID userId) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new CustomException("User not found"));
		if (user.getRole() == User.Role.ADMIN) {
			return;
		}
		if (!project.getEditorIds().contains(userId)) {
			throw new CustomException("No permission to edit project");
		}
	}

	private void validateTeamMember(Team team, UUID userId) {
		if (team.getOwner().getId().equals(userId) || teamMemberRepository.existsByTeamIdAndUserId(team.getId(), userId)) {
			return;
		}
		throw new CustomException("No permission to create project");
	}
}


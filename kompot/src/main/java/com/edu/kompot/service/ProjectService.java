package com.edu.kompot.service;

import com.edu.kompot.dto.response.ProjectResponse;
import com.edu.kompot.exception.CustomException;
import com.edu.kompot.entity.Project;
import com.edu.kompot.entity.Team;
import com.edu.kompot.entity.User;
import com.edu.kompot.repository.ProjectRepository;
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
	private final UserRepository userRepository;

	public List<ProjectResponse> getTeamProjects(UUID teamId, UUID currentUserId) {
		Team team = teamRepository.findById(teamId)
				.orElseThrow(() -> new CustomException("Team not found"));
		validateTeamAccess(team, currentUserId);

		User user = userRepository.findById(currentUserId)
				.orElseThrow(() -> new CustomException("User not found"));
		boolean globalAdmin = user.getRole() == User.Role.ADMIN;
		boolean teamPrivileged = isTeamOwnerOrAdmin(team, currentUserId);

		return projectRepository.findByTeamId(teamId).stream()
				.filter((project) -> globalAdmin || teamPrivileged || canViewProject(project, currentUserId))
				.map(this::mapToProjectResponse)
				.collect(Collectors.toList());
	}

	@Transactional
	public ProjectResponse createProject(ProjectResponse projectResponse, UUID teamId, UUID currentUserId) {
		Team team = teamRepository.findById(teamId)
				.orElseThrow(() -> new CustomException("Team not found"));

		validateTeamAdminOrOwner(team, currentUserId);

		Set<UUID> editorIds = normalizeProjectAdminIds(projectResponse.getEditorIds(), team);
		editorIds.add(currentUserId);
		Set<UUID> memberIds = sanitizeProjectMemberIds(team, editorIds, projectResponse.getMemberIds());

		Project project = Project.builder()
				.name(projectResponse.getName())
				.description(projectResponse.getDescription())
				.team(team)
				.status(projectResponse.getStatus() != null ? projectResponse.getStatus() : Project.ProjectStatus.ACTIVE)
				.editorIds(editorIds)
				.memberIds(memberIds)
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
		validateProjectOrTeamAdmin(project, currentUserId);

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
			project.setEditorIds(normalizeProjectAdminIds(projectResponse.getEditorIds(), project.getTeam()));
		}
		if (projectResponse.getMemberIds() != null) {
			project.setMemberIds(sanitizeProjectMemberIds(project.getTeam(), project.getEditorIds(), projectResponse.getMemberIds()));
		}

		project = projectRepository.save(project);
		return mapToProjectResponse(project);
	}

	@Transactional
	public void deleteProject(UUID id, UUID currentUserId) {
		Project project = projectRepository.findById(id)
				.orElseThrow(() -> new CustomException("Project not found"));
		validateProjectAdmin(project, currentUserId);
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
				.memberIds(project.getMemberIds())
				.createdAt(project.getCreatedAt())
				.updatedAt(project.getUpdatedAt())
				.build();
	}

	private Set<UUID> normalizeProjectAdminIds(Set<UUID> requestedEditorIds, Team team) {
		Set<UUID> editorIds = requestedEditorIds == null ? new HashSet<>() : new HashSet<>(requestedEditorIds);
		editorIds.add(team.getOwner().getId());
		for (UUID id : new HashSet<>(editorIds)) {
			validateUserBelongsToTeam(team, id);
		}
		return editorIds;
	}

	private Set<UUID> sanitizeProjectMemberIds(Team team, Set<UUID> projectAdminIds, Set<UUID> requestedMembers) {
		Set<UUID> members = requestedMembers == null ? new HashSet<>() : new HashSet<>(requestedMembers);
		members.removeAll(projectAdminIds);
		for (UUID id : new HashSet<>(members)) {
			validateUserBelongsToTeam(team, id);
		}
		return members;
	}

	private void validateUserBelongsToTeam(Team team, UUID userId) {
		if (team.getOwner().getId().equals(userId)) {
			return;
		}
		if (team.getEditorIds().contains(userId) || team.getMemberIds().contains(userId)) {
			return;
		}
		throw new CustomException("User is not a member of this team");
	}

	private void validateTeamAccess(Team team, UUID userId) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new CustomException("User not found"));
		if (user.getRole() == User.Role.ADMIN) {
			return;
		}
		if (isTeamOwnerOrAdmin(team, userId) || team.getMemberIds().contains(userId)) {
			return;
		}
		throw new CustomException("No access to team");
	}

	private void validateTeamAdminOrOwner(Team team, UUID userId) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new CustomException("User not found"));
		if (user.getRole() == User.Role.ADMIN) {
			return;
		}
		if (isTeamOwnerOrAdmin(team, userId)) {
			return;
		}
		throw new CustomException("No permission to create project");
	}

	private boolean isTeamOwnerOrAdmin(Team team, UUID userId) {
		return team.getOwner().getId().equals(userId) || team.getEditorIds().contains(userId);
	}

	private boolean canViewProject(Project project, UUID userId) {
		return project.getEditorIds().contains(userId) || project.getMemberIds().contains(userId);
	}

	private void validateProjectAdmin(Project project, UUID userId) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new CustomException("User not found"));
		if (user.getRole() == User.Role.ADMIN) {
			return;
		}
		if (project.getEditorIds().contains(userId)) {
			return;
		}
		throw new CustomException("No permission to edit project");
	}

	private void validateProjectOrTeamAdmin(Project project, UUID userId) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new CustomException("User not found"));
		if (user.getRole() == User.Role.ADMIN) {
			return;
		}
		if (project.getEditorIds().contains(userId)) {
			return;
		}
		if (isTeamOwnerOrAdmin(project.getTeam(), userId)) {
			return;
		}
		throw new CustomException("No permission to edit project");
	}
}

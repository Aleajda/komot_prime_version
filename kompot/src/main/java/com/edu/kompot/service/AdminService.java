package com.edu.kompot.service;

import com.edu.kompot.dto.response.AdminStatsResponse;
import com.edu.kompot.dto.response.AdminTeamSummary;
import com.edu.kompot.dto.response.UserResponse;
import com.edu.kompot.entity.Project;
import com.edu.kompot.entity.User;
import com.edu.kompot.repository.ProjectRepository;
import com.edu.kompot.repository.TaskRepository;
import com.edu.kompot.repository.TeamMemberRepository;
import com.edu.kompot.repository.TeamRepository;
import com.edu.kompot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminService {

	private final UserRepository userRepository;
	private final TeamRepository teamRepository;
	private final TeamMemberRepository teamMemberRepository;
	private final ProjectRepository projectRepository;
	private final TaskRepository taskRepository;

	private final LocalDateTime startupTime = LocalDateTime.now();

	public Page<UserResponse> getAllUsers(Pageable pageable) {
		return userRepository.findAll(pageable)
				.map(this::mapToUserResponse);
	}

	@Transactional
	public UserResponse updateUserRole(UUID userId, User.Role role) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new RuntimeException("User not found"));
		user.setRole(role);
		user = userRepository.save(user);
		return mapToUserResponse(user);
	}

	@Transactional
	public UserResponse toggleUserStatus(UUID userId) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new RuntimeException("User not found"));
		user.setIsActive(!user.getIsActive());
		user = userRepository.save(user);
		return mapToUserResponse(user);
	}

	public AdminStatsResponse getStatistics() {
		long totalUsers = userRepository.count();
		long activeUsers = userRepository.countByIsActiveTrue();
		long adminsCount = userRepository.countByRole(User.Role.ADMIN);
		long activeProjects = projectRepository.countByStatus(Project.ProjectStatus.ACTIVE);
		long tasksToday = taskRepository.countByCreatedAtAfter(LocalDateTime.now().minusDays(1));
		long uptimeHours = Math.max(1, ChronoUnit.HOURS.between(startupTime, LocalDateTime.now()));
		long activityPercent = totalUsers == 0 ? 0 : Math.round((double) activeUsers * 100 / totalUsers);

		return AdminStatsResponse.builder()
				.totalUsers(totalUsers)
				.activeProjects(activeProjects)
				.adminsCount(adminsCount)
				.activeUsers(activeUsers)
				.tasksToday(tasksToday)
				.uptimeHours(uptimeHours)
				.errors24h(0)
				.activityPercent(activityPercent)
				.build();
	}

	public List<AdminTeamSummary> getTeamSummaries() {
		return teamRepository.findAll().stream()
				.map(team -> AdminTeamSummary.builder()
						.id(team.getId())
						.name(team.getName())
						.members(teamMemberRepository.countByTeamId(team.getId()))
						.projects(projectRepository.countByTeamId(team.getId()))
						.createdAt(team.getCreatedAt())
						.build())
				.toList();
	}

	private UserResponse mapToUserResponse(User user) {
		return UserResponse.builder()
				.id(user.getId())
				.email(user.getEmail())
				.username(user.getUsername())
				.firstName(user.getFirstName())
				.lastName(user.getLastName())
				.avatar(user.getAvatar())
				.role(user.getRole())
				.isActive(user.getIsActive())
				.createdAt(user.getCreatedAt())
				.updatedAt(user.getUpdatedAt())
				.build();
	}
}


package com.edu.kompot.service;

import com.edu.kompot.dto.response.TeamResponse;
import com.edu.kompot.exception.CustomException;
import com.edu.kompot.entity.Team;
import com.edu.kompot.entity.TeamMember;
import com.edu.kompot.entity.User;
import com.edu.kompot.repository.TeamRepository;
import com.edu.kompot.repository.TeamMemberRepository;
import com.edu.kompot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeamService {

	private final TeamRepository teamRepository;
	private final TeamMemberRepository teamMemberRepository;
	private final UserRepository userRepository;

	public List<TeamResponse> getUserTeams(UUID userId) {
		Set<Team> teams = new HashSet<>();

		teams.addAll(teamMemberRepository.findByUserId(userId).stream()
				.map(TeamMember::getTeam)
				.collect(Collectors.toSet()));
		teams.addAll(teamRepository.findByEditorIdsContaining(userId));
		teams.addAll(teamRepository.findByMemberIdsContaining(userId));
		teams.addAll(teamRepository.findByOwnerId(userId));

		return teams.stream()
				.map(this::mapToTeamResponse)
				.collect(Collectors.toList());
	}

	@Transactional
	public TeamResponse createTeam(TeamResponse teamResponse, UUID ownerId) {
		var owner = userRepository.findById(ownerId)
				.orElseThrow(() -> new CustomException("Owner not found"));

		Set<UUID> editorIds = normalizeEditorIds(teamResponse.getEditorIds(), ownerId);
		Set<UUID> memberIds = sanitizeTeamMemberIds(editorIds, teamResponse.getMemberIds());

		Team team = Team.builder()
				.name(teamResponse.getName())
				.description(teamResponse.getDescription())
				.avatar(teamResponse.getAvatar())
				.owner(owner)
				.editorIds(editorIds)
				.memberIds(memberIds)
				.build();

		team = teamRepository.save(team);

		syncTeamMembers(team);

		return mapToTeamResponse(team);
	}

	public TeamResponse getTeamById(UUID id) {
		Team team = teamRepository.findById(id)
				.orElseThrow(() -> new CustomException("Team not found"));
		return mapToTeamResponse(team);
	}

	@Transactional
	public TeamResponse updateTeam(UUID id, TeamResponse teamResponse, UUID currentUserId) {
		Team team = teamRepository.findById(id)
				.orElseThrow(() -> new CustomException("Team not found"));
		validateTeamEditor(team, currentUserId);

		if (teamResponse.getName() != null) {
			team.setName(teamResponse.getName());
		}
		if (teamResponse.getDescription() != null) {
			team.setDescription(teamResponse.getDescription());
		}
		if (teamResponse.getAvatar() != null) {
			team.setAvatar(teamResponse.getAvatar());
		}
		if (teamResponse.getEditorIds() != null) {
			team.setEditorIds(normalizeEditorIds(teamResponse.getEditorIds(), team.getOwner().getId()));
		}
		if (teamResponse.getMemberIds() != null) {
			team.setMemberIds(sanitizeTeamMemberIds(team.getEditorIds(), teamResponse.getMemberIds()));
		}

		team = teamRepository.save(team);
		syncTeamMembers(team);
		return mapToTeamResponse(team);
	}

	@Transactional
	public void deleteTeam(UUID id, UUID currentUserId) {
		Team team = teamRepository.findById(id)
				.orElseThrow(() -> new CustomException("Team not found"));
		validateTeamEditor(team, currentUserId);
		teamRepository.delete(team);
	}

	private TeamResponse mapToTeamResponse(Team team) {
		return TeamResponse.builder()
				.id(team.getId())
				.name(team.getName())
				.description(team.getDescription())
				.avatar(team.getAvatar())
				.ownerId(team.getOwner().getId())
				.editorIds(team.getEditorIds())
				.memberIds(team.getMemberIds())
				.createdAt(team.getCreatedAt())
				.updatedAt(team.getUpdatedAt())
				.build();
	}

	private Set<UUID> sanitizeTeamMemberIds(Set<UUID> adminIds, Set<UUID> requestedMembers) {
		Set<UUID> members = requestedMembers == null ? new HashSet<>() : new HashSet<>(requestedMembers);
		members.removeAll(adminIds);
		return members;
	}

	private Set<UUID> normalizeEditorIds(Set<UUID> requestedEditorIds, UUID requiredEditorId) {
		Set<UUID> editorIds = requestedEditorIds == null ? new HashSet<>() : new HashSet<>(requestedEditorIds);
		editorIds.add(requiredEditorId);
		return editorIds;
	}

	private void validateTeamEditor(Team team, UUID userId) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new CustomException("User not found"));
		if (user.getRole() == User.Role.ADMIN) {
			return;
		}
		if (!team.getEditorIds().contains(userId)) {
			throw new CustomException("No permission to edit team");
		}
	}

	private void syncTeamMembers(Team team) {
		Set<UUID> adminIds = normalizeEditorIds(team.getEditorIds(), team.getOwner().getId());
		team.setEditorIds(adminIds);
		Set<UUID> memberOnlyIds = sanitizeTeamMemberIds(adminIds, team.getMemberIds());
		team.setMemberIds(memberOnlyIds);

		Set<UUID> allUserIds = new HashSet<>(adminIds);
		allUserIds.addAll(memberOnlyIds);
		allUserIds.add(team.getOwner().getId());

		List<TeamMember> existingMembers = teamMemberRepository.findByTeamId(team.getId());
		Map<UUID, TeamMember> existingMembersByUserId = existingMembers.stream()
				.collect(Collectors.toMap((member) -> member.getUser().getId(), (member) -> member));

		for (UUID userId : allUserIds) {
			TeamMember.MemberRole role = adminIds.contains(userId) || team.getOwner().getId().equals(userId)
					? TeamMember.MemberRole.ADMIN
					: TeamMember.MemberRole.MEMBER;

			TeamMember existing = existingMembersByUserId.get(userId);
			if (existing == null) {
				User memberUser = userRepository.findById(userId)
						.orElseThrow(() -> new CustomException("User not found"));
				teamMemberRepository.save(TeamMember.builder()
						.team(team)
						.user(memberUser)
						.role(role)
						.build());
				continue;
			}
			if (existing.getRole() != role) {
				existing.setRole(role);
				teamMemberRepository.save(existing);
			}
		}

		for (TeamMember existingMember : existingMembers) {
			UUID memberId = existingMember.getUser().getId();
			if (!allUserIds.contains(memberId)) {
				teamMemberRepository.deleteByTeamIdAndUserId(team.getId(), memberId);
			}
		}
	}
}


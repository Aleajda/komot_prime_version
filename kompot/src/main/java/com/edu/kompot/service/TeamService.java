package com.edu.kompot.service;

import com.edu.kompot.dto.response.TeamResponse;
import com.edu.kompot.exception.CustomException;
import com.edu.kompot.entity.Team;
import com.edu.kompot.entity.TeamMember;
import com.edu.kompot.repository.TeamRepository;
import com.edu.kompot.repository.TeamMemberRepository;
import com.edu.kompot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeamService {

	private final TeamRepository teamRepository;
	private final TeamMemberRepository teamMemberRepository;
	private final UserRepository userRepository;

	public List<TeamResponse> getUserTeams(UUID userId) {
		return teamMemberRepository.findByUserId(userId).stream()
				.map(TeamMember::getTeam)
				.map(this::mapToTeamResponse)
				.collect(Collectors.toList());
	}

	@Transactional
	public TeamResponse createTeam(TeamResponse teamResponse, UUID ownerId) {
		var owner = userRepository.findById(ownerId)
				.orElseThrow(() -> new CustomException("Owner not found"));

		Team team = Team.builder()
				.name(teamResponse.getName())
				.description(teamResponse.getDescription())
				.avatar(teamResponse.getAvatar())
				.owner(owner)
				.build();

		team = teamRepository.save(team);

		TeamMember member = TeamMember.builder()
				.team(team)
				.user(owner)
				.role(TeamMember.MemberRole.ADMIN)
				.build();
		teamMemberRepository.save(member);

		return mapToTeamResponse(team);
	}

	public TeamResponse getTeamById(UUID id) {
		Team team = teamRepository.findById(id)
				.orElseThrow(() -> new CustomException("Team not found"));
		return mapToTeamResponse(team);
	}

	@Transactional
	public TeamResponse updateTeam(UUID id, TeamResponse teamResponse) {
		Team team = teamRepository.findById(id)
				.orElseThrow(() -> new CustomException("Team not found"));

		if (teamResponse.getName() != null) {
			team.setName(teamResponse.getName());
		}
		if (teamResponse.getDescription() != null) {
			team.setDescription(teamResponse.getDescription());
		}
		if (teamResponse.getAvatar() != null) {
			team.setAvatar(teamResponse.getAvatar());
		}

		team = teamRepository.save(team);
		return mapToTeamResponse(team);
	}

	@Transactional
	public void deleteTeam(UUID id) {
		if (!teamRepository.existsById(id)) {
			throw new CustomException("Team not found");
		}
		teamRepository.deleteById(id);
	}

	private TeamResponse mapToTeamResponse(Team team) {
		return TeamResponse.builder()
				.id(team.getId())
				.name(team.getName())
				.description(team.getDescription())
				.avatar(team.getAvatar())
				.ownerId(team.getOwner().getId())
				.createdAt(team.getCreatedAt())
				.updatedAt(team.getUpdatedAt())
				.build();
	}
}


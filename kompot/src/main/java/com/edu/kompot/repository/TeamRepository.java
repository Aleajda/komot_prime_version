package com.edu.kompot.repository;

import com.edu.kompot.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TeamRepository extends JpaRepository<Team, UUID> {
	List<Team> findByOwnerId(UUID ownerId);
	List<Team> findByEditorIdsContaining(UUID userId);
	List<Team> findByMemberIdsContaining(UUID userId);
}


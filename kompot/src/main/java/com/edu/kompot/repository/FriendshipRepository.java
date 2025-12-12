package com.edu.kompot.repository;

import com.edu.kompot.entity.Friendship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, UUID> {
	Optional<Friendship> findByRequesterIdAndAddresseeId(UUID requesterId, UUID addresseeId);
	Optional<Friendship> findByRequesterIdAndAddresseeIdOrRequesterIdAndAddresseeId(UUID requesterId1, UUID addresseeId1, UUID requesterId2, UUID addresseeId2);
	List<Friendship> findByRequesterIdAndStatus(UUID requesterId, Friendship.Status status);
	List<Friendship> findByAddresseeIdAndStatus(UUID addresseeId, Friendship.Status status);
	List<Friendship> findByRequesterIdAndStatusOrAddresseeIdAndStatus(UUID requesterId, Friendship.Status status1, UUID addresseeId, Friendship.Status status2);
	boolean existsByRequesterIdAndAddresseeIdAndStatus(UUID requesterId, UUID addresseeId, Friendship.Status status);
}


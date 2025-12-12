package com.edu.kompot.repository;

import com.edu.kompot.entity.ChatMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChatMemberRepository extends JpaRepository<ChatMember, UUID> {
	List<ChatMember> findByChatId(UUID chatId);
	List<ChatMember> findByUserId(UUID userId);
	Optional<ChatMember> findByChatIdAndUserId(UUID chatId, UUID userId);
	boolean existsByChatIdAndUserId(UUID chatId, UUID userId);
}


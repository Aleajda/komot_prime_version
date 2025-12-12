package com.edu.kompot.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "chat_members")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMember {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "chat_id", nullable = false)
	private Chat chat;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	@Builder.Default
	private Role role = Role.MEMBER;

	@CreationTimestamp
	@Column(nullable = false, updatable = false)
	private LocalDateTime joinedAt;

	private LocalDateTime lastReadAt;

	public enum Role {
		OWNER, ADMIN, MEMBER
	}
}






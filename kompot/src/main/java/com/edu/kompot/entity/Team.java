package com.edu.kompot.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "teams")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Team {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false)
	private String name;

	@Column(columnDefinition = "TEXT")
	private String description;

	private String avatar;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "owner_id", nullable = false)
	private User owner;

	@ElementCollection(fetch = FetchType.EAGER)
	@CollectionTable(name = "team_editors", joinColumns = @JoinColumn(name = "team_id"))
	@Column(name = "user_id", nullable = false)
	@Builder.Default
	private Set<UUID> editorIds = new HashSet<>();

	/** Участники команды без прав администратора (как «Developer» в YouTrack). */
	@ElementCollection(fetch = FetchType.EAGER)
	@CollectionTable(name = "team_member_ids", joinColumns = @JoinColumn(name = "team_id"))
	@Column(name = "user_id", nullable = false)
	@Builder.Default
	private Set<UUID> memberIds = new HashSet<>();

	@CreationTimestamp
	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@UpdateTimestamp
	@Column(nullable = false)
	private LocalDateTime updatedAt;
}











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
@Table(name = "projects")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false)
	private String name;

	@Column(columnDefinition = "TEXT")
	private String description;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "team_id", nullable = false)
	private Team team;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	@Builder.Default
	private ProjectStatus status = ProjectStatus.ACTIVE;

	@ElementCollection(fetch = FetchType.EAGER)
	@CollectionTable(name = "project_editors", joinColumns = @JoinColumn(name = "project_id"))
	@Column(name = "user_id", nullable = false)
	@Builder.Default
	private Set<UUID> editorIds = new HashSet<>();

	/** Участники проекта: доступ к задачам без прав администратора проекта. */
	@ElementCollection(fetch = FetchType.EAGER)
	@CollectionTable(name = "project_member_ids", joinColumns = @JoinColumn(name = "project_id"))
	@Column(name = "user_id", nullable = false)
	@Builder.Default
	private Set<UUID> memberIds = new HashSet<>();

	@CreationTimestamp
	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@UpdateTimestamp
	@Column(nullable = false)
	private LocalDateTime updatedAt;

	public enum ProjectStatus {
		ACTIVE, ARCHIVED, COMPLETED
	}
}











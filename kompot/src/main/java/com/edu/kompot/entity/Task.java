package com.edu.kompot.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tasks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false)
	private String title;

	@Column(columnDefinition = "TEXT")
	private String description;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "project_id", nullable = false)
	private Project project;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "assignee_id")
	private User assignee;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "creator_id", nullable = false)
	private User creator;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	@Builder.Default
	private TaskStatus status = TaskStatus.TODO;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	@Builder.Default
	private TaskPriority priority = TaskPriority.MEDIUM;

	private LocalDateTime dueDate;

	@CreationTimestamp
	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@UpdateTimestamp
	@Column(nullable = false)
	private LocalDateTime updatedAt;

	public enum TaskStatus {
		TODO, IN_PROGRESS, IN_REVIEW, DONE, BLOCKED
	}

	public enum TaskPriority {
		LOW, MEDIUM, HIGH, URGENT
	}
}










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
@Table(name = "friendships", uniqueConstraints = {
		@UniqueConstraint(columnNames = {"requester_id", "addressee_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Friendship {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "requester_id", nullable = false)
	private User requester;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "addressee_id", nullable = false)
	private User addressee;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	@Builder.Default
	private Status status = Status.PENDING;

	@CreationTimestamp
	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@UpdateTimestamp
	@Column(nullable = false)
	private LocalDateTime updatedAt;

	public enum Status {
		PENDING, ACCEPTED, BLOCKED
	}
}



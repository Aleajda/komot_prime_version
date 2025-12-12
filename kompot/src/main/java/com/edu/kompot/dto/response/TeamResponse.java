package com.edu.kompot.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamResponse {
	private UUID id;
	private String name;
	private String description;
	private String avatar;
	private UUID ownerId;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;
}










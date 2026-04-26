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
public class AdminTeamSummary {
	private UUID id;
	private String name;
	private long members;
	private long projects;
	private LocalDateTime createdAt;
}

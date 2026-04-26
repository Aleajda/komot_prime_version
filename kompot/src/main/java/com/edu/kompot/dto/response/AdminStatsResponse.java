package com.edu.kompot.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminStatsResponse {
	private long totalUsers;
	private long activeProjects;
	private long adminsCount;
	private long activeUsers;
	private long tasksToday;
	private long uptimeHours;
	private long errors24h;
	private long activityPercent;
}

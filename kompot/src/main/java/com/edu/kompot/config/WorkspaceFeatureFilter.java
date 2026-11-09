package com.edu.kompot.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class WorkspaceFeatureFilter extends OncePerRequestFilter {

	private final AppFeatures appFeatures;

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {
		if (!appFeatures.isWorkspaceEnabled() && isWorkspacePath(request.getRequestURI())) {
			response.setStatus(HttpServletResponse.SC_NOT_FOUND);
			response.setContentType(MediaType.APPLICATION_JSON_VALUE);
			response.getWriter().write("{\"message\":\"Раздел отключён\"}");
			return;
		}
		filterChain.doFilter(request, response);
	}

	private boolean isWorkspacePath(String path) {
		return path.startsWith("/api/teams")
				|| path.startsWith("/api/projects")
				|| path.startsWith("/api/tasks")
				|| "/api/search".equals(path)
				|| path.startsWith("/api/admin/teams");
	}
}

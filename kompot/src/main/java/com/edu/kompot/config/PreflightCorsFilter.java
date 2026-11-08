package com.edu.kompot.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class PreflightCorsFilter extends OncePerRequestFilter {

	@Value("${app.cors.allowed-origins:http://localhost:3000}")
	private String allowedOrigins;

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {
		if (!"OPTIONS".equalsIgnoreCase(request.getMethod())) {
			filterChain.doFilter(request, response);
			return;
		}

		String origin = request.getHeader("Origin");
		if (origin != null && isAllowed(origin)) {
			response.setHeader("Access-Control-Allow-Origin", origin);
			response.setHeader("Access-Control-Allow-Credentials", "true");
			response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
			String headers = request.getHeader("Access-Control-Request-Headers");
			response.setHeader("Access-Control-Allow-Headers", headers == null || headers.isBlank() ? "*" : headers);
			response.setHeader("Access-Control-Max-Age", "3600");
			response.setHeader("Vary", "Origin");
			response.setStatus(HttpServletResponse.SC_OK);
			return;
		}

		filterChain.doFilter(request, response);
	}

	private boolean isAllowed(String origin) {
		if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
			return true;
		}
		if (origin.matches("https://[A-Za-z0-9-]+\\.onrender\\.com")) {
			return true;
		}
		return Arrays.stream(allowedOrigins.split(","))
				.map(String::trim)
				.anyMatch(origin::equalsIgnoreCase);
	}
}

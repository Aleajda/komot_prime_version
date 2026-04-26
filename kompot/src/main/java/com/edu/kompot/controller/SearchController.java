package com.edu.kompot.controller;

import com.edu.kompot.dto.response.SearchResponse;
import com.edu.kompot.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SearchController {

	private final SearchService searchService;

	@GetMapping("/search")
	public ResponseEntity<SearchResponse> search(@RequestParam String query, Authentication authentication) {
		UUID userId = UUID.fromString(authentication.getName());
		return ResponseEntity.ok(searchService.search(userId, query));
	}
}


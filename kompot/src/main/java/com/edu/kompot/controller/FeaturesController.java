package com.edu.kompot.controller;

import com.edu.kompot.config.AppFeatures;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/features")
@RequiredArgsConstructor
public class FeaturesController {

	private final AppFeatures appFeatures;

	@GetMapping
	public Map<String, Boolean> features() {
		return Map.of("workspaceEnabled", appFeatures.isWorkspaceEnabled());
	}
}

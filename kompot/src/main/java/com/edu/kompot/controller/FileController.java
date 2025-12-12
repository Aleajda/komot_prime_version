package com.edu.kompot.controller;

import com.edu.kompot.entity.File;
import com.edu.kompot.service.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

	private final FileService fileService;

	@PostMapping("/upload")
	public ResponseEntity<File> uploadFile(@RequestParam("file") MultipartFile file, Authentication authentication) {
		UUID uploadedById = UUID.fromString(authentication.getName());
		return ResponseEntity.ok(fileService.uploadFile(file, uploadedById));
	}

	@GetMapping("/{id}")
	public ResponseEntity<File> getFileById(@PathVariable UUID id) {
		return ResponseEntity.ok(fileService.getFileById(id));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> deleteFile(@PathVariable UUID id) {
		fileService.deleteFile(id);
		return ResponseEntity.noContent().build();
	}
}


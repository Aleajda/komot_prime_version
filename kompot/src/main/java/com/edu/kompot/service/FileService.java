package com.edu.kompot.service;

import com.edu.kompot.exception.CustomException;
import com.edu.kompot.entity.File;
import com.edu.kompot.entity.User;
import com.edu.kompot.repository.FileRepository;
import com.edu.kompot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileService {

	private final FileRepository fileRepository;
	private final UserRepository userRepository;

	@Transactional
	public File uploadFile(MultipartFile multipartFile, UUID uploadedById) {
		User uploadedBy = userRepository.findById(uploadedById)
				.orElseThrow(() -> new CustomException("User not found"));

		try {
			String filename = UUID.randomUUID().toString() + "_" + multipartFile.getOriginalFilename();
			String url = "/files/" + filename;

			File file = File.builder()
					.filename(filename)
					.originalName(multipartFile.getOriginalFilename())
					.mimeType(multipartFile.getContentType())
					.size(multipartFile.getSize())
					.url(url)
					.uploadedBy(uploadedBy)
					.build();

			return fileRepository.save(file);
		} catch (Exception e) {
			throw new CustomException("Failed to upload file: " + e.getMessage());
		}
	}

	public File getFileById(UUID id) {
		return fileRepository.findById(id)
				.orElseThrow(() -> new CustomException("File not found"));
	}

	@Transactional
	public void deleteFile(UUID id) {
		if (!fileRepository.existsById(id)) {
			throw new CustomException("File not found");
		}
		fileRepository.deleteById(id);
	}
}


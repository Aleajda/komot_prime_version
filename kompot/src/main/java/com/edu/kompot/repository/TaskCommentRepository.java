package com.edu.kompot.repository;

import com.edu.kompot.entity.TaskComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskCommentRepository extends JpaRepository<TaskComment, UUID> {
	List<TaskComment> findByTaskIdOrderByCreatedAtAsc(UUID taskId);
}


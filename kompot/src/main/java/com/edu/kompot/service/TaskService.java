package com.edu.kompot.service;

import com.edu.kompot.dto.response.TaskResponse;
import com.edu.kompot.exception.CustomException;
import com.edu.kompot.entity.Project;
import com.edu.kompot.entity.Task;
import com.edu.kompot.entity.User;
import com.edu.kompot.repository.ProjectRepository;
import com.edu.kompot.repository.TaskRepository;
import com.edu.kompot.repository.TeamMemberRepository;
import com.edu.kompot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TaskService {

	private final TaskRepository taskRepository;
	private final ProjectRepository projectRepository;
	private final TeamMemberRepository teamMemberRepository;
	private final UserRepository userRepository;

	public List<TaskResponse> getProjectTasks(UUID projectId) {
		return taskRepository.findByProjectId(projectId).stream()
				.map(this::mapToTaskResponse)
				.collect(Collectors.toList());
	}

	@Transactional
	public TaskResponse createTask(TaskResponse taskResponse, UUID projectId, UUID creatorId) {
		Project project = projectRepository.findById(projectId)
				.orElseThrow(() -> new CustomException("Project not found"));

		User creator = userRepository.findById(creatorId)
				.orElseThrow(() -> new CustomException("Creator not found"));
		validateProjectMember(project, creatorId);

		Set<UUID> editorIds = normalizeEditorIds(taskResponse.getEditorIds(), creatorId);

		Task task = Task.builder()
				.title(taskResponse.getTitle())
				.description(taskResponse.getDescription())
				.project(project)
				.creator(creator)
				.assignee(taskResponse.getAssigneeId() != null ?
						userRepository.findById(taskResponse.getAssigneeId()).orElse(null) : null)
				.status(taskResponse.getStatus() != null ? taskResponse.getStatus() : Task.TaskStatus.TODO)
				.priority(taskResponse.getPriority() != null ? taskResponse.getPriority() : Task.TaskPriority.MEDIUM)
				.editorIds(editorIds)
				.dueDate(taskResponse.getDueDate())
				.build();

		task = taskRepository.save(task);
		return mapToTaskResponse(task);
	}

	public TaskResponse getTaskById(UUID id) {
		Task task = taskRepository.findById(id)
				.orElseThrow(() -> new CustomException("Task not found"));
		return mapToTaskResponse(task);
	}

	@Transactional
	public TaskResponse updateTask(UUID id, TaskResponse taskResponse, UUID currentUserId) {
		Task task = taskRepository.findById(id)
				.orElseThrow(() -> new CustomException("Task not found"));
		validateTaskEditor(task, currentUserId);

		if (taskResponse.getTitle() != null) {
			task.setTitle(taskResponse.getTitle());
		}
		if (taskResponse.getDescription() != null) {
			task.setDescription(taskResponse.getDescription());
		}
		if (taskResponse.getStatus() != null) {
			task.setStatus(taskResponse.getStatus());
		}
		if (taskResponse.getPriority() != null) {
			task.setPriority(taskResponse.getPriority());
		}
		if (taskResponse.getDueDate() != null) {
			task.setDueDate(taskResponse.getDueDate());
		}
		if (taskResponse.getAssigneeId() != null) {
			User assignee = userRepository.findById(taskResponse.getAssigneeId())
					.orElseThrow(() -> new CustomException("Assignee not found"));
			task.setAssignee(assignee);
		}
		if (taskResponse.getEditorIds() != null) {
			task.setEditorIds(normalizeEditorIds(taskResponse.getEditorIds(), task.getCreator().getId()));
		}

		task = taskRepository.save(task);
		return mapToTaskResponse(task);
	}

	@Transactional
	public void deleteTask(UUID id, UUID currentUserId) {
		Task task = taskRepository.findById(id)
				.orElseThrow(() -> new CustomException("Task not found"));
		validateTaskEditor(task, currentUserId);
		taskRepository.delete(task);
	}

	private TaskResponse mapToTaskResponse(Task task) {
		return TaskResponse.builder()
				.id(task.getId())
				.title(task.getTitle())
				.description(task.getDescription())
				.projectId(task.getProject().getId())
				.assigneeId(task.getAssignee() != null ? task.getAssignee().getId() : null)
				.creatorId(task.getCreator().getId())
				.status(task.getStatus())
				.priority(task.getPriority())
				.editorIds(task.getEditorIds())
				.dueDate(task.getDueDate())
				.createdAt(task.getCreatedAt())
				.updatedAt(task.getUpdatedAt())
				.build();
	}

	private Set<UUID> normalizeEditorIds(Set<UUID> requestedEditorIds, UUID requiredEditorId) {
		Set<UUID> editorIds = requestedEditorIds == null ? new HashSet<>() : new HashSet<>(requestedEditorIds);
		editorIds.add(requiredEditorId);
		return editorIds;
	}

	private void validateTaskEditor(Task task, UUID userId) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new CustomException("User not found"));
		if (user.getRole() == User.Role.ADMIN) {
			return;
		}
		if (!task.getEditorIds().contains(userId)) {
			throw new CustomException("No permission to edit task");
		}
	}

	private void validateProjectMember(Project project, UUID userId) {
		if (project.getTeam().getOwner().getId().equals(userId)
				|| teamMemberRepository.existsByTeamIdAndUserId(project.getTeam().getId(), userId)) {
			return;
		}
		throw new CustomException("No permission to create task");
	}
}


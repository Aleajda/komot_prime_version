package com.edu.kompot.service;

import com.edu.kompot.dto.request.ChatCreateRequest;
import com.edu.kompot.dto.response.ChatMemberResponse;
import com.edu.kompot.dto.response.ChatResponse;
import com.edu.kompot.dto.response.MessageResponse;
import com.edu.kompot.dto.response.UserResponse;
import com.edu.kompot.entity.Chat;
import com.edu.kompot.entity.ChatMember;
import com.edu.kompot.entity.Message;
import com.edu.kompot.entity.Project;
import com.edu.kompot.entity.Team;
import com.edu.kompot.entity.User;
import com.edu.kompot.exception.CustomException;
import com.edu.kompot.repository.ChatMemberRepository;
import com.edu.kompot.repository.ChatRepository;
import com.edu.kompot.repository.MessageRepository;
import com.edu.kompot.repository.ProjectRepository;
import com.edu.kompot.repository.TeamRepository;
import com.edu.kompot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

	private final ChatRepository chatRepository;
	private final MessageRepository messageRepository;
	private final ChatMemberRepository chatMemberRepository;
	private final UserRepository userRepository;
	private final TeamRepository teamRepository;
	private final ProjectRepository projectRepository;

	public List<ChatMemberResponse> getChatMembers(UUID chatId) {
		if (!chatRepository.existsById(chatId)) {
			throw new CustomException("Chat not found");
		}
		return chatMemberRepository.findByChatId(chatId).stream()
				.map(this::mapToChatMemberResponse)
				.collect(Collectors.toList());
	}

	public List<ChatResponse> getUserChats(UUID userId) {
		return chatMemberRepository.findByUserId(userId).stream()
				.map(ChatMember::getChat)
				.distinct()
				.map(this::mapToChatResponse)
				.collect(Collectors.toList());
	}

	@Transactional
	public ChatResponse getOrCreateDirectChat(UUID userId1, UUID userId2) {
		if (userId1.equals(userId2)) {
			throw new CustomException("Нельзя создать чат с самим собой");
		}

		User user1 = userRepository.findById(userId1)
				.orElseThrow(() -> new CustomException("User not found"));
		User user2 = userRepository.findById(userId2)
				.orElseThrow(() -> new CustomException("User not found"));

		List<ChatMember> user1Chats = chatMemberRepository.findByUserId(userId1);
		for (ChatMember member1 : user1Chats) {
			Chat chat = member1.getChat();
			if (chat.getType() == Chat.ChatType.DIRECT) {
				Optional<ChatMember> member2 = chatMemberRepository.findByChatIdAndUserId(chat.getId(), userId2);
				if (member2.isPresent()) {
					return mapToChatResponse(chat);
				}
			}
		}

		Chat chat = Chat.builder()
				.type(Chat.ChatType.DIRECT)
				.build();
		chat = chatRepository.save(chat);

		ChatMember member1 = ChatMember.builder()
				.chat(chat)
				.user(user1)
				.role(ChatMember.Role.MEMBER)
				.build();
		chatMemberRepository.save(member1);

		ChatMember member2 = ChatMember.builder()
				.chat(chat)
				.user(user2)
				.role(ChatMember.Role.MEMBER)
				.build();
		chatMemberRepository.save(member2);

		return mapToChatResponse(chat);
	}

	@Transactional
	public ChatResponse createChat(ChatCreateRequest request, UUID creatorId) {
		User creator = userRepository.findById(creatorId)
				.orElseThrow(() -> new CustomException("Creator not found"));

		Team team = null;
		Project project = null;

		if (request.getTeamId() != null) {
			team = teamRepository.findById(request.getTeamId())
					.orElseThrow(() -> new CustomException("Team not found"));
		}

		if (request.getProjectId() != null) {
			project = projectRepository.findById(request.getProjectId())
					.orElseThrow(() -> new CustomException("Project not found"));
		}

		Chat chat = Chat.builder()
				.type(request.getType())
				.name(request.getName())
				.team(team)
				.project(project)
				.build();

		chat = chatRepository.save(chat);

		ChatMember member = ChatMember.builder()
				.chat(chat)
				.user(creator)
				.role(ChatMember.Role.OWNER)
				.build();
		chatMemberRepository.save(member);

		return mapToChatResponse(chat);
	}

	public List<MessageResponse> getChatMessages(UUID chatId) {
		return messageRepository.findByChatIdOrderByCreatedAtAsc(chatId).stream()
				.map(this::mapToMessageResponse)
				.collect(Collectors.toList());
	}

	@Transactional
	public MessageResponse sendMessage(MessageResponse messageResponse, UUID chatId, UUID senderId) {
		Chat chat = chatRepository.findById(chatId)
				.orElseThrow(() -> new CustomException("Chat not found"));

		User sender = userRepository.findById(senderId)
				.orElseThrow(() -> new CustomException("Sender not found"));

		Message message = Message.builder()
				.chat(chat)
				.sender(sender)
				.content(messageResponse.getContent())
				.type(messageResponse.getType() != null ? messageResponse.getType() : Message.MessageType.TEXT)
				.fileUrl(messageResponse.getFileUrl())
				.build();

		message = messageRepository.save(message);
		return mapToMessageResponse(message);
	}

	@Transactional
	public void addMemberToChat(UUID chatId, UUID userId, UUID requesterId) {
		Chat chat = chatRepository.findById(chatId)
				.orElseThrow(() -> new CustomException("Chat not found"));

		User user = userRepository.findById(userId)
				.orElseThrow(() -> new CustomException("User not found"));

		if (requesterId != null && chatMemberRepository.findByChatIdAndUserId(chatId, requesterId).isEmpty()) {
			throw new CustomException("You are not a member of this chat");
		}

		if (chatMemberRepository.existsByChatIdAndUserId(chatId, userId)) {
			throw new CustomException("User is already a member of this chat");
		}

		ChatMember member = ChatMember.builder()
				.chat(chat)
				.user(user)
				.role(ChatMember.Role.MEMBER)
				.build();
		chatMemberRepository.save(member);
	}

	@Transactional
	public void removeMemberFromChat(UUID chatId, UUID userId, UUID requesterId) {
		ChatMember targetMember = chatMemberRepository.findByChatIdAndUserId(chatId, userId)
				.orElseThrow(() -> new CustomException("User is not a member of this chat"));

		ChatMember requester = chatMemberRepository.findByChatIdAndUserId(chatId, requesterId)
				.orElseThrow(() -> new CustomException("You are not a member of this chat"));

		if (targetMember.getRole() == ChatMember.Role.OWNER) {
			throw new CustomException("Нельзя удалить создателя чата");
		}

		if (targetMember.getUser().getId().equals(requesterId)) {
			throw new CustomException("Нельзя удалить самого себя");
		}

		if (requester.getRole() != ChatMember.Role.OWNER) {
			throw new CustomException("Недостаточно прав для удаления участника");
		}

		chatMemberRepository.delete(targetMember);
	}

	private MessageResponse mapToMessageResponse(Message message) {
		return MessageResponse.builder()
				.id(message.getId())
				.chatId(message.getChat().getId())
				.senderId(message.getSender().getId())
				.content(message.getContent())
				.type(message.getType())
				.fileUrl(message.getFileUrl())
				.createdAt(message.getCreatedAt())
				.updatedAt(message.getUpdatedAt())
				.build();
	}

	private ChatResponse mapToChatResponse(Chat chat) {
		return ChatResponse.builder()
				.id(chat.getId())
				.type(chat.getType())
				.name(chat.getName())
				.teamId(chat.getTeam() != null ? chat.getTeam().getId() : null)
				.projectId(chat.getProject() != null ? chat.getProject().getId() : null)
				.createdAt(chat.getCreatedAt())
				.updatedAt(chat.getUpdatedAt())
				.build();
	}

	private ChatMemberResponse mapToChatMemberResponse(ChatMember member) {
		return ChatMemberResponse.builder()
				.id(member.getId())
				.chatId(member.getChat().getId())
				.user(mapToUserResponse(member.getUser()))
				.role(member.getRole())
				.owner(member.getRole() == ChatMember.Role.OWNER)
				.joinedAt(member.getJoinedAt())
				.build();
	}

	private UserResponse mapToUserResponse(User user) {
		return UserResponse.builder()
				.id(user.getId())
				.email(user.getEmail())
				.username(user.getUsername())
				.firstName(user.getFirstName())
				.lastName(user.getLastName())
				.avatar(user.getAvatar())
				.role(user.getRole())
				.isActive(user.getIsActive())
				.createdAt(user.getCreatedAt())
				.updatedAt(user.getUpdatedAt())
				.build();
	}
}


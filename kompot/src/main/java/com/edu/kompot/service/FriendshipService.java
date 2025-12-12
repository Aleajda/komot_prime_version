package com.edu.kompot.service;

import com.edu.kompot.dto.response.FriendshipResponse;
import com.edu.kompot.dto.response.UserResponse;
import com.edu.kompot.entity.Friendship;
import com.edu.kompot.entity.User;
import com.edu.kompot.exception.CustomException;
import com.edu.kompot.repository.FriendshipRepository;
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
public class FriendshipService {

	private final FriendshipRepository friendshipRepository;
	private final UserRepository userRepository;

	@Transactional
	public FriendshipResponse sendFriendRequest(UUID requesterId, UUID addresseeId) {
		if (requesterId.equals(addresseeId)) {
			throw new CustomException("Нельзя отправить заявку самому себе");
		}

		User requester = userRepository.findById(requesterId)
				.orElseThrow(() -> new CustomException("Requester not found"));
		User addressee = userRepository.findById(addresseeId)
				.orElseThrow(() -> new CustomException("Addressee not found"));

		Optional<Friendship> existing = friendshipRepository.findByRequesterIdAndAddresseeId(requesterId, addresseeId);
		if (existing.isPresent()) {
			Friendship friendship = existing.get();
			if (friendship.getStatus() == Friendship.Status.ACCEPTED) {
				throw new CustomException("Пользователь уже в друзьях");
			}
			if (friendship.getStatus() == Friendship.Status.PENDING) {
				throw new CustomException("Заявка уже отправлена");
			}
			if (friendship.getStatus() == Friendship.Status.BLOCKED) {
				throw new CustomException("Пользователь заблокирован");
			}
		}

		Optional<Friendship> reverse = friendshipRepository.findByRequesterIdAndAddresseeId(addresseeId, requesterId);
		if (reverse.isPresent() && reverse.get().getStatus() == Friendship.Status.BLOCKED) {
			throw new CustomException("Пользователь заблокирован");
		}

		Friendship friendship = Friendship.builder()
				.requester(requester)
				.addressee(addressee)
				.status(Friendship.Status.PENDING)
				.build();

		friendship = friendshipRepository.save(friendship);
		return mapToFriendshipResponse(friendship);
	}

	@Transactional
	public FriendshipResponse acceptFriendRequest(UUID userId, UUID friendshipId) {
		Friendship friendship = friendshipRepository.findById(friendshipId)
				.orElseThrow(() -> new CustomException("Friendship not found"));

		if (!friendship.getAddressee().getId().equals(userId)) {
			throw new CustomException("Вы не можете принять эту заявку");
		}

		if (friendship.getStatus() != Friendship.Status.PENDING) {
			throw new CustomException("Заявка уже обработана");
		}

		friendship.setStatus(Friendship.Status.ACCEPTED);
		friendship = friendshipRepository.save(friendship);
		return mapToFriendshipResponse(friendship);
	}

	@Transactional
	public void rejectFriendRequest(UUID userId, UUID friendshipId) {
		Friendship friendship = friendshipRepository.findById(friendshipId)
				.orElseThrow(() -> new CustomException("Friendship not found"));

		if (!friendship.getAddressee().getId().equals(userId)) {
			throw new CustomException("Вы не можете отклонить эту заявку");
		}

		if (friendship.getStatus() != Friendship.Status.PENDING) {
			throw new CustomException("Заявка уже обработана");
		}

		friendshipRepository.delete(friendship);
	}

	@Transactional
	public void removeFriend(UUID userId, UUID friendId) {
		Optional<Friendship> friendship = friendshipRepository.findByRequesterIdAndAddresseeIdOrRequesterIdAndAddresseeId(
				userId, friendId, friendId, userId);

		if (friendship.isEmpty() || friendship.get().getStatus() != Friendship.Status.ACCEPTED) {
			throw new CustomException("Пользователь не в друзьях");
		}

		friendshipRepository.delete(friendship.get());
	}

	public List<UserResponse> getFriends(UUID userId) {
		List<Friendship> friendships = friendshipRepository.findByRequesterIdAndStatusOrAddresseeIdAndStatus(
				userId, Friendship.Status.ACCEPTED, userId, Friendship.Status.ACCEPTED);

		return friendships.stream()
				.map(f -> {
					if (f.getRequester().getId().equals(userId)) {
						return f.getAddressee();
					} else {
						return f.getRequester();
					}
				})
				.map(this::mapToUserResponse)
				.collect(Collectors.toList());
	}

	public List<FriendshipResponse> getPendingRequests(UUID userId) {
		return friendshipRepository.findByAddresseeIdAndStatus(userId, Friendship.Status.PENDING)
				.stream()
				.map(this::mapToFriendshipResponse)
				.collect(Collectors.toList());
	}

	public List<UserResponse> getFollowers(UUID userId) {
		List<Friendship> friendships = friendshipRepository.findByAddresseeIdAndStatus(userId, Friendship.Status.ACCEPTED);
		return friendships.stream()
				.map(Friendship::getRequester)
				.map(this::mapToUserResponse)
				.collect(Collectors.toList());
	}

	public boolean areFriends(UUID userId1, UUID userId2) {
		return friendshipRepository.existsByRequesterIdAndAddresseeIdAndStatus(userId1, userId2, Friendship.Status.ACCEPTED)
				|| friendshipRepository.existsByRequesterIdAndAddresseeIdAndStatus(userId2, userId1, Friendship.Status.ACCEPTED);
	}

	private FriendshipResponse mapToFriendshipResponse(Friendship friendship) {
		return FriendshipResponse.builder()
				.id(friendship.getId())
				.requester(mapToUserResponse(friendship.getRequester()))
				.addressee(mapToUserResponse(friendship.getAddressee()))
				.status(friendship.getStatus())
				.createdAt(friendship.getCreatedAt())
				.updatedAt(friendship.getUpdatedAt())
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


package com.edu.kompot.repository;

import com.edu.kompot.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
	Optional<User> findByEmail(String email);
	boolean existsByEmail(String email);
	List<User> findTop20ByEmailContainingIgnoreCaseOrUsernameContainingIgnoreCase(String email, String username);
	long countByRole(User.Role role);
	long countByIsActiveTrue();
}


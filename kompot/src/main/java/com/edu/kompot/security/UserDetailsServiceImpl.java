package com.edu.kompot.security;

import com.edu.kompot.entity.User;
import com.edu.kompot.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Collections;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

	private final UserRepository userRepository;

	@Override
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
		User user;
		try {
			UUID userId = UUID.fromString(username);
			user = userRepository.findById(userId)
					.orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + username));
		} catch (IllegalArgumentException e) {
			user = userRepository.findByEmail(username)
					.orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + username));
		}

		return org.springframework.security.core.userdetails.User.builder()
				.username(user.getId().toString())
				.password(user.getPassword())
				.authorities(getAuthorities(user))
				.accountExpired(false)
				.accountLocked(!user.getIsActive())
				.credentialsExpired(false)
				.disabled(!user.getIsActive())
				.build();
	}

	private Collection<? extends GrantedAuthority> getAuthorities(User user) {
		return Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
	}
}


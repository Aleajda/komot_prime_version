package com.edu.kompot.config;

import com.edu.kompot.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

	private final JwtTokenProvider tokenProvider;
	private final UserDetailsService userDetailsService;

	@Override
	public Message<?> preSend(Message<?> message, MessageChannel channel) {
		StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
		
		if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
			List<String> authHeaders = accessor.getNativeHeader("Authorization");
			
			if (authHeaders != null && !authHeaders.isEmpty()) {
				String authHeader = authHeaders.get(0);
				if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
					String token = authHeader.substring(7);
					
					if (tokenProvider.validateToken(token)) {
						try {
							UUID userId = tokenProvider.getUserIdFromToken(token);
							UserDetails userDetails = userDetailsService.loadUserByUsername(userId.toString());
							UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
									userDetails, null, userDetails.getAuthorities());
							accessor.setUser(authentication);
						} catch (Exception e) {
							// Invalid token
						}
					}
				}
			}
		}
		
		return message;
	}
}




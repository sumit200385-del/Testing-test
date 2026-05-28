package com.abckedn.vtd.service;

import com.abckedn.vtd.dto.LoginRequest;
import com.abckedn.vtd.dto.LoginResponse;
import com.abckedn.vtd.dto.UserDto;
import com.abckedn.vtd.entity.User;
import com.abckedn.vtd.exception.BadRequestException;
import com.abckedn.vtd.repository.UserRepository;
import com.abckedn.vtd.security.JwtTokenProvider;
import com.abckedn.vtd.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadRequestException("Invalid email or password");
        }

        UserPrincipal principal = UserPrincipal.from(user);
        String token = tokenProvider.generateToken(principal);

        UserDto userDto = toDto(user);
        return new LoginResponse(token, userDto);
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new BadRequestException("User not found"));
        return toDto(user);
    }

    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream().map(this::toDto).toList();
    }

    private UserDto toDto(User user) {
        return new UserDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name()
        );
    }
}

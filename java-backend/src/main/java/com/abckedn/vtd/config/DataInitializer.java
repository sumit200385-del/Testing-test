package com.abckedn.vtd.config;

import com.abckedn.vtd.entity.User;
import com.abckedn.vtd.entity.enums.UserRole;
import com.abckedn.vtd.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Users already exist, skipping data initialization.");
            return;
        }

        log.info("Initializing seed users...");

        String defaultPassword = passwordEncoder.encode("Password@123");

        List<User> seedUsers = List.of(
                User.builder()
                        .name("Admin User")
                        .email("admin@abckedn.com")
                        .passwordHash(defaultPassword)
                        .role(UserRole.ADMIN)
                        .build(),
                User.builder()
                        .name("RD Engineer")
                        .email("rd.engineer@abckedn.com")
                        .passwordHash(defaultPassword)
                        .role(UserRole.RD_ENGINEER)
                        .build(),
                User.builder()
                        .name("RD Head")
                        .email("rd.head@abckedn.com")
                        .passwordHash(defaultPassword)
                        .role(UserRole.RD_HEAD)
                        .build(),
                User.builder()
                        .name("Operations User")
                        .email("ops@abckedn.com")
                        .passwordHash(defaultPassword)
                        .role(UserRole.OPERATIONS)
                        .build(),
                User.builder()
                        .name("Sales User")
                        .email("sales@abckedn.com")
                        .passwordHash(defaultPassword)
                        .role(UserRole.SALES)
                        .build()
        );

        userRepository.saveAll(seedUsers);
        log.info("Successfully created {} seed users.", seedUsers.size());
    }
}

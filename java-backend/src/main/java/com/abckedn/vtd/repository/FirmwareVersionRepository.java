package com.abckedn.vtd.repository;

import com.abckedn.vtd.entity.FirmwareVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FirmwareVersionRepository extends JpaRepository<FirmwareVersion, UUID> {

    @Query("SELECT f FROM FirmwareVersion f JOIN FETCH f.createdBy ORDER BY f.createdAt DESC")
    List<FirmwareVersion> findAllWithCreatedBy();

    @Query("SELECT f FROM FirmwareVersion f JOIN FETCH f.createdBy WHERE f.id = :id")
    Optional<FirmwareVersion> findByIdWithCreatedBy(UUID id);
}

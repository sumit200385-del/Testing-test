package com.abckedn.vtd.repository;

import com.abckedn.vtd.entity.Signoff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SignoffRepository extends JpaRepository<Signoff, UUID> {

    @Query("SELECT s FROM Signoff s JOIN FETCH s.signedBy JOIN FETCH s.session JOIN FETCH s.firmwareVersion WHERE s.firmwareVersion.id = :firmwareId ORDER BY s.signedAt DESC")
    List<Signoff> findByFirmwareVersionId(UUID firmwareId);

    @Query("SELECT s FROM Signoff s JOIN FETCH s.signedBy JOIN FETCH s.session JOIN FETCH s.firmwareVersion ORDER BY s.signedAt DESC")
    List<Signoff> findAllWithDetails();
}

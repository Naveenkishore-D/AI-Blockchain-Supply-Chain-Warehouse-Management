package com.nexus.scm.repository;

import com.nexus.scm.model.BlockchainBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BlockchainBlockRepository extends JpaRepository<BlockchainBlock, Long> {
}

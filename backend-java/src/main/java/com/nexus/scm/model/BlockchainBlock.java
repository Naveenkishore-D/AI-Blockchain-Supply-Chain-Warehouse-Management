package com.nexus.scm.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "blockchain")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlockchainBlock {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "block_index")
    private Integer index;
    private String timestamp;

    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "block_data_id")
    private BlockData data;

    private String previousHash;
    private String hash;
    private String signature;

    // Ethereum Smart Contract / Web3j Audits
    private String ethTxHash;
    private String ethContractAddress;
    private String ethBlockNumber;
    private String ethNetwork;
    private String ethStatus;
}


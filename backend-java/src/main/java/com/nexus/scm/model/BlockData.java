package com.nexus.scm.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "block_data")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlockData {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String action;
    private String entityId;
    private String entityType;
    
    @Column(length = 1024)
    private String details;
    private String operator;
    private String trackingCode;
}

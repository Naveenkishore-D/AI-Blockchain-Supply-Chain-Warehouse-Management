package com.nexus.scm.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "warehouses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Warehouse {
    @Id
    private String id;

    private String name;
    private String location;
    private Integer capacity;
    private Integer usedCapacity;
    private String managerName;
    private String status;
}

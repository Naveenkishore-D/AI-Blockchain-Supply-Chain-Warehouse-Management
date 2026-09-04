package com.nexus.scm.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "inventory")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryItem {
    @Id
    private String id;

    private String name;
    private String sku;
    private String category;
    private Integer quantity;
    private String unit;
    private String warehouseId;
    private String supplierId;
    private Integer reorderPoint;
    private Double unitPrice;
}

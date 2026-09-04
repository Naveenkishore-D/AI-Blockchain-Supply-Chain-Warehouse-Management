package com.nexus.scm.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "sales_order_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesOrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String itemId;
    private String name;
    private Integer quantity;
    private Double price;
}

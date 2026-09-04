package com.nexus.scm.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "purchase_orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseOrder {
    @Id
    private String id;

    private String poNumber;
    private String supplierId;
    private String supplierName;

    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "purchase_order_id")
    private List<PurchaseOrderItem> items;

    private Double totalAmount;
    private String status;
    private String orderDate;
    private String expectedDeliveryDate;
}

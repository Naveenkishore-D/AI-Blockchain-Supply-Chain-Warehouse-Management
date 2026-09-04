package com.nexus.scm.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "sales_orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesOrder {
    @Id
    private String id;

    private String soNumber;
    private String customerName;

    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "sales_order_id")
    private List<SalesOrderItem> items;

    private Double totalAmount;
    private String status;
    private String orderDate;
}

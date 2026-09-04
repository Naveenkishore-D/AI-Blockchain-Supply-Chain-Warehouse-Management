package com.nexus.scm.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "shipments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shipment {
    @Id
    private String id;

    private String shipmentNumber;
    private String orderId;
    private String orderNumber;
    private String orderType; // Purchase or Sales
    private String origin;
    private String destination;
    private String carrier;
    private String trackingNumber;
    private String status;
    private Double currentTemp;
    private Double currentHumidity;
    private Double currentGForce;

    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "shipment_id")
    private List<ShipmentSensorReading> sensorHistory;

    private String updatedAt;
}

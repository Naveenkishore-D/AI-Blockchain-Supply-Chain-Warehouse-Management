package com.nexus.scm.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "shipment_sensor_readings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShipmentSensorReading {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String timestamp;
    private Double temp;
    private Double humidity;
    private Double gForce;
}

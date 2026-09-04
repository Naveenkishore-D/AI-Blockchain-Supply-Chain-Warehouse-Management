package com.nexus.scm.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "suppliers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Supplier {
    @Id
    private String id;

    private String name;
    private String contactName;
    private String email;
    private String phone;
    private String location;
    private Double rating;
    private String status;
}

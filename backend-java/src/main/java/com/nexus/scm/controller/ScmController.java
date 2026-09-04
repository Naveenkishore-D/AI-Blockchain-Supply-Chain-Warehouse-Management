package com.nexus.scm.controller;

import com.nexus.scm.model.*;
import com.nexus.scm.repository.*;
import com.nexus.scm.service.BlockchainService;
import com.nexus.scm.service.GeminiService;
import com.nexus.scm.service.LangChainAgentService;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ScmController {

    @Autowired private SupplierRepository supplierRepository;
    @Autowired private WarehouseRepository warehouseRepository;
    @Autowired private InventoryItemRepository inventoryItemRepository;
    @Autowired private PurchaseOrderRepository purchaseOrderRepository;
    @Autowired private SalesOrderRepository salesOrderRepository;
    @Autowired private ShipmentRepository shipmentRepository;
    @Autowired private BlockchainBlockRepository blockchainBlockRepository;
    
    @Autowired private BlockchainService blockchainService;
    @Autowired private GeminiService geminiService;
    @Autowired private com.nexus.scm.service.Web3jService web3jService;
    @Autowired private LangChainAgentService langChainAgentService;

    // Seeding DB on Application Startup
    @PostConstruct
    public void seedDatabase() {
        if (supplierRepository.count() == 0) {
            // Seed Suppliers
            Supplier sup1 = Supplier.builder()
                    .id("sup-seed1")
                    .name("Titan Electronics Corp")
                    .contactName("Marcus Vance")
                    .email("m.vance@titanelectronics.com")
                    .phone("+1-312-555-0143")
                    .location("Chicago, IL")
                    .rating(4.8)
                    .status("Active")
                    .build();

            Supplier sup2 = Supplier.builder()
                    .id("sup-seed2")
                    .name("AeroForge Logistics")
                    .contactName("Elena Rostova")
                    .email("e.rostova@aeroforge.net")
                    .phone("+1-206-555-0188")
                    .location("Seattle, WA")
                    .rating(4.5)
                    .status("Active")
                    .build();

            supplierRepository.saveAll(List.of(sup1, sup2));

            // Seed Warehouses
            Warehouse wh1 = Warehouse.builder()
                    .id("wh-seed1")
                    .name("Logistics Hub Alpha")
                    .location("Detroit, MI")
                    .capacity(25000)
                    .usedCapacity(3200)
                    .managerName("Jackson Wright")
                    .status("Active")
                    .build();

            Warehouse wh2 = Warehouse.builder()
                    .id("wh-seed2")
                    .name("Cold Cryo Hub Beta")
                    .location("Phoenix, AZ")
                    .capacity(15000)
                    .usedCapacity(1500)
                    .managerName("Sarah Connor")
                    .status("Active")
                    .build();

            warehouseRepository.saveAll(List.of(wh1, wh2));

            // Seed Inventory Items
            InventoryItem item1 = InventoryItem.builder()
                    .id("inv-seed1")
                    .name("Advanced Microprocessors")
                    .sku("SKU-CPU-902")
                    .category("Components")
                    .quantity(1200)
                    .unit("Units")
                    .warehouseId("wh-seed1")
                    .supplierId("sup-seed1")
                    .reorderPoint(500)
                    .unitPrice(120.00)
                    .build();

            InventoryItem item2 = InventoryItem.builder()
                    .id("inv-seed2")
                    .name("Cryogenic Liquid Tanks")
                    .sku("SKU-CRYO-044")
                    .category("Hardware")
                    .quantity(2000)
                    .unit("Liters")
                    .warehouseId("wh-seed2")
                    .supplierId("sup-seed2")
                    .reorderPoint(800)
                    .unitPrice(15.50)
                    .build();

            inventoryItemRepository.saveAll(List.of(item1, item2));

            // Seed Blockchain Block
            BlockData genesisData = BlockData.builder()
                    .action("GENESIS_SYSTEM_LAUNCH")
                    .entityId("sys-0000")
                    .entityType("System")
                    .details("AI-Powered Blockchain-Based Supply Chain Management System bootstrapped successfully.")
                    .operator("SYSTEM_CREATOR")
                    .trackingCode("NEXUS-SCM-ACTIVE")
                    .build();

            blockchainService.addBlock(genesisData, "SYSTEM_CREATOR");

            // Seed Purchase Order
            PurchaseOrderItem poItem = PurchaseOrderItem.builder()
                    .itemId("inv-seed1")
                    .name("Advanced Microprocessors")
                    .quantity(100)
                    .price(120.00)
                    .build();

            PurchaseOrder po = PurchaseOrder.builder()
                    .id("po-seed")
                    .poNumber("PO-2026-801")
                    .supplierId("sup-seed1")
                    .supplierName("Titan Electronics Corp")
                    .items(List.of(poItem))
                    .totalAmount(12000.00)
                    .status("Sent")
                    .orderDate(Instant.now().toString())
                    .expectedDeliveryDate(Instant.now().plusSeconds(7 * 24 * 3600).toString())
                    .build();

            purchaseOrderRepository.save(po);

            // Seed Outbound Shipment
            ShipmentSensorReading reading = ShipmentSensorReading.builder()
                    .timestamp(Instant.now().toString())
                    .temp(19.2)
                    .humidity(43.1)
                    .gForce(1.02)
                    .build();

            Shipment shipment = Shipment.builder()
                    .id("ship-seed")
                    .shipmentNumber("SH-2026-904")
                    .orderId("po-seed")
                    .orderNumber("PO-2026-801")
                    .orderType("Purchase")
                    .origin("Chicago, IL")
                    .destination("Logistics Hub Alpha (Detroit, MI)")
                    .carrier("Apex Cargo Express")
                    .trackingNumber("TRK-APX-392100")
                    .status("In Transit")
                    .currentTemp(19.2)
                    .currentHumidity(43.1)
                    .currentGForce(1.02)
                    .sensorHistory(new ArrayList<>(List.of(reading)))
                    .updatedAt(Instant.now().toString())
                    .build();

            shipmentRepository.save(shipment);
        }
    }

    // Health
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getHealth() {
        Map<String, Object> body = new HashMap<>();
        body.put("status", "ok");
        body.put("time", Instant.now().toString());
        body.put("framework", "Spring Boot Java 21");
        return ResponseEntity.ok(body);
    }

    // Suppliers
    @GetMapping("/suppliers")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OPERATOR')")
    public List<Supplier> getSuppliers() {
        return supplierRepository.findAll();
    }

    @PostMapping("/suppliers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addSupplier(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String contactName = body.get("contactName");
        String email = body.get("email");
        String phone = body.getOrDefault("phone", "");
        String location = body.get("location");

        if (name == null || contactName == null || email == null || location == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing required fields"));
        }

        Supplier supplier = Supplier.builder()
                .id("sup-" + UUID.randomUUID().toString().substring(0, 8))
                .name(name)
                .contactName(contactName)
                .email(email)
                .phone(phone)
                .location(location)
                .rating(5.0)
                .status("Active")
                .build();

        supplierRepository.save(supplier);

        // Blockchain audit
        BlockData blockData = BlockData.builder()
                .action("SUPPLIER_REGISTERED")
                .entityId(supplier.getId())
                .entityType("Supplier")
                .details(String.format("Supplier '%s' was registered at %s by manager.", name, location))
                .operator("OPERATOR_ADMIN")
                .trackingCode(name + " " + location)
                .build();

        blockchainService.addBlock(blockData, "OPERATOR_ADMIN");

        return ResponseEntity.status(HttpStatus.CREATED).body(supplier);
    }

    // Warehouses
    @GetMapping("/warehouses")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OPERATOR')")
    public List<Warehouse> getWarehouses() {
        return warehouseRepository.findAll();
    }

    @PostMapping("/warehouses")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addWarehouse(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        String location = (String) body.get("location");
        Object capacityObj = body.get("capacity");
        String managerName = (String) body.get("managerName");

        if (name == null || location == null || capacityObj == null || managerName == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing required fields"));
        }

        int capacity = Integer.parseInt(capacityObj.toString());

        Warehouse wh = Warehouse.builder()
                .id("wh-" + UUID.randomUUID().toString().substring(0, 8))
                .name(name)
                .location(location)
                .capacity(capacity)
                .usedCapacity(0)
                .managerName(managerName)
                .status("Active")
                .build();

        warehouseRepository.save(wh);
        return ResponseEntity.status(HttpStatus.CREATED).body(wh);
    }

    // Inventory
    @GetMapping("/inventory")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OPERATOR')")
    public List<InventoryItem> getInventory() {
        return inventoryItemRepository.findAll();
    }

    @PostMapping("/inventory")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<?> addInventory(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        String sku = (String) body.get("sku");
        String category = (String) body.get("category");
        Object quantityObj = body.get("quantity");
        String unit = (String) body.get("unit");
        String warehouseId = (String) body.get("warehouseId");
        String supplierId = (String) body.get("supplierId");
        Object reorderPointObj = body.get("reorderPoint");
        Object unitPriceObj = body.get("unitPrice");

        if (name == null || sku == null || category == null || quantityObj == null || unit == null 
                || warehouseId == null || supplierId == null || reorderPointObj == null || unitPriceObj == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing required fields"));
        }

        int quantity = Integer.parseInt(quantityObj.toString());
        int reorderPoint = Integer.parseInt(reorderPointObj.toString());
        double unitPrice = Double.parseDouble(unitPriceObj.toString());

        InventoryItem item = InventoryItem.builder()
                .id("inv-" + UUID.randomUUID().toString().substring(0, 8))
                .name(name)
                .sku(sku)
                .category(category)
                .quantity(quantity)
                .unit(unit)
                .warehouseId(warehouseId)
                .supplierId(supplierId)
                .reorderPoint(reorderPoint)
                .unitPrice(unitPrice)
                .build();

        // Increment warehouse storage utilization
        Optional<Warehouse> whOpt = warehouseRepository.findById(warehouseId);
        whOpt.ifPresent(wh -> {
            wh.setUsedCapacity(wh.getUsedCapacity() + quantity);
            warehouseRepository.save(wh);
        });

        inventoryItemRepository.save(item);

        // Blockchain
        BlockData blockData = BlockData.builder()
                .action("INVENTORY_INITIALIZED")
                .entityId(item.getId())
                .entityType("Inventory")
                .details(String.format("Inventory item '%s' (SKU: %s) initialized at warehouse with quantity %d.", name, sku, quantity))
                .operator("OPERATOR_ADMIN")
                .trackingCode(sku + " Qty:" + quantity)
                .build();

        blockchainService.addBlock(blockData, "OPERATOR_ADMIN");

        return ResponseEntity.status(HttpStatus.CREATED).body(item);
    }

    // Purchase Orders
    @GetMapping("/purchase-orders")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OPERATOR')")
    public List<PurchaseOrder> getPurchaseOrders() {
        return purchaseOrderRepository.findAll();
    }

    @PostMapping("/purchase-orders")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<?> createPurchaseOrder(@RequestBody Map<String, Object> body) {
        String supplierId = (String) body.get("supplierId");
        List<?> itemsObj = (List<?>) body.get("items");

        if (supplierId == null || itemsObj == null || itemsObj.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid payload details."));
        }

        Optional<Supplier> supplierOpt = supplierRepository.findById(supplierId);
        if (supplierOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Supplier not found"));
        }
        Supplier supplier = supplierOpt.get();

        List<PurchaseOrderItem> processedItems = new ArrayList<>();
        double totalAmount = 0.0;

        for (Object obj : itemsObj) {
            Map<?, ?> itemMap = (Map<?, ?>) obj;
            String itemId = (String) itemMap.get("itemId");
            int quantity = Integer.parseInt(itemMap.get("quantity").toString());

            Optional<InventoryItem> invOpt = inventoryItemRepository.findById(itemId);
            if (invOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Inventory item ID " + itemId + " not found"));
            }
            InventoryItem invItem = invOpt.get();

            PurchaseOrderItem poItem = PurchaseOrderItem.builder()
                    .itemId(invItem.getId())
                    .name(invItem.getName())
                    .quantity(quantity)
                    .price(invItem.getUnitPrice())
                    .build();

            processedItems.add(poItem);
            totalAmount += quantity * invItem.getUnitPrice();
        }

        String poNumber = "PO-2026-" + (new Random().nextInt(900) + 100);
        PurchaseOrder po = PurchaseOrder.builder()
                .id("po-" + UUID.randomUUID().toString().substring(0, 8))
                .poNumber(poNumber)
                .supplierId(supplierId)
                .supplierName(supplier.getName())
                .items(processedItems)
                .totalAmount(totalAmount)
                .status("Sent")
                .orderDate(Instant.now().toString())
                .expectedDeliveryDate(Instant.now().plusSeconds(7 * 24 * 3600).toString())
                .build();

        purchaseOrderRepository.save(po);

        // Generate matching shipment cargo
        String targetWHId = "wh-seed1";
        if (!processedItems.isEmpty()) {
            Optional<InventoryItem> inv = inventoryItemRepository.findById(processedItems.get(0).getItemId());
            if (inv.isPresent()) targetWHId = inv.get().getWarehouseId();
        }
        Optional<Warehouse> whOpt = warehouseRepository.findById(targetWHId);
        String destinationName = whOpt.isPresent() ? whOpt.get().getName() + " (" + whOpt.get().getLocation() + ")" : "Central Storage Hub";

        Shipment shipment = Shipment.builder()
                .id("ship-" + UUID.randomUUID().toString().substring(0, 8))
                .shipmentNumber("SH-2026-" + (new Random().nextInt(900) + 100))
                .orderId(po.getId())
                .orderNumber(po.getPoNumber())
                .orderType("Purchase")
                .origin(supplier.getLocation())
                .destination(destinationName)
                .carrier("Apex Cargo Express")
                .trackingNumber("TRK-APX-" + (new Random().nextInt(900000) + 100000))
                .status("In Transit")
                .currentTemp(18.0)
                .currentHumidity(45.0)
                .currentGForce(1.0)
                .sensorHistory(new ArrayList<>(List.of(
                        ShipmentSensorReading.builder().timestamp(Instant.now().toString()).temp(18.0).humidity(45.0).gForce(1.0).build()
                )))
                .updatedAt(Instant.now().toString())
                .build();

        shipmentRepository.save(shipment);

        // Blockchain logging
        blockchainService.addBlock(BlockData.builder()
                .action("PURCHASE_ORDER_SENT")
                .entityId(po.getId())
                .entityType("Order")
                .details(String.format("Purchase Order '%s' sent to '%s' for total values of $%.2f.", poNumber, supplier.getName(), totalAmount))
                .operator("PURCHASING_MANAGER")
                .trackingCode(poNumber + " " + supplier.getName())
                .build(), "PURCHASING_MANAGER");

        blockchainService.addBlock(BlockData.builder()
                .action("SHIPMENT_LAUNCHED")
                .entityId(shipment.getId())
                .entityType("Shipment")
                .details(String.format("Shipment '%s' generated automatically for order '%s'. In Transit with sensor logs.", shipment.getShipmentNumber(), poNumber))
                .operator("SYSTEM_ROUTING")
                .trackingCode(shipment.getShipmentNumber())
                .build(), "SYSTEM_ROUTING");

        return ResponseEntity.status(HttpStatus.CREATED).body(po);
    }

    @PostMapping("/purchase-orders/{id}/receive")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OPERATOR')")
    public ResponseEntity<?> receivePurchaseOrder(@PathVariable String id) {
        Optional<PurchaseOrder> poOpt = purchaseOrderRepository.findById(id);
        if (poOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Purchase Order not found"));
        }

        PurchaseOrder po = poOpt.get();
        if ("Received".equals(po.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Purchase Order already received"));
        }

        po.setStatus("Received");

        // Increment stock and warehouse capacities
        for (PurchaseOrderItem orderItem : po.getItems()) {
            Optional<InventoryItem> invOpt = inventoryItemRepository.findById(orderItem.getItemId());
            invOpt.ifPresent(invItem -> {
                invItem.setQuantity(invItem.getQuantity() + orderItem.getQuantity());
                inventoryItemRepository.save(invItem);

                Optional<Warehouse> whOpt = warehouseRepository.findById(invItem.getWarehouseId());
                whOpt.ifPresent(wh -> {
                    wh.setUsedCapacity(wh.getUsedCapacity() + orderItem.getQuantity());
                    warehouseRepository.save(wh);
                });

                blockchainService.addBlock(BlockData.builder()
                        .action("INVENTORY_RECEIVED")
                        .entityId(invItem.getId())
                        .entityType("Inventory")
                        .details(String.format("Inventory '%s' count increased by +%d units following reception of PO '%s'.", invItem.getName(), orderItem.getQuantity(), po.getPoNumber()))
                        .operator("WAREHOUSE_OPERATOR")
                        .trackingCode(invItem.getSku() + " +" + orderItem.getQuantity())
                        .build(), "WAREHOUSE_OPERATOR");
            });
        }

        // Complete matching shipment
        List<Shipment> shipments = shipmentRepository.findAll();
        for (Shipment s : shipments) {
            if (po.getId().equals(s.getOrderId())) {
                s.setStatus("Delivered");
                s.setUpdatedAt(Instant.now().toString());
                shipmentRepository.save(s);

                blockchainService.addBlock(BlockData.builder()
                        .action("SHIPMENT_DELIVERED")
                        .entityId(s.getId())
                        .entityType("Shipment")
                        .details(String.format("Shipment '%s' marked as Delivered successfully. Cold chain telemetry closed.", s.getShipmentNumber()))
                        .operator("LOGISTICS_OPERATOR")
                        .trackingCode(s.getShipmentNumber())
                        .build(), "LOGISTICS_OPERATOR");
            }
        }

        purchaseOrderRepository.save(po);

        blockchainService.addBlock(BlockData.builder()
                .action("PURCHASE_ORDER_RECEIVED")
                .entityId(po.getId())
                .entityType("Order")
                .details(String.format("Purchase Order '%s' marked as fully Received and processed.", po.getPoNumber()))
                .operator("WAREHOUSE_MANAGER")
                .trackingCode(po.getPoNumber())
                .build(), "WAREHOUSE_MANAGER");

        return ResponseEntity.ok(po);
    }

    // Sales Orders
    @GetMapping("/sales-orders")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OPERATOR')")
    public List<SalesOrder> getSalesOrders() {
        return salesOrderRepository.findAll();
    }

    @PostMapping("/sales-orders")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<?> createSalesOrder(@RequestBody Map<String, Object> body) {
        String customerName = (String) body.get("customerName");
        List<?> itemsObj = (List<?>) body.get("items");

        if (customerName == null || itemsObj == null || itemsObj.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid sales order details"));
        }

        List<SalesOrderItem> processedItems = new ArrayList<>();
        double totalAmount = 0.0;

        for (Object obj : itemsObj) {
            Map<?, ?> itemMap = (Map<?, ?>) obj;
            String itemId = (String) itemMap.get("itemId");
            int quantity = Integer.parseInt(itemMap.get("quantity").toString());

            Optional<InventoryItem> invOpt = inventoryItemRepository.findById(itemId);
            if (invOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Inventory item ID " + itemId + " not found"));
            }
            InventoryItem invItem = invOpt.get();

            if (invItem.getQuantity() < quantity) {
                return ResponseEntity.badRequest().body(Map.of("error", "Insufficient stock for " + invItem.getName() + ". Available: " + invItem.getQuantity()));
            }

            SalesOrderItem soItem = SalesOrderItem.builder()
                    .itemId(invItem.getId())
                    .name(invItem.getName())
                    .quantity(quantity)
                    .price(invItem.getUnitPrice() * 1.4) // Sales Markup
                    .build();

            processedItems.add(soItem);
            totalAmount += quantity * soItem.getPrice();
        }

        String soNumber = "SO-2026-" + (new Random().nextInt(900) + 100);
        SalesOrder so = SalesOrder.builder()
                .id("so-" + UUID.randomUUID().toString().substring(0, 8))
                .soNumber(soNumber)
                .customerName(customerName)
                .items(processedItems)
                .totalAmount(totalAmount)
                .status("Processing")
                .orderDate(Instant.now().toString())
                .build();

        salesOrderRepository.save(so);

        blockchainService.addBlock(BlockData.builder()
                .action("SALES_ORDER_CREATED")
                .entityId(so.getId())
                .entityType("Order")
                .details(String.format("Sales Order '%s' for client '%s' was generated in state 'Processing'.", soNumber, customerName))
                .operator("SALES_AGENT")
                .trackingCode(soNumber)
                .build(), "SALES_AGENT");

        return ResponseEntity.status(HttpStatus.CREATED).body(so);
    }

    @PostMapping("/sales-orders/{id}/dispatch")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OPERATOR')")
    public ResponseEntity<?> dispatchSalesOrder(@PathVariable String id) {
        Optional<SalesOrder> soOpt = salesOrderRepository.findById(id);
        if (soOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Sales Order not found"));
        }

        SalesOrder so = soOpt.get();
        if (!"Processing".equals(so.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only sales orders in 'Processing' state can be dispatched."));
        }

        // Validate stock again
        for (SalesOrderItem item : so.getItems()) {
            Optional<InventoryItem> invOpt = inventoryItemRepository.findById(item.getItemId());
            if (invOpt.isEmpty() || invOpt.get().getQuantity() < item.getQuantity()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Stock levels have fluctuated. Cannot fulfill " + item.getName()));
            }
        }

        so.setStatus("Shipped");

        // Deduct inventory
        String originLocation = "Distribution Center";
        for (SalesOrderItem item : so.getItems()) {
            Optional<InventoryItem> invOpt = inventoryItemRepository.findById(item.getItemId());
            if (invOpt.isPresent()) {
                InventoryItem invItem = invOpt.get();
                invItem.setQuantity(invItem.getQuantity() - item.getQuantity());
                inventoryItemRepository.save(invItem);

                Optional<Warehouse> whOpt = warehouseRepository.findById(invItem.getWarehouseId());
                if (whOpt.isPresent()) {
                    Warehouse wh = whOpt.get();
                    wh.setUsedCapacity(Math.max(0, wh.getUsedCapacity() - item.getQuantity()));
                    warehouseRepository.save(wh);
                    originLocation = wh.getName() + " (" + wh.getLocation() + ")";
                }

                blockchainService.addBlock(BlockData.builder()
                        .action("INVENTORY_SHIPPED")
                        .entityId(invItem.getId())
                        .entityType("Inventory")
                        .details(String.format("Inventory count for '%s' decremented by -%d for fulfillment of sales order '%s'.", invItem.getName(), item.getQuantity(), so.getSoNumber()))
                        .operator("WAREHOUSE_PICKER")
                        .trackingCode(invItem.getSku() + " -" + item.getQuantity())
                        .build(), "WAREHOUSE_PICKER");
            }
        }

        // Launch dispatch shipment cargo
        Shipment shipment = Shipment.builder()
                .id("ship-" + UUID.randomUUID().toString().substring(0, 8))
                .shipmentNumber("SH-2026-" + (new Random().nextInt(900) + 100))
                .orderId(so.getId())
                .orderNumber(so.getSoNumber())
                .orderType("Sales")
                .origin(originLocation)
                .destination(so.getCustomerName() + " (Client Office)")
                .carrier("UPS Supply Chain Solutions")
                .trackingNumber("TRK-UPS-" + (new Random().nextInt(900000) + 100000))
                .status("In Transit")
                .currentTemp(21.0)
                .currentHumidity(48.0)
                .currentGForce(1.0)
                .sensorHistory(new ArrayList<>(List.of(
                        ShipmentSensorReading.builder().timestamp(Instant.now().toString()).temp(21.0).humidity(48.0).gForce(1.0).build()
                )))
                .updatedAt(Instant.now().toString())
                .build();

        shipmentRepository.save(shipment);

        blockchainService.addBlock(BlockData.builder()
                .action("SALES_ORDER_SHIPPED")
                .entityId(so.getId())
                .entityType("Order")
                .details(String.format("Sales Order '%s' dispatched from warehouse. Shipment tracking '%s' registered.", so.getSoNumber(), shipment.getShipmentNumber()))
                .operator("LOGISTICS_DISPATCH")
                .trackingCode(so.getSoNumber())
                .build(), "LOGISTICS_DISPATCH");

        blockchainService.addBlock(BlockData.builder()
                .action("OUTBOUND_SHIPMENT_LAUNCHED")
                .entityId(shipment.getId())
                .entityType("Shipment")
                .details(String.format("Outbound Cargo '%s' has started transit to customer '%s'.", shipment.getShipmentNumber(), so.getCustomerName()))
                .operator("LOGISTICS_CARRIER")
                .trackingCode(shipment.getShipmentNumber())
                .build(), "LOGISTICS_CARRIER");

        salesOrderRepository.save(so);
        return ResponseEntity.ok(so);
    }

    @PostMapping("/sales-orders/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<?> completeSalesOrder(@PathVariable String id) {
        Optional<SalesOrder> soOpt = salesOrderRepository.findById(id);
        if (soOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Sales Order not found"));
        }

        SalesOrder so = soOpt.get();
        if (!"Shipped".equals(so.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only shipped sales orders can be marked as completed."));
        }

        so.setStatus("Completed");

        // Complete matching shipment
        List<Shipment> shipments = shipmentRepository.findAll();
        for (Shipment s : shipments) {
            if (so.getId().equals(s.getOrderId())) {
                s.setStatus("Delivered");
                s.setUpdatedAt(Instant.now().toString());
                shipmentRepository.save(s);

                blockchainService.addBlock(BlockData.builder()
                        .action("SHIPMENT_DELIVERED")
                        .entityId(s.getId())
                        .entityType("Shipment")
                        .details(String.format("Shipment '%s' safely delivered to client location. Integrity telemetry closed.", s.getShipmentNumber()))
                        .operator("LOGISTICS_CARRIER")
                        .trackingCode(s.getShipmentNumber())
                        .build(), "LOGISTICS_CARRIER");
            }
        }

        salesOrderRepository.save(so);

        blockchainService.addBlock(BlockData.builder()
                .action("SALES_ORDER_COMPLETED")
                .entityId(so.getId())
                .entityType("Order")
                .details(String.format("Sales Order '%s' has been finalized and accepted by customer.", so.getSoNumber()))
                .operator("SALES_MANAGER")
                .trackingCode(so.getSoNumber())
                .build(), "SALES_MANAGER");

        return ResponseEntity.ok(so);
    }

    // Shipments List
    @GetMapping({"/shipments", "/logistics"})
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OPERATOR')")
    public List<Shipment> getShipments() {
        return shipmentRepository.findAll();
    }

    // Broadcast Telemetry
    @PostMapping("/shipments/{id}/telemetry")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OPERATOR')")
    public ResponseEntity<?> broadcastTelemetry(@PathVariable String id, @RequestBody Map<String, Object> body) {
        Optional<Shipment> shipOpt = shipmentRepository.findById(id);
        if (shipOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Shipment not found"));
        }

        Shipment shipment = shipOpt.get();
        if ("Delivered".equals(shipment.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cargo is already delivered. Telemetry disabled."));
        }

        double temp = Double.parseDouble(body.get("temp").toString());
        double humidity = Double.parseDouble(body.get("humidity").toString());
        double gForce = Double.parseDouble(body.get("gForce").toString());

        ShipmentSensorReading reading = ShipmentSensorReading.builder()
                .timestamp(Instant.now().toString())
                .temp(temp)
                .humidity(humidity)
                .gForce(gForce)
                .build();

        shipment.setCurrentTemp(temp);
        shipment.setCurrentHumidity(humidity);
        shipment.setCurrentGForce(gForce);
        shipment.getSensorHistory().add(reading);
        shipment.setUpdatedAt(Instant.now().toString());

        // Dynamic thresholds checks
        if (temp > 25.0) {
            blockchainService.addBlock(BlockData.builder()
                    .action("TELEMETRY_ALARM_BREACH")
                    .entityId(shipment.getId())
                    .entityType("Shipment")
                    .details(String.format("CRITICAL BREACH: Temperature spike detected in cargo '%s' (%.1f°C).", shipment.getShipmentNumber(), temp))
                    .operator("IOT_SENSOR_GATEWAY")
                    .trackingCode(shipment.getShipmentNumber() + " TEMP_BREACH:" + temp)
                    .build(), "IOT_SENSOR_GATEWAY");
            shipment.setStatus("Delayed");
        }

        if (gForce > 1.8) {
            blockchainService.addBlock(BlockData.builder()
                    .action("TELEMETRY_IMPACT_BREACH")
                    .entityId(shipment.getId())
                    .entityType("Shipment")
                    .details(String.format("IMPACT BREACH: High force impact detected on container '%s' (%.2fG).", shipment.getShipmentNumber(), gForce))
                    .operator("IOT_SENSOR_GATEWAY")
                    .trackingCode(shipment.getShipmentNumber() + " IMPACT_VIOLATION:" + gForce)
                    .build(), "IOT_SENSOR_GATEWAY");
        }

        shipmentRepository.save(shipment);
        return ResponseEntity.ok(shipment);
    }

    // Blockchain
    @GetMapping("/blockchain")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OPERATOR')")
    public List<BlockchainBlock> getBlockchain() {
        return blockchainBlockRepository.findAll();
    }

    @GetMapping({"/getChain", "/chain"})
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OPERATOR')")
    public List<BlockchainBlock> getChain() {
        return blockchainBlockRepository.findAll();
    }

    @PostMapping("/addBlock")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<?> addBlock(@RequestBody Map<String, Object> body) {
        String action = (String) body.get("action");
        String entityId = (String) body.get("entityId");
        String entityType = (String) body.get("entityType");
        String details = (String) body.get("details");
        String operator = (String) body.getOrDefault("operator", "OPERATOR");
        String trackingCode = (String) body.getOrDefault("trackingCode", "MANUAL_TRACE");

        if (action == null || entityId == null || entityType == null || details == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing required fields: action, entityId, entityType, details"));
        }

        BlockData blockData = BlockData.builder()
                .action(action)
                .entityId(entityId)
                .entityType(entityType)
                .details(details)
                .operator(operator)
                .trackingCode(trackingCode)
                .build();

        BlockchainBlock block = blockchainService.addBlock(blockData, operator);
        return ResponseEntity.status(HttpStatus.CREATED).body(block);
    }

    @PostMapping("/blockchain/tamper")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<?> tamperBlock(@RequestBody Map<String, Object> body) {
        Object indexObj = body.get("index");
        String newDetails = (String) body.get("details");

        if (indexObj == null || newDetails == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing required fields: index, details"));
        }

        Integer index = Integer.parseInt(indexObj.toString());
        List<BlockchainBlock> blocks = blockchainBlockRepository.findAll();
        Optional<BlockchainBlock> blockOpt = blocks.stream()
                .filter(b -> b.getIndex().equals(index))
                .findFirst();

        if (blockOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Block index not found"));
        }

        BlockchainBlock block = blockOpt.get();
        if (block.getData() != null) {
            block.getData().setDetails(newDetails);
        }
        blockchainBlockRepository.save(block);
        return ResponseEntity.ok(Map.of("message", "Block " + index + " details tampered with successfully!", "block", block));
    }

    @PostMapping("/blockchain/restore")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<?> restoreBlockchain() {
        blockchainBlockRepository.deleteAll();
        BlockData genesisData = BlockData.builder()
                .action("GENESIS_SYSTEM_LAUNCH")
                .entityId("sys-0000")
                .entityType("System")
                .details("AI-Powered Blockchain-Based Supply Chain Management System bootstrapped successfully.")
                .operator("SYSTEM_CREATOR")
                .trackingCode("NEXUS-SCM-ACTIVE")
                .build();
        blockchainService.addBlock(genesisData, "SYSTEM_CREATOR");
        
        return ResponseEntity.ok(Map.of("message", "Blockchain ledger restored and re-synchronized!"));
    }

    @GetMapping("/blockchain/verify")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Map<String, Object>> verifyBlockchain() {
        List<BlockchainBlock> chain = blockchainBlockRepository.findAll();
        boolean isValid = true;
        List<String> errors = new ArrayList<>();

        for (int i = 0; i < chain.size(); i++) {
            BlockchainBlock current = chain.get(i);
            String calculated = blockchainService.calculateBlockHash(current.getIndex(), current.getTimestamp(), current.getData(), current.getPreviousHash());

            if (!calculated.equals(current.getHash())) {
                isValid = false;
                errors.add(String.format("Block #%d hash is corrupted! Re-calculated: %s, Saved: %s", current.getIndex(), calculated, current.getHash()));
            }

            if (i > 0) {
                BlockchainBlock previous = chain.get(i - 1);
                if (!current.getPreviousHash().equals(previous.getHash())) {
                    isValid = false;
                    errors.add(String.format("Block #%d link broken! Points to: %s, expected: %s", current.getIndex(), current.getPreviousHash(), previous.getHash()));
                }
            }

            String reCalculatedSig = blockchainService.generateBlockSignature(current.getHash());
            if (!reCalculatedSig.equals(current.getSignature())) {
                isValid = false;
                errors.add(String.format("Block #%d signature verification failed!", current.getIndex()));
            }
        }

        Map<String, Object> res = new HashMap<>();
        res.put("verified", isValid);
        res.put("totalBlocks", chain.size());
        res.put("errors", errors);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/blockchain/ethereum-status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OPERATOR')")
    public ResponseEntity<Map<String, Object>> getEthereumStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("connected", web3jService.isConnected());
        status.put("walletAddress", web3jService.getWalletAddress());
        status.put("contractAddress", web3jService.getContractAddress());
        status.put("network", web3jService.isConnected() ? "Live Ethereum / Ganache RPC" : "Local Simulated Ethereum Ledger (Ganache Offline)");
        return ResponseEntity.ok(status);
    }

    // AI Predictions Shortages
    @GetMapping("/ai/predict-shortages")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<?> predictShortages() {
        try {
            List<InventoryItem> items = inventoryItemRepository.findAll();
            StringBuilder itemsStr = new StringBuilder();
            for (InventoryItem i : items) {
                itemsStr.append(String.format("Item ID: %s, SKU: %s, Name: %s, Quantity: %d %s, Reorder Point: %d, Unit Price: $%.2f\n", 
                        i.getId(), i.getSku(), i.getName(), i.getQuantity(), i.getUnit(), i.getReorderPoint(), i.getUnitPrice()));
            }

            String systemInstruction = "Analyze quantity vs reorderPoint and return a JSON array predicting stockouts.";
            String userPrompt = "Perform inventory shortage risk assessment on:\n" + itemsStr.toString();
            
            // Generate content with Gemini
            String responseJson = geminiService.generateContent(systemInstruction, userPrompt, true);
            return ResponseEntity.ok(responseJson);
        } catch (Exception e) {
            // Fallback heuristic simulation if API unconfigured
            List<InventoryItem> items = inventoryItemRepository.findAll();
            List<Map<String, Object>> fallbacks = new ArrayList<>();
            for (InventoryItem i : items) {
                boolean isShortage = i.getQuantity() <= i.getReorderPoint();
                int days = isShortage ? 3 : (i.getQuantity() - i.getReorderPoint()) / 10 + 15;
                
                Map<String, Object> map = new HashMap<>();
                map.put("itemId", i.getId());
                map.put("itemName", i.getName());
                map.put("sku", i.getSku());
                map.put("currentQuantity", i.getQuantity());
                map.put("predictedDaysToStockout", days);
                map.put("recommendedAction", isShortage 
                        ? "Procure 1,500 units from active supplier immediately to restore safety buffer." 
                        : "Schedule standard replenishment batch within " + days + " days.");
                map.put("confidence", 85);
                fallbacks.add(map);
            }
            return ResponseEntity.ok(fallbacks);
        }
    }

    // AI Chat
    @PostMapping("/ai/chat")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OPERATOR')")
    public ResponseEntity<?> aiChat(@RequestBody Map<String, Object> requestBody) {
        try {
            String message = (String) requestBody.get("message");
            if (message == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Message is required"));
            }

            List<Supplier> sups = supplierRepository.findAll();
            List<Warehouse> whs = warehouseRepository.findAll();
            List<InventoryItem> invs = inventoryItemRepository.findAll();
            List<PurchaseOrder> pos = purchaseOrderRepository.findAll();
            List<SalesOrder> sos = salesOrderRepository.findAll();
            List<Shipment> ships = shipmentRepository.findAll();

            StringBuilder context = new StringBuilder("SYSTEM SNAPSHOT:\n");
            context.append("- Suppliers:\n");
            for (Supplier s : sups) context.append(String.format("  * %s in %s Rating: %.1f\n", s.getName(), s.getLocation(), s.getRating()));
            context.append("- Warehouses:\n");
            for (Warehouse w : whs) context.append(String.format("  * %s (%d/%d used) Mgr: %s\n", w.getName(), w.getUsedCapacity(), w.getCapacity(), w.getManagerName()));
            context.append("- Inventory:\n");
            for (InventoryItem i : invs) context.append(String.format("  * %s sku: %s qty: %d\n", i.getName(), i.getSku(), i.getQuantity()));
            context.append("- Open Purchase Orders:\n");
            for (PurchaseOrder p : pos) context.append(String.format("  * PO %s status: %s total: $%.2f\n", p.getPoNumber(), p.getStatus(), p.getTotalAmount()));
            context.append("- Open Sales Orders:\n");
            for (SalesOrder s : sos) context.append(String.format("  * SO %s status: %s total: $%.2f\n", s.getSoNumber(), s.getStatus(), s.getTotalAmount()));
            context.append("- Shipments:\n");
            for (Shipment sh : ships) context.append(String.format("  * Cargo %s carrier: %s status: %s Temp: %.1f°C\n", sh.getShipmentNumber(), sh.getCarrier(), sh.getStatus(), sh.getCurrentTemp()));

            String systemInstruction = "You are the core Logistics AI Agent integrated within the AI-Powered Blockchain Supply Chain & Warehouse Management System.";
            String userPrompt = context.toString() + "\n\nUSER QUESTION: " + message;

            String response = geminiService.generateContent(systemInstruction, userPrompt, false);
            return ResponseEntity.ok(Map.of("content", response, "timestamp", Instant.now().toString()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    // LangChain4j Orchestrated Chat with Multi-Provider Support, RAG, and Tool/Function Calling
    @PostMapping("/ai/langchain-chat")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'OPERATOR')")
    public ResponseEntity<?> langChainChat(@RequestBody Map<String, Object> requestBody) {
        try {
            String message = (String) requestBody.get("message");
            if (message == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Message is required"));
            }

            String provider = (String) requestBody.getOrDefault("provider", "gemini");
            String apiKey = (String) requestBody.getOrDefault("apiKey", "");
            String baseUrl = (String) requestBody.getOrDefault("baseUrl", "");
            String modelName = (String) requestBody.getOrDefault("modelName", "");
            boolean ragEnabled = requestBody.get("ragEnabled") != null && (boolean) requestBody.get("ragEnabled");
            boolean toolsEnabled = requestBody.get("toolsEnabled") != null && (boolean) requestBody.get("toolsEnabled");

            String response = langChainAgentService.executeAgentChat(
                    message, provider, apiKey, baseUrl, modelName, ragEnabled, toolsEnabled
            );

            return ResponseEntity.ok(Map.of("content", response, "timestamp", Instant.now().toString()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
}

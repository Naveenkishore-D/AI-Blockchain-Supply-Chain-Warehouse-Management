package com.nexus.scm.service;

import com.nexus.scm.model.*;
import com.nexus.scm.repository.*;
import dev.langchain4j.agent.tool.Tool;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.*;

@Component
public class ScmTools {

    @Autowired private SupplierRepository supplierRepository;
    @Autowired private WarehouseRepository warehouseRepository;
    @Autowired private InventoryItemRepository inventoryItemRepository;
    @Autowired private PurchaseOrderRepository purchaseOrderRepository;
    @Autowired private SalesOrderRepository salesOrderRepository;
    @Autowired private ShipmentRepository shipmentRepository;
    @Autowired private BlockchainService blockchainService;

    @Tool("Retrieves list of all active suppliers and their details like rating, contact, and location.")
    public String getAllSuppliers() {
        List<Supplier> suppliers = supplierRepository.findAll();
        StringBuilder sb = new StringBuilder("Active Suppliers:\n");
        for (Supplier s : suppliers) {
            sb.append(String.format("- ID: %s | Name: %s | Contact: %s | Email: %s | Location: %s | Rating: %.1f | Status: %s\n",
                    s.getId(), s.getName(), s.getContactName(), s.getEmail(), s.getLocation(), s.getRating(), s.getStatus()));
        }
        return sb.toString();
    }

    @Tool("Retrieves current inventory stocks, SKU, Category, and warehouse details.")
    public String getInventoryLevels() {
        List<InventoryItem> items = inventoryItemRepository.findAll();
        StringBuilder sb = new StringBuilder("Current Inventory Levels:\n");
        for (InventoryItem i : items) {
            sb.append(String.format("- SKU: %s | Item: %s | Qty: %d %s | Warehouse ID: %s | Supplier ID: %s | Reorder Point: %d | Price: $%.2f\n",
                    i.getSku(), i.getName(), i.getQuantity(), i.getUnit(), i.getWarehouseId(), i.getSupplierId(), i.getReorderPoint(), i.getUnitPrice()));
        }
        return sb.toString();
    }

    @Tool("Fulfill and dispatch a sales order to client delivery.")
    public String dispatchSalesOrder(String salesOrderId) {
        Optional<SalesOrder> soOpt = salesOrderRepository.findById(salesOrderId);
        if (soOpt.isEmpty()) {
            return "Error: Sales Order ID " + salesOrderId + " not found.";
        }
        SalesOrder so = soOpt.get();
        if (!"Processing".equals(so.getStatus())) {
            return "Error: Sales Order is in " + so.getStatus() + " state. Can only dispatch orders in Processing state.";
        }
        
        // Stock validation and deduction
        for (SalesOrderItem item : so.getItems()) {
            Optional<InventoryItem> invOpt = inventoryItemRepository.findById(item.getItemId());
            if (invOpt.isEmpty() || invOpt.get().getQuantity() < item.getQuantity()) {
                return "Error: Insufficient stock for " + item.getName();
            }
        }

        so.setStatus("Shipped");
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
            }
        }

        // Outbound shipment cargo launch
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
        salesOrderRepository.save(so);

        // Blockchain audit
        blockchainService.addBlock(BlockData.builder()
                .action("SALES_ORDER_SHIPPED_BY_AGENT")
                .entityId(so.getId())
                .entityType("Order")
                .details(String.format("Sales Order '%s' dispatched from warehouse by SCM-AI Agent. Shipment tracking '%s' registered.", so.getSoNumber(), shipment.getShipmentNumber()))
                .operator("SCM_AI_AGENT")
                .trackingCode(so.getSoNumber())
                .build(), "SCM_AI_AGENT");

        return "Success: Sales Order " + so.getSoNumber() + " successfully dispatched. Outbound Shipment " + shipment.getShipmentNumber() + " created.";
    }

    @Tool("Receive a purchase order from a supplier and replenish inventory stocks.")
    public String receivePurchaseOrder(String purchaseOrderId) {
        Optional<PurchaseOrder> poOpt = purchaseOrderRepository.findById(purchaseOrderId);
        if (poOpt.isEmpty()) {
            return "Error: Purchase Order ID " + purchaseOrderId + " not found.";
        }

        PurchaseOrder po = poOpt.get();
        if ("Received".equals(po.getStatus())) {
            return "Error: Purchase Order " + po.getPoNumber() + " has already been received.";
        }

        po.setStatus("Received");

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
            });
        }

        // Update matching shipment
        List<Shipment> shipments = shipmentRepository.findAll();
        for (Shipment s : shipments) {
            if (po.getId().equals(s.getOrderId())) {
                s.setStatus("Delivered");
                s.setUpdatedAt(Instant.now().toString());
                shipmentRepository.save(s);
            }
        }

        purchaseOrderRepository.save(po);

        // Blockchain audit
        blockchainService.addBlock(BlockData.builder()
                .action("PO_RECEIVED_BY_AGENT")
                .entityId(po.getId())
                .entityType("Order")
                .details(String.format("Purchase Order '%s' marked as fully received and stocks replenished by SCM-AI Agent.", po.getPoNumber()))
                .operator("SCM_AI_AGENT")
                .trackingCode(po.getPoNumber())
                .build(), "SCM_AI_AGENT");

        return "Success: Purchase Order " + po.getPoNumber() + " received. Inventory stocks and warehouse storage capacity successfully updated.";
    }
}

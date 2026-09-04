package com.nexus.scm.service;

import com.nexus.scm.model.*;
import com.nexus.scm.repository.*;
import dev.langchain4j.rag.content.Content;
import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.rag.query.Query;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
public class ScmContentRetriever implements ContentRetriever {

    @Autowired private SupplierRepository supplierRepository;
    @Autowired private WarehouseRepository warehouseRepository;
    @Autowired private InventoryItemRepository inventoryItemRepository;
    @Autowired private PurchaseOrderRepository purchaseOrderRepository;
    @Autowired private SalesOrderRepository salesOrderRepository;
    @Autowired private ShipmentRepository shipmentRepository;

    @Override
    public List<Content> retrieve(Query query) {
        String text = query.text().toLowerCase();
        List<Content> results = new ArrayList<>();

        // Perform lightweight semantic matching (keyword filter) over repositories to find matching entities
        // Format matching entities as full text segments for the LLM context.
        
        // 1. Suppliers RAG
        List<Supplier> suppliers = supplierRepository.findAll();
        for (Supplier s : suppliers) {
            if (s.getName().toLowerCase().contains(text) || s.getLocation().toLowerCase().contains(text) || text.contains("supplier") || text.contains("vendor")) {
                results.add(Content.from(String.format("[RAG CONTEXT - SUPPLIER] Name: %s, Contact: %s, Email: %s, Location: %s, Rating: %.1f, Status: %s",
                        s.getName(), s.getContactName(), s.getEmail(), s.getLocation(), s.getRating(), s.getStatus())));
            }
        }

        // 2. Warehouses RAG
        List<Warehouse> warehouses = warehouseRepository.findAll();
        for (Warehouse w : warehouses) {
            if (w.getName().toLowerCase().contains(text) || w.getLocation().toLowerCase().contains(text) || text.contains("warehouse") || text.contains("storage")) {
                results.add(Content.from(String.format("[RAG CONTEXT - WAREHOUSE] Name: %s, Location: %s, Capacity: %d, Used: %d, Manager: %s, Status: %s",
                        w.getName(), w.getLocation(), w.getCapacity(), w.getUsedCapacity(), w.getManagerName(), w.getStatus())));
            }
        }

        // 3. Inventory RAG
        List<InventoryItem> items = inventoryItemRepository.findAll();
        for (InventoryItem i : items) {
            if (i.getName().toLowerCase().contains(text) || i.getSku().toLowerCase().contains(text) || text.contains("inventory") || text.contains("stock") || text.contains("sku")) {
                results.add(Content.from(String.format("[RAG CONTEXT - INVENTORY ITEM] SKU: %s, Name: %s, Category: %s, Quantity: %d %s, Reorder Point: %d, Unit Price: $%.2f",
                        i.getSku(), i.getName(), i.getCategory(), i.getQuantity(), i.getUnit(), i.getReorderPoint(), i.getUnitPrice())));
            }
        }

        // 4. Orders & Shipments RAG
        if (text.contains("order") || text.contains("po-") || text.contains("so-") || text.contains("shipment") || text.contains("carrier") || text.contains("tracking")) {
            List<PurchaseOrder> pos = purchaseOrderRepository.findAll();
            for (PurchaseOrder po : pos) {
                results.add(Content.from(String.format("[RAG CONTEXT - PURCHASE ORDER] ID: %s, PO Number: %s, Supplier: %s, Status: %s, Total: $%.2f, Expected: %s",
                        po.getId(), po.getPoNumber(), po.getSupplierName(), po.getStatus(), po.getTotalAmount(), po.getExpectedDeliveryDate())));
            }
            List<SalesOrder> sos = salesOrderRepository.findAll();
            for (SalesOrder so : sos) {
                results.add(Content.from(String.format("[RAG CONTEXT - SALES ORDER] ID: %s, SO Number: %s, Customer: %s, Status: %s, Total: $%.2f, Date: %s",
                        so.getId(), so.getSoNumber(), so.getCustomerName(), so.getStatus(), so.getTotalAmount(), so.getOrderDate())));
            }
            List<Shipment> shipments = shipmentRepository.findAll();
            for (Shipment s : shipments) {
                results.add(Content.from(String.format("[RAG CONTEXT - SHIPMENT] ID: %s, Number: %s, Origin: %s, Destination: %s, Carrier: %s, Tracking: %s, Status: %s, Temp: %.1f, Humidity: %.1f",
                        s.getId(), s.getShipmentNumber(), s.getOrigin(), s.getDestination(), s.getCarrier(), s.getTrackingNumber(), s.getStatus(), s.getCurrentTemp(), s.getCurrentHumidity())));
            }
        }

        // If results empty, return a general system overview as RAG backup
        if (results.isEmpty()) {
            results.add(Content.from(String.format("[RAG CONTEXT - GENERAL SYSTEM INFO] Total Suppliers: %d, Total Warehouses: %d, Total Inventory Types: %d, UTC Time: %s",
                    suppliers.size(), warehouses.size(), items.size(), Instant.now().toString())));
        }

        return results;
    }
}

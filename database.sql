-- 1. Database Creation
CREATE DATABASE IF NOT EXISTS supply_chain_db;
USE supply_chain_db;

-- 2. Drop existing tables if they exist to allow clean creation (in reverse dependency order)
DROP TABLE IF EXISTS blockchain_blocks;
DROP TABLE IF EXISTS sensor_readings;
DROP TABLE IF EXISTS shipments;
DROP TABLE IF EXISTS sales_order_items;
DROP TABLE IF EXISTS sales_orders;
DROP TABLE IF EXISTS purchase_order_items;
DROP TABLE IF EXISTS purchase_orders;
DROP TABLE IF EXISTS inventory_items;
DROP TABLE IF EXISTS warehouses;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS users;

-- 3. Table Definitions

-- Users Table
CREATE TABLE users (
    user_id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Suppliers Table
CREATE TABLE suppliers (
    supplier_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    location VARCHAR(255),
    rating DECIMAL(3, 2),
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (updated_by) REFERENCES users(user_id)
);

-- Customers Table
CREATE TABLE customers (
    customer_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    location VARCHAR(255),
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    total_orders_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (updated_by) REFERENCES users(user_id)
);

-- Warehouses Table
CREATE TABLE warehouses (
    warehouse_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    capacity INT NOT NULL,
    used_capacity INT DEFAULT 0,
    manager_name VARCHAR(255),
    status ENUM('Active', 'Maintenance') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (updated_by) REFERENCES users(user_id)
);

-- Inventory Items Table
CREATE TABLE inventory_items (
    item_id VARCHAR(50) PRIMARY KEY,
    warehouse_id VARCHAR(50) NOT NULL,
    supplier_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(100),
    quantity INT NOT NULL DEFAULT 0,
    unit VARCHAR(50),
    reorder_point INT DEFAULT 0,
    unit_price DECIMAL(15, 2) NOT NULL,
    barcode VARCHAR(255),
    batch_number VARCHAR(100),
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(warehouse_id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (updated_by) REFERENCES users(user_id)
);

-- Purchase Orders Table
CREATE TABLE purchase_orders (
    po_id VARCHAR(50) PRIMARY KEY,
    po_number VARCHAR(100) NOT NULL UNIQUE,
    supplier_id VARCHAR(50) NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    status ENUM('Draft', 'Sent', 'Received', 'Cancelled') DEFAULT 'Draft',
    payment_status ENUM('Pending', 'Paid') DEFAULT 'Pending',
    invoice_id VARCHAR(100),
    order_date DATETIME NOT NULL,
    expected_delivery_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (updated_by) REFERENCES users(user_id)
);

-- Purchase Order Items Table
CREATE TABLE purchase_order_items (
    po_item_id VARCHAR(50) PRIMARY KEY,
    po_id VARCHAR(50) NOT NULL,
    item_id VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (po_id) REFERENCES purchase_orders(po_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES inventory_items(item_id)
);

-- Sales Orders Table
CREATE TABLE sales_orders (
    so_id VARCHAR(50) PRIMARY KEY,
    so_number VARCHAR(100) NOT NULL UNIQUE,
    customer_id VARCHAR(50) NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    status ENUM('Draft', 'Processing', 'Shipped', 'Completed', 'Cancelled') DEFAULT 'Draft',
    payment_status ENUM('Pending', 'Paid') DEFAULT 'Pending',
    invoice_id VARCHAR(100),
    order_date DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (updated_by) REFERENCES users(user_id)
);

-- Sales Order Items Table
CREATE TABLE sales_order_items (
    so_item_id VARCHAR(50) PRIMARY KEY,
    so_id VARCHAR(50) NOT NULL,
    item_id VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (so_id) REFERENCES sales_orders(so_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES inventory_items(item_id)
);

-- Shipments Table
CREATE TABLE shipments (
    shipment_id VARCHAR(50) PRIMARY KEY,
    shipment_number VARCHAR(100) NOT NULL UNIQUE,
    order_type ENUM('Purchase', 'Sales') NOT NULL,
    order_id VARCHAR(50) NOT NULL, -- Logical foreign key
    origin VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    carrier VARCHAR(255),
    tracking_number VARCHAR(100),
    status ENUM('Pending', 'In Transit', 'Delivered', 'Delayed') DEFAULT 'Pending',
    current_temp DECIMAL(5, 2),
    current_humidity DECIMAL(5, 2),
    current_g_force DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    updated_by VARCHAR(50),
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    FOREIGN KEY (updated_by) REFERENCES users(user_id)
);

-- Sensor Readings Table
CREATE TABLE sensor_readings (
    reading_id VARCHAR(50) PRIMARY KEY,
    shipment_id VARCHAR(50) NOT NULL,
    timestamp DATETIME NOT NULL,
    temp DECIMAL(5, 2),
    humidity DECIMAL(5, 2),
    g_force DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shipment_id) REFERENCES shipments(shipment_id) ON DELETE CASCADE
);

-- Blockchain Blocks (Ledger) Table
CREATE TABLE blockchain_blocks (
    block_index INT PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    details TEXT,
    operator VARCHAR(100),
    tracking_code VARCHAR(100),
    previous_hash VARCHAR(64) NOT NULL,
    hash VARCHAR(64) NOT NULL,
    signature VARCHAR(100) NOT NULL,
    eth_tx_hash VARCHAR(66),
    eth_contract_address VARCHAR(42),
    eth_block_number VARCHAR(50),
    eth_network VARCHAR(50),
    eth_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Indexes
CREATE INDEX idx_inventory_sku ON inventory_items(sku);
CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_so_customer ON sales_orders(customer_id);
CREATE INDEX idx_shipments_order ON shipments(order_id);
CREATE INDEX idx_sensor_readings_shipment ON sensor_readings(shipment_id);

-- 5. Sample Data Insertion

-- Users
INSERT INTO users (user_id, username, email, password_hash, role) VALUES 
('usr-1', 'admin', 'admin@nexus-scm.com', 'hashed_pass_1', 'Admin'),
('usr-2', 'manager', 'manager@nexus-scm.com', 'hashed_pass_2', 'Warehouse Manager');

-- Suppliers
INSERT INTO suppliers (supplier_id, name, contact_name, email, phone, location, rating, created_by) VALUES
('sup-1', 'Zenith Electronics Corp', 'Sarah Jenkins', 'sjenkins@zenithelectronics.com', '+1-555-0128', 'Silicon Valley, CA', 4.8, 'usr-1'),
('sup-2', 'Apex Logistics & Tech', 'Marcus Vance', 'm.vance@apexlogistics.com', '+1-555-0199', 'Chicago, IL', 4.5, 'usr-1');

-- Customers
INSERT INTO customers (customer_id, name, contact_name, email, phone, location, total_orders_count, created_by) VALUES
('cust-1', 'MegaTech Systems Inc', 'Amanda Ross', 'aross@megatech.com', '+1-555-0147', 'Austin, TX', 24, 'usr-1'),
('cust-2', 'Quantum Dynamics Ltd', 'Brian Foster', 'bfoster@quantumdynamics.io', '+1-555-0182', 'Seattle, WA', 12, 'usr-1');

-- Warehouses
INSERT INTO warehouses (warehouse_id, name, location, capacity, used_capacity, manager_name, created_by) VALUES
('wh-1', 'Central Storage Hub Alpha', 'Chicago, IL', 50000, 14200, 'Robert Carter', 'usr-1'),
('wh-2', 'West Coast Distribution Center', 'Los Angeles, CA', 35000, 28000, 'Linda Chen', 'usr-1');

-- Inventory
INSERT INTO inventory_items (item_id, warehouse_id, supplier_id, name, sku, category, quantity, unit, reorder_point, unit_price, barcode, batch_number, expiry_date, created_by) VALUES
('inv-1', 'wh-1', 'sup-1', 'High-Density Lithium Core', 'SKU-LI-9941', 'Electronics', 12400, 'Units', 2000, 124.50, 'BC-LI-9941', 'BCH-2026-A1', '2028-12-31', 'usr-1'),
('inv-2', 'wh-1', 'sup-2', 'Optical Sensor Module V3', 'SKU-OPT-8812', 'Sensors', 850, 'Units', 1000, 345.00, 'BC-OPT-8812', 'BCH-2026-A2', '2030-05-15', 'usr-1');

-- Purchase Orders
INSERT INTO purchase_orders (po_id, po_number, supplier_id, total_amount, status, payment_status, order_date, expected_delivery_date, created_by) VALUES
('po-1', 'PO-2026-001', 'sup-2', 51750.00, 'Received', 'Paid', '2026-06-15 09:30:00', '2026-07-01 14:00:00', 'usr-1');

-- Purchase Order Items
INSERT INTO purchase_order_items (po_item_id, po_id, item_id, quantity, price) VALUES
('poi-1', 'po-1', 'inv-2', 150, 345.00);

-- Sales Orders
INSERT INTO sales_orders (so_id, so_number, customer_id, total_amount, status, payment_status, order_date, created_by) VALUES
('so-1', 'SO-2026-001', 'cust-1', 62250.00, 'Shipped', 'Pending', '2026-07-02 10:45:00', 'usr-1');

-- Sales Order Items
INSERT INTO sales_order_items (so_item_id, so_id, item_id, quantity, price) VALUES
('soi-1', 'so-1', 'inv-1', 500, 124.50);

-- Shipments
INSERT INTO shipments (shipment_id, shipment_number, order_type, order_id, origin, destination, carrier, tracking_number, status, current_temp, current_humidity, current_g_force, created_by) VALUES
('ship-1', 'SH-2026-101', 'Sales', 'so-1', 'Chicago, IL', 'Austin, TX', 'FedEx Freight', 'TRK-FED-551229', 'In Transit', 22.1, 50.8, 1.15, 'usr-1');

-- Sensor Readings
INSERT INTO sensor_readings (reading_id, shipment_id, timestamp, temp, humidity, g_force) VALUES
('sr-1', 'ship-1', '2026-07-02 15:00:00', 21.0, 48.5, 1.00),
('sr-2', 'ship-1', '2026-07-03 15:00:00', 22.1, 50.8, 1.15);

-- Blockchain Blocks
INSERT INTO blockchain_blocks (block_index, timestamp, action, entity_id, entity_type, details, operator, previous_hash, hash, signature) VALUES
(0, '2026-06-01 00:00:00', 'GENESIS', 'chain-init', 'Order', 'Supply Chain Blockchain Ledger Initialized.', 'SYSTEM_ADMIN', '0', 'GENESIS_HASH', 'GENESIS_SIG'),
(1, '2026-07-02 10:45:00', 'SALES_ORDER_CREATED', 'so-1', 'Order', 'Sales Order SO-2026-001 Created.', 'admin', 'GENESIS_HASH', 'BLOCK_1_HASH', 'BLOCK_1_SIG');

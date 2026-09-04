# Nexus Ledger - Standalone AI Blockchain Supply Chain Ledger
### Ready-to-Submit Full-Stack Project

This directory contains the lightweight, production-ready, fully-functional full-stack submission package.

---

## 📂 Submission Files Included

1. **`ScmApplication.java`**: The complete backend server coded in a single self-contained Spring Boot file. It handles blockchain data structures, provides cryptographic hashing algorithms, supports custom events, and serves cross-origin REST APIs.
2. **`index.html`**: A gorgeous, interactive web dashboard featuring high-contrast Tailwind styling, dynamic API integration, full blockchain integrity verification, sample KPI injectors, and an interactive simulated AI chatbot assistant.
3. **`README.md`**: This guide with clear, step-by-step instructions to run the project.

---

## 🛠️ API Enpoint Reference

* **`GET /status`**: Pulls dashboard KPIs including block volume, node health, and the latest block details.
* **`GET /chain`**: Pulls the full list of cryptographic block nodes currently registered on the ledger.
* **`POST /addBlock`**: Appends a new block. Accepts a JSON payload containing SCM logistics actions:
  ```json
  {
    "data": "Shipment Batch #1094 reached Chicago Warehouse Hub safely"
  }
  ```

---

## 🚀 Execution Instructions

### Step 1: Run the Spring Boot Backend

You can easily run this single-file Spring Boot application using Maven or your favorite IDE (IntelliJ IDEA, Eclipse, VS Code).

#### Option A: Using Maven (Standard)
1. Ensure you have **JDK 17 or 21** and **Maven** installed.
2. Place `ScmApplication.java` inside your Spring Boot project structure (under `src/main/java/com/nexus/scm/`).
3. Make sure your `pom.xml` contains the web starter dependency:
   ```xml
   <dependency>
       <groupId>org.springframework.boot</groupId>
       <artifactId>spring-boot-starter-web</artifactId>
   </dependency>
   ```
4. Run the application from your terminal:
   ```bash
   mvn spring-boot:run
   ```
5. The application will boot up at **`http://localhost:8080`**.

#### Option B: Direct Single-File Execution
If you have Java 11+ and have Spring Boot dependencies on your system classpath, you can launch the program directly:
```bash
java ScmApplication.java
```

---

### Step 2: Open the Dashboard Frontend

1. Simply double-click on **`index.html`** or open it inside any modern web browser (Chrome, Safari, Firefox, Edge).
2. **No server, Node.js, or npm dependencies are required to run the frontend!** It runs directly out of your browser.
3. The dashboard is configured to connect to **`http://localhost:8080`** by default. You can change this address live directly in the input box on the top right of the page if your local port differs.

---

## 💎 Features & Interactive Guide

* **`Sync Node`**: Connects immediately to your backend to pull real-time block metrics and general server KPIs. If the backend is not yet running, it gracefully falls back with clear help messages.
* **`Publish Cryptographic Block`**: Type custom text or click **`Insert Sample KPI`** to generate real supply chain logs. Click publish to send the record to the backend ledger. It will instantly re-fetch, auto-update all statistics, and append the block to the visual ledger feed.
* **`Verify Blockchain`**: Executes a sequential cryptographic check. The frontend will traverse the entire blockchain array and verify that `block[i].previousHash` matches exactly with `block[i-1].hash`. Shows a beautiful **Verified** checkmark on success.
* **`Interactive AI Logistics Chat`**: Chat live with the simulated intelligence system! Ask questions about the ledger health, sensors, or routing alerts, and watch the AI process the context and respond with professional, real-time logistics analytics.

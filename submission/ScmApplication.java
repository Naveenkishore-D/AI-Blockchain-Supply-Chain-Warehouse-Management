package com.nexus.scm;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * AI Blockchain Supply Chain Ledger - Standalone Single-File Backend
 * Ready for submission and local deployment.
 */
@SpringBootApplication
@RestController
@CrossOrigin(origins = "*") // Enables easy local cross-origin request testing
public class ScmApplication {

    // Simple in-memory blockchain storage
    private static final List<Block> blockchain = new ArrayList<>();

    static {
        // Initialize with Genesis block
        blockchain.add(new Block(0, "Genesis Block - Supply Chain Ledger Initialized", "0"));
        blockchain.add(new Block(1, "Batch #1042 Pharmaceutical Temp Monitor: 4.2C at Hub-Chicago", blockchain.get(0).getHash()));
        blockchain.add(new Block(2, "Route Optimization Executed for Cargo ID #772 - Saved 2.1 Hours", blockchain.get(1).getHash()));
    }

    public static void main(String[] args) {
        SpringApplication.run(ScmApplication.class, args);
    }

    // 1. GET /chain -> Returns the full blockchain ledger
    @GetMapping("/chain")
    public List<Block> getChain() {
        return blockchain;
    }

    // 2. POST /addBlock -> Adds a new block to the ledger
    @PostMapping("/addBlock")
    public Block addBlock(@RequestBody Map<String, String> payload) {
        String data = payload.getOrDefault("data", "Generic Supply Chain Event");
        Block lastBlock = blockchain.get(blockchain.size() - 1);
        Block newBlock = new Block(blockchain.size(), data, lastBlock.getHash());
        blockchain.add(newBlock);
        return newBlock;
    }

    // 3. GET /status -> Returns current dashboard status
    @GetMapping("/status")
    public Map<String, Object> getStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("totalBlocks", blockchain.size());
        status.put("status", "Active");
        status.put("lastBlock", blockchain.get(blockchain.size() - 1));
        status.put("timestamp", new Date().toString());
        
        // Mocking logistics KPIs to provide a rich dynamic visual dashboard
        status.put("activeShipments", 18);
        status.put("inventoryShortages", 2);
        status.put("systemHealth", "Optimal (99.8% SCM Node Uptime)");
        status.put("unverifiedBlocks", 0);
        return status;
    }

    // Cryptographic Block representation
    public static class Block {
        private int index;
        private long timestamp;
        private String data;
        private String hash;
        private String previousHash;

        public Block() {}

        public Block(int index, String data, String previousHash) {
            this.index = index;
            this.timestamp = System.currentTimeMillis();
            this.data = data;
            this.previousHash = previousHash;
            this.hash = calculateHash();
        }

        public String calculateHash() {
            String input = index + Long.toString(timestamp) + data + previousHash;
            try {
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                byte[] hashBytes = digest.digest(input.getBytes(StandardCharsets.UTF_8));
                StringBuilder hexString = new StringBuilder();
                for (byte b : hashBytes) {
                    String hex = Integer.toHexString(0xff & b);
                    if (hex.length() == 1) hexString.append('0');
                    hexString.append(hex);
                }
                return hexString.toString();
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }

        // Getters and Setters
        public int getIndex() { return index; }
        public void setIndex(int index) { this.index = index; }

        public long getTimestamp() { return timestamp; }
        public void setTimestamp(long timestamp) { this.timestamp = timestamp; }

        public String getData() { return data; }
        public void setData(String data) { this.data = data; }

        public String getHash() { return hash; }
        public void setHash(String hash) { this.hash = hash; }

        public String getPreviousHash() { return previousHash; }
        public void setPreviousHash(String previousHash) { this.previousHash = previousHash; }
    }
}

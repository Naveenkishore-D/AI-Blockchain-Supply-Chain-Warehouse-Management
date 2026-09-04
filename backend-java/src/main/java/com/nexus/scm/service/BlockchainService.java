package com.nexus.scm.service;

import com.nexus.scm.model.BlockchainBlock;
import com.nexus.scm.model.BlockData;
import com.nexus.scm.repository.BlockchainBlockRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;
import java.util.List;

@Service
public class BlockchainService {

    @Autowired
    private BlockchainBlockRepository blockRepository;

    @Autowired
    private Web3jService web3jService;

    private static final String SECRET_SIGNING_SALT = "NEXUS_LEDGER_SALT_2026";

    // SHA-256 Hashing of blocks
    public String calculateBlockHash(Integer index, String timestamp, BlockData data, String previousHash) {
        try {
            String dataStr = data != null ? (data.getAction() + data.getEntityId() + data.getDetails()) : "";
            String rawStr = index + timestamp + dataStr + previousHash;
            
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(rawStr.getBytes(StandardCharsets.UTF_8));
            
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hex.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }

    // HMAC/Digital Signature simulation
    public String generateBlockSignature(String hash) {
        try {
            String signedPayload = hash + SECRET_SIGNING_SALT;
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] sigBytes = digest.digest(signedPayload.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(sigBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }

    // Append new block to database
    public BlockchainBlock addBlock(BlockData data, String operator) {
        List<BlockchainBlock> chain = blockRepository.findAll();
        
        Integer nextIndex = 1;
        String previousHash = "0";
        if (!chain.isEmpty()) {
            BlockchainBlock lastBlock = chain.get(chain.size() - 1);
            nextIndex = lastBlock.getIndex() + 1;
            previousHash = lastBlock.getHash();
        }

        String timestamp = Instant.now().toString();
        String hash = calculateBlockHash(nextIndex, timestamp, data, previousHash);
        String signature = generateBlockSignature(hash);

        BlockchainBlock newBlock = BlockchainBlock.builder()
                .index(nextIndex)
                .timestamp(timestamp)
                .data(data)
                .previousHash(previousHash)
                .hash(hash)
                .signature(signature)
                .build();

        // Write audit log to Ethereum smart contract via Web3j
        try {
            java.util.Map<String, String> receipt = web3jService.recordBlockOnChain(
                    nextIndex,
                    timestamp,
                    data != null ? data.getAction() : "GENERIC_EVENT",
                    data != null ? data.getEntityId() : "",
                    data != null ? data.getDetails() : "",
                    operator != null ? operator : "SYSTEM",
                    hash
            );
            
            newBlock.setEthTxHash(receipt.get("txHash"));
            newBlock.setEthContractAddress(receipt.get("contractAddress"));
            newBlock.setEthBlockNumber(receipt.get("blockNumber"));
            newBlock.setEthNetwork(receipt.get("network"));
            newBlock.setEthStatus(receipt.get("status"));
        } catch (Exception e) {
            newBlock.setEthStatus("ERROR_ON_CHAIN_WRITE");
        }

        return blockRepository.save(newBlock);
    }
}

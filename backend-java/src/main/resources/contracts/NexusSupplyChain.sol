// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title NexusSupplyChain
 * @dev Immutable ledger for auditing supply chain events with role-based validation.
 */
contract NexusSupplyChain {
    
    struct BlockRecord {
        uint256 index;
        string timestamp;
        string action;
        string entityId;
        string details;
        string operator;
        string blockHash;
    }

    address public owner;
    uint256 public totalBlocks;
    
    // Index mapping to BlockRecord
    mapping(uint256 => BlockRecord) private ledger;
    
    // Hash mapping to verify block inclusion
    mapping(string => bool) private registeredHashes;

    event BlockRecorded(
        uint256 indexed index,
        string action,
        string entityId,
        string operator,
        string blockHash
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the authorized owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        totalBlocks = 0;
    }

    /**
     * @dev Record a new supply chain block audit log to the ledger
     */
    function recordBlock(
        uint256 _index,
        string calldata _timestamp,
        string calldata _action,
        string calldata _entityId,
        string calldata _details,
        string calldata _operator,
        string calldata _blockHash
    ) external onlyOwner returns (bool) {
        require(!registeredHashes[_blockHash], "Block hash already exists on-chain");
        
        ledger[_index] = BlockRecord({
            index: _index,
            timestamp: _timestamp,
            action: _action,
            entityId: _entityId,
            details: _details,
            operator: _operator,
            blockHash: _blockHash
        });

        registeredHashes[_blockHash] = true;
        totalBlocks++;

        emit BlockRecorded(_index, _action, _entityId, _operator, _blockHash);
        return true;
    }

    /**
     * @dev Retrieve block data from the immutable ledger
     */
    function getBlock(uint256 _index) external view returns (
        uint256 index,
        string memory timestamp,
        string memory action,
        string memory entityId,
        string memory details,
        string memory operator,
        string memory blockHash
    ) {
        BlockRecord memory record = ledger[_index];
        require(bytes(record.blockHash).length > 0, "Block record does not exist");
        return (
            record.index,
            record.timestamp,
            record.action,
            record.entityId,
            record.details,
            record.operator,
            record.blockHash
        );
    }

    /**
     * @dev Check if a block hash is verified on-chain
     */
    function isHashRegistered(string calldata _blockHash) external view returns (bool) {
        return registeredHashes[_blockHash];
    }
}

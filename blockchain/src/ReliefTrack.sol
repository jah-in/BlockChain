// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ReliefTrack {
    // The wallet that deployed the contract
    address public owner;

    // Authorized ReliefTrack administrators
    mapping(address => bool) public admins;

    struct Distribution {
        string distributionId;
        string warehouseId;
        string item;
        uint256 quantity;
        string unit;
        string destination;
        uint256 timestamp;
        address recordedBy;
    }

    // Distribution ID => Distribution record
    mapping(string => Distribution) private distributions;

    // Events allow the frontend to detect blockchain activity
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);

    event DistributionRecorded(
        string indexed distributionId,
        string warehouseId,
        string item,
        uint256 quantity,
        string unit,
        string destination,
        uint256 timestamp,
        address indexed recordedBy
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    modifier onlyAdmin() {
        require(admins[msg.sender], "Not an authorized admin");
        _;
    }

    constructor() {
        owner = msg.sender;
        admins[msg.sender] = true;

        emit AdminAdded(msg.sender);
    }

    function addAdmin(address admin) external onlyOwner {
        require(admin != address(0), "Invalid admin address");
        require(!admins[admin], "Already an admin");

        admins[admin] = true;

        emit AdminAdded(admin);
    }

    function removeAdmin(address admin) external onlyOwner {
        require(admin != owner, "Owner cannot be removed");

        require(admins[admin], "Not an admin");

        admins[admin] = false;

        emit AdminRemoved(admin);
    }

    function recordDistribution(
        string calldata distributionId,
        string calldata warehouseId,
        string calldata item,
        uint256 quantity,
        string calldata unit,
        string calldata destination
    ) external onlyAdmin {
        require(bytes(distributionId).length > 0, "Distribution ID required");
        require(bytes(warehouseId).length > 0, "Warehouse ID required");
        require(bytes(item).length > 0, "Item required");
        require(quantity > 0, "Quantity must be greater than zero");
        require(bytes(unit).length > 0, "Unit required");
        require(bytes(destination).length > 0, "Destination required");

        require(
            distributions[distributionId].timestamp == 0,
            "Distribution already exists"
        );

        distributions[distributionId] = Distribution({
            distributionId: distributionId,
            warehouseId: warehouseId,
            item: item,
            quantity: quantity,
            unit: unit,
            destination: destination,
            timestamp: block.timestamp,
            recordedBy: msg.sender
        });

        emit DistributionRecorded(
            distributionId,
            warehouseId,
            item,
            quantity,
            unit,
            destination,
            block.timestamp,
            msg.sender
        );
    }

    function getDistribution(
        string calldata distributionId
    )
        external
        view
        returns (
            string memory,
            string memory,
            string memory,
            uint256,
            string memory,
            string memory,
            uint256,
            address
        )
    {
        require(
            distributions[distributionId].timestamp != 0,
            "Distribution not found"
        );

        Distribution memory distribution = distributions[distributionId];

        return (
            distribution.distributionId,
            distribution.warehouseId,
            distribution.item,
            distribution.quantity,
            distribution.unit,
            distribution.destination,
            distribution.timestamp,
            distribution.recordedBy
        );
    }

    function isAdmin(address account) external view returns (bool) {
        return admins[account];
    }
}
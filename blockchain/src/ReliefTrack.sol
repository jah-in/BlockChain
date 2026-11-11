// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ReliefTrack {
    // The wallet that deployed the contract.
    // This is the only administrator.
    address public owner;

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

    constructor() {
        owner = msg.sender;
    }

    function recordDistribution(
        string calldata distributionId,
        string calldata warehouseId,
        string calldata item,
        uint256 quantity,
        string calldata unit,
        string calldata destination
    ) external onlyOwner {
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
}
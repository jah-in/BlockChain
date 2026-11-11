 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ReliefTrack} from "../src/ReliefTrack.sol";

contract ReliefTrackTest is Test {
    ReliefTrack reliefTrack;
    address owner = address(this);
    address otherUser = address(0x1234);

    function setUp() public {
        reliefTrack = new ReliefTrack();
    }

    function testOwnerIsDeployer() public {
        assertEq(reliefTrack.owner(), owner);
    }

    function testOwnerCanRecordDistribution() public {
        reliefTrack.recordDistribution(
            "DIST-001",
            "WH-001",
            "Rice",
            2000,
            "kg",
            "Bongao"
        );

        (
            string memory distributionId,
            string memory warehouseId,
            string memory item,
            uint256 quantity,
            string memory unit,
            string memory destination,
            uint256 timestamp,
            address recordedBy
        ) = reliefTrack.getDistribution("DIST-001");

        assertEq(distributionId, "DIST-001");
        assertEq(warehouseId, "WH-001");
        assertEq(item, "Rice");
        assertEq(quantity, 2000);
        assertEq(unit, "kg");
        assertEq(destination, "Bongao");
        assertGt(timestamp, 0);
        assertEq(recordedBy, owner);
    }

    function testNonOwnerCannotRecordDistribution() public {
        vm.prank(otherUser);

        vm.expectRevert("Only owner can perform this action");

        reliefTrack.recordDistribution(
            "DIST-002",
            "WH-001",
            "Rice",
            1000,
            "kg",
            "Bongao"
        );
    }

    function testCannotRecordDuplicateDistribution() public {
        reliefTrack.recordDistribution(
            "DIST-001",
            "WH-001",
            "Rice",
            2000,
            "kg",
            "Bongao"
        );

        vm.expectRevert("Distribution already exists");

        reliefTrack.recordDistribution(
            "DIST-001",
            "WH-002",
            "Water",
            500,
            "boxes",
            "Bongao"
        );
    }
}
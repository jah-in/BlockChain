// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ReliefTrack} from "../src/ReliefTrack.sol";

contract ReliefTrackTest is Test {
    ReliefTrack reliefTrack;

    address owner = address(1);
    address secondAdmin = address(2);
    address unauthorizedUser = address(3);

    function setUp() public {
        // Deploy the contract as the owner
        vm.prank(owner);
        reliefTrack = new ReliefTrack();
    }

    function testOwnerIsAdmin() public view {
        assertEq(reliefTrack.owner(), owner);
        assertTrue(reliefTrack.isAdmin(owner));
    }

    function testAddAdmin() public {
        vm.prank(owner);

        reliefTrack.addAdmin(secondAdmin);

        assertTrue(reliefTrack.isAdmin(secondAdmin));
    }

    function testRemoveAdmin() public {
        vm.startPrank(owner);

        reliefTrack.addAdmin(secondAdmin);
        reliefTrack.removeAdmin(secondAdmin);

        vm.stopPrank();

        assertFalse(reliefTrack.isAdmin(secondAdmin));
    }

    function testAdminCanRecordDistribution() public {
        vm.prank(owner);

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

    function testUnauthorizedUserCannotRecordDistribution() public {
        vm.prank(unauthorizedUser);

        vm.expectRevert("Not an authorized admin");

        reliefTrack.recordDistribution(
            "DIST-002",
            "WH-001",
            "Water",
            1000,
            "liters",
            "Bongao"
        );
    }

    function testDuplicateDistributionCannotBeRecorded() public {
        vm.startPrank(owner);

        reliefTrack.recordDistribution(
            "DIST-003",
            "WH-001",
            "Rice",
            1000,
            "kg",
            "Bongao"
        );

        vm.expectRevert("Distribution already exists");

        reliefTrack.recordDistribution(
            "DIST-003",
            "WH-002",
            "Water",
            500,
            "liters",
            "Bongao"
        );

        vm.stopPrank();
    }

    function testZeroQuantityIsRejected() public {
        vm.prank(owner);

        vm.expectRevert("Quantity must be greater than zero");

        reliefTrack.recordDistribution(
            "DIST-004",
            "WH-001",
            "Rice",
            0,
            "kg",
            "Bongao"
        );
    }

    function testNonOwnerCannotAddAdmin() public {
        vm.prank(unauthorizedUser);

        vm.expectRevert("Only owner can perform this action");

        reliefTrack.addAdmin(secondAdmin);
    }

    function testNonOwnerCannotRemoveAdmin() public {
        vm.prank(owner);
        reliefTrack.addAdmin(secondAdmin);

        vm.prank(unauthorizedUser);

        vm.expectRevert("Only owner can perform this action");

        reliefTrack.removeAdmin(secondAdmin);
    }
}
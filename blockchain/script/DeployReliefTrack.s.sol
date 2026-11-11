// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {ReliefTrack} from "../src/ReliefTrack.sol";

contract DeployReliefTrack is Script {
    function run() external returns (ReliefTrack) {
        vm.startBroadcast();

        ReliefTrack reliefTrack = new ReliefTrack();

        vm.stopBroadcast();

        return reliefTrack;
    }
}

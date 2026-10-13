// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";

contract Deploy is Script {
    function run() external returns (AgentRegistry registry) {
        vm.startBroadcast();
        registry = new AgentRegistry();
        vm.stopBroadcast();

        console.log("AgentRegistry deployed at:", address(registry));
    }
}

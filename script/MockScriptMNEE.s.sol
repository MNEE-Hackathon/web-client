// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../test/mock/MNEEMock.sol";

contract DeployMNEEToken is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Initial supply: 1,000,000 MNEE (18 decimals)
        uint256 initialSupply = 1_000_000 * 1e18;

        vm.startBroadcast(deployerPrivateKey);

        MNEEToken token = new MNEEToken(initialSupply);

        vm.stopBroadcast();

        console2.log("MNEE Token deployed at:", address(token));
        console2.log("Initial supply:", token.totalSupply());
        console2.log("Owner:", token.owner());
    }
}

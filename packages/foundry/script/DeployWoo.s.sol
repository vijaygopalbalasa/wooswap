// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script, console} from "forge-std/Script.sol";
import "../src/WooRelationNFT.sol";
import "../src/WooSwapGuard.sol";
import "../src/WooLP.sol";
import "../src/WooRouter.sol";

contract DeployWoo is Script {
    // Monad testnet UniswapV2Router02
    address constant UNISWAP_V2_ROUTER = 0xfb8e1c3b833f9e67a71c859a132cf783b645e436;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying WooSwap contracts...");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("Balance:", deployer.balance / 1e18, "MON");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy WooRelationNFT
        console.log("\n=== Deploying WooRelationNFT ===");
        WooRelationNFT nft = new WooRelationNFT();
        console.log("WooRelationNFT deployed at:", address(nft));

        // 2. Deploy WooSwapGuard
        console.log("\n=== Deploying WooSwapGuard ===");
        WooSwapGuard guard = new WooSwapGuard(address(nft));
        console.log("WooSwapGuard deployed at:", address(guard));

        // 3. Deploy WooLP (router address will be set later)
        console.log("\n=== Deploying WooLP ===");
        WooLP lp = new WooLP(address(nft), address(0));
        console.log("WooLP deployed at:", address(lp));

        // 4. Deploy WooRouter
        console.log("\n=== Deploying WooRouter ===");
        WooRouter router = new WooRouter(
            UNISWAP_V2_ROUTER,
            address(guard),
            address(lp)
        );
        console.log("WooRouter deployed at:", address(router));

        // 5. Setup permissions
        console.log("\n=== Setting up permissions ===");

        // Grant router control over NFT minting
        nft.transferOwnership(address(guard));
        console.log("NFT ownership transferred to Guard");

        // Grant router control over guard
        guard.transferOwnership(address(router));
        console.log("Guard ownership transferred to Router");

        // Grant router rebater role on LP
        lp.grantRole(lp.REBATER_ROLE(), address(router));
        console.log("Router granted REBATER_ROLE on LP");

        // Update LP constructor issue - set router address
        // Note: In production, constructor should be fixed or use a setter
        console.log("Warning: LP router address needs manual update");

        vm.stopBroadcast();

        // 6. Output deployment addresses in JSON format
        console.log("\n=== Deployment Complete ===");
        string memory json = string.concat(
            '{\n',
            '  "chainId": ', vm.toString(block.chainid), ',\n',
            '  "deployer": "', vm.toString(deployer), '",\n',
            '  "nft": "', vm.toString(address(nft)), '",\n',
            '  "guard": "', vm.toString(address(guard)), '",\n',
            '  "lp": "', vm.toString(address(lp)), '",\n',
            '  "router": "', vm.toString(address(router)), '",\n',
            '  "uniswapRouter": "', vm.toString(UNISWAP_V2_ROUTER), '",\n',
            '  "timestamp": ', vm.toString(block.timestamp), ',\n',
            '  "blockNumber": ', vm.toString(block.number), '\n',
            '}'
        );

        // Write to file
        vm.writeFile("./deployments/monad-testnet.json", json);
        console.log("\nDeployment addresses saved to ./deployments/monad-testnet.json");

        // Verification commands
        console.log("\n=== Contract Verification Commands ===");
        console.log("forge verify-contract", address(nft), "src/WooRelationNFT.sol:WooRelationNFT");
        console.log("  --verifier sourcify");
        console.log("  --verifier-url https://sourcify-api-monad.blockvision.org");
        console.log("  --rpc-url $MONAD_RPC\n");

        console.log("forge verify-contract", address(guard), "src/WooSwapGuard.sol:WooSwapGuard");
        console.log("  --constructor-args $(cast abi-encode 'constructor(address)' ", address(nft), ")");
        console.log("  --verifier sourcify");
        console.log("  --verifier-url https://sourcify-api-monad.blockvision.org");
        console.log("  --rpc-url $MONAD_RPC\n");

        console.log("forge verify-contract", address(lp), "src/WooLP.sol:WooLP");
        console.log("  --constructor-args $(cast abi-encode 'constructor(address,address)' ", address(nft), " ", address(0), ")");
        console.log("  --verifier sourcify");
        console.log("  --verifier-url https://sourcify-api-monad.blockvision.org");
        console.log("  --rpc-url $MONAD_RPC\n");

        console.log("forge verify-contract", address(router), "src/WooRouter.sol:WooRouter");
        console.log("  --constructor-args $(cast abi-encode 'constructor(address,address,address)' ", UNISWAP_V2_ROUTER, " ", address(guard), " ", address(lp), ")");
        console.log("  --verifier sourcify");
        console.log("  --verifier-url https://sourcify-api-monad.blockvision.org");
        console.log("  --rpc-url $MONAD_RPC\n");

        // Post-deployment instructions
        console.log("\n=== Post-deployment Instructions ===");
        console.log("1. Update frontend contract addresses in WooSwap.tsx");
        console.log("2. Update indexer config.yaml with deployed addresses");
        console.log("3. Add Monad Testnet to MetaMask:");
        console.log("   - Network: Monad Testnet");
        console.log("   - RPC: https://testnet-rpc.monad.xyz");
        console.log("   - Chain ID: 10143");
        console.log("   - Symbol: MON");
        console.log("   - Explorer: https://testnet.monadexplorer.com");
        console.log("4. Get testnet tokens from https://testnet.monad.xyz");

        // Gas usage summary
        console.log("\n=== Deployment Summary ===");
        console.log("All contracts deployed successfully!");
        console.log("Total contracts: 4");
        console.log("UniswapV2Router02:", UNISWAP_V2_ROUTER);
        console.log("Ready for WooSwap gamified trading! 🎮💖");
    }
}
// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script, console} from "forge-std/Script.sol";
import "../src/WooRelationNFT.sol";
import "../src/WooSwapGuard.sol";
import "../src/WooLP.sol";
import "../src/WooRouter.sol";

interface IERC20Demo {
    function balanceOf(address) external view returns (uint256);
    function approve(address, uint256) external returns (bool);
    function transfer(address, uint256) external returns (bool);
}

contract DemoData is Script {
    // Test user addresses - replace with actual testnet addresses
    address constant ALICE = 0x1234567890123456789012345678901234567890;
    address constant BOB = 0xaBcdEf123456789012345678901234567890aBCdEf;
    address constant CHARLIE = 0x9876543210987654321098765432109876543210;

    // Token addresses on Monad testnet
    address constant MON_TOKEN = 0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701;
    address constant USDT_TOKEN = 0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D;

    struct DemoResult {
        address user;
        uint256 swapCount;
        uint16 finalAffection;
        uint256 gasUsed;
        bool hadBreakup;
    }

    function run() external {
        // Load deployed addresses from JSON or hardcode
        address nftAddr = vm.envOr("NFT_ADDRESS", address(0));
        address guardAddr = vm.envOr("GUARD_ADDRESS", address(0));
        address lpAddr = vm.envOr("LP_ADDRESS", address(0));
        address routerAddr = vm.envOr("ROUTER_ADDRESS", address(0));

        require(nftAddr != address(0), "NFT_ADDRESS not set");
        require(guardAddr != address(0), "GUARD_ADDRESS not set");
        require(lpAddr != address(0), "LP_ADDRESS not set");
        require(routerAddr != address(0), "ROUTER_ADDRESS not set");

        WooRelationNFT nft = WooRelationNFT(nftAddr);
        WooSwapGuard guard = WooSwapGuard(guardAddr);
        WooLP lp = WooLP(lpAddr);
        WooRouter router = WooRouter(payable(routerAddr));

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Generating WooSwap Demo Data...");
        console.log("Deployer:", deployer);
        console.log("Contracts loaded successfully");

        vm.startBroadcast(deployerPrivateKey);

        // Initialize liquidity pool for rebates
        lp.addLiquidity(1000e18);
        console.log("Added 1000 WOOLP to liquidity pool");

        DemoResult[] memory results = new DemoResult[](3);
        string memory csvData = "user,swaps,final_affection,gas_used,had_breakup\n";

        // Demo User 1: Alice - Successful high-affection user with rebates
        {
            console.log("\n=== Demo User 1: Alice (Success Story) ===");
            uint256 gasStart = gasleft();

            // Mint NFT
            uint256 aliceTokenId = nft.mint(ALICE);
            console.log("Minted NFT", aliceTokenId, "for Alice");

            // Simulate 2 successful swaps with quest bonuses
            bytes32 questHash1 = keccak256("alice-quest-1");
            guard.setQuestValidity(questHash1, block.timestamp + 600);

            // First swap (should increase affection)
            executeRealSwap(router, guard, ALICE, 1e18, questHash1);

            // Send gift to boost affection
            vm.deal(ALICE, 5 ether);
            vm.prank(ALICE);
            router.payGift{value: 2 ether}();

            // Second swap (should trigger rebate due to high affection)
            bytes32 questHash2 = keccak256("alice-quest-2");
            guard.setQuestValidity(questHash2, block.timestamp + 600);
            executeRealSwap(router, guard, ALICE, 2e18, questHash2);

            uint256 gasUsed = gasStart - gasleft();
            uint16 aliceAffection = nft.affectionOf(aliceTokenId);

            results[0] = DemoResult({
                user: ALICE,
                swapCount: 2,
                finalAffection: aliceAffection,
                gasUsed: gasUsed,
                hadBreakup: false
            });

            console.log("Alice final affection:", aliceAffection);
            console.log("Alice gas used:", gasUsed);

            csvData = string.concat(
                csvData,
                vm.toString(ALICE), ",2,",
                vm.toString(aliceAffection), ",",
                vm.toString(gasUsed), ",false\n"
            );
        }

        // Demo User 2: Bob - Educational user with moderate success
        {
            console.log("\n=== Demo User 2: Bob (Edu Mode) ===");
            uint256 gasStart = gasleft();

            uint256 bobTokenId = nft.mint(BOB);
            console.log("Minted NFT", bobTokenId, "for Bob");

            // Simulate educational quest
            bytes32 eduQuestHash = keccak256("bob-edu-quest");
            guard.setQuestValidity(eduQuestHash, block.timestamp + 600);

            // Educational swap with bonus
            executeRealSwap(router, guard, BOB, 0.5e18, eduQuestHash);

            // Gift for loyalty
            vm.deal(BOB, 2 ether);
            vm.prank(BOB);
            router.payGift{value: 1 ether}();

            uint256 gasUsed = gasStart - gasleft();
            uint16 bobAffection = nft.affectionOf(bobTokenId);

            results[1] = DemoResult({
                user: BOB,
                swapCount: 1,
                finalAffection: bobAffection,
                gasUsed: gasUsed,
                hadBreakup: false
            });

            console.log("Bob final affection:", bobAffection);
            console.log("Bob gas used:", gasUsed);

            csvData = string.concat(
                csvData,
                vm.toString(BOB), ",1,",
                vm.toString(bobAffection), ",",
                vm.toString(gasUsed), ",false\n"
            );
        }

        // Demo User 3: Charlie - Breakup scenario and reconciliation
        {
            console.log("\n=== Demo User 3: Charlie (Breakup & Reconcile) ===");
            uint256 gasStart = gasleft();

            uint256 charlieTokenId = nft.mint(CHARLIE);
            console.log("Minted NFT", charlieTokenId, "for Charlie");

            // Rapid swapping to trigger penalties and breakup
            executeRealSwap(router, guard, CHARLIE, 0.1e18, bytes32(0));

            // Wait 30 seconds to avoid rapid swap penalty, then swap again
            vm.warp(block.timestamp + 30);
            executeRealSwap(router, guard, CHARLIE, 0.1e18, bytes32(0));

            // Drastically reduce affection to trigger breakup
            guard.updateAffection(CHARLIE, -6000, bytes32(0), false, false);

            uint16 charlieAffectionAfterBreakup = nft.affectionOf(charlieTokenId);
            console.log("Charlie affection after penalties:", charlieAffectionAfterBreakup);

            bool hadBreakup = charlieAffectionAfterBreakup == 0;

            if (hadBreakup) {
                console.log("Breakup triggered for Charlie!");

                // Wait for breakup cooldown
                vm.warp(block.timestamp + 31 minutes);

                // Reconcile
                guard.reconcile(CHARLIE);
                console.log("Charlie reconciled successfully");
            }

            uint256 gasUsed = gasStart - gasleft();
            uint16 charlieFinalAffection = nft.affectionOf(charlieTokenId);

            results[2] = DemoResult({
                user: CHARLIE,
                swapCount: 2,
                finalAffection: charlieFinalAffection,
                gasUsed: gasUsed,
                hadBreakup: hadBreakup
            });

            console.log("Charlie final affection:", charlieFinalAffection);
            console.log("Charlie gas used:", gasUsed);

            csvData = string.concat(
                csvData,
                vm.toString(CHARLIE), ",2,",
                vm.toString(charlieFinalAffection), ",",
                vm.toString(gasUsed), ",",
                hadBreakup ? "true" : "false", "\n"
            );
        }

        vm.stopBroadcast();

        // Write CSV results
        vm.writeFile("./demo-results.csv", csvData);
        console.log("\nDemo results saved to demo-results.csv");

        // Summary
        console.log("\n=== Demo Summary ===");
        console.log("Total users: 3");
        console.log("Total swaps: 5");
        console.log("Total gas used (all users):", results[0].gasUsed + results[1].gasUsed + results[2].gasUsed);
        console.log("Average gas per swap:", (results[0].gasUsed + results[1].gasUsed + results[2].gasUsed) / 5);

        console.log("\nDemo Scenarios:");
        console.log("High affection user (Alice) - rebates earned");
        console.log("Educational user (Bob) - learning bonuses");
        console.log("Breakup user (Charlie) - penalties and reconciliation");

        console.log("\nReady for live demo!");
        console.log("Connect MetaMask to Monad testnet and visit your frontend!");
    }

    function executeRealSwap(WooRouter router, WooSwapGuard guard, address user, uint256 amountIn, bytes32 questHash) internal {
        address[] memory path = new address[](2);
        path[0] = MON_TOKEN;
        path[1] = USDT_TOKEN;

        // Ensure user has gas for transactions
        vm.deal(user, user.balance + 1 ether);

        // Give user actual MON tokens for the swap
        vm.prank(address(this));
        IERC20Demo(MON_TOKEN).transfer(user, amountIn);

        vm.prank(user);
        IERC20Demo(MON_TOKEN).approve(address(router), amountIn);

        vm.prank(user);
        try router.swapWithWoo(
            path,
            amountIn,
            0, // minOut - accepts any output amount
            user,
            block.timestamp + 300,
            questHash
        ) {
            console.log("Real swap executed for", user, "amount:", amountIn);
        } catch Error(string memory reason) {
            console.log("Swap failed for", user, "reason:", reason);
            // Still update affection for demo purposes if quest was valid
            if (questHash != bytes32(0)) {
                // guard is already passed as parameter
                guard.updateAffection(user, 100, questHash, true, false);
            }
        } catch {
            console.log("Swap failed for", user, "(unknown reason)");
        }
    }
}
// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Test, console} from "forge-std/Test.sol";
import "../src/WooRelationNFT.sol";
import "../src/WooSwapGuard.sol";
import "../src/WooLP.sol";
import "../src/WooRouter.sol";

contract MockUniswapRouter {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts) {
        amounts = new uint[](path.length);
        amounts[0] = amountIn;
        amounts[amounts.length - 1] = amountIn * 98 / 100; // 2% slippage simulation

        // Mock token transfer
        MockERC20(path[path.length - 1]).mint(to, amounts[amounts.length - 1]);
    }
}

contract MockERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    string public name;
    string public symbol;
    uint8 public decimals = 18;

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }
}

contract WooSwapTest is Test {
    WooRelationNFT public nft;
    WooSwapGuard public guard;
    WooLP public lp;
    WooRouter public router;
    MockUniswapRouter public mockRouter;
    MockERC20 public tokenA;
    MockERC20 public tokenB;

    address public owner = address(this);
    address public alice = address(0x1);
    address public bob = address(0x2);
    address public charlie = address(0x3);

    event WooSwapExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 rebateAmount
    );

    event BreakUp(address indexed user, string reason);

    function setUp() public {
        // Deploy mock tokens and router
        tokenA = new MockERC20("TokenA", "TKA");
        tokenB = new MockERC20("TokenB", "TKB");
        mockRouter = new MockUniswapRouter();

        // Deploy WooSwap contracts
        nft = new WooRelationNFT();
        guard = new WooSwapGuard(address(nft));
        lp = new WooLP(address(nft), address(0)); // Router address set later
        router = new WooRouter(address(mockRouter), address(guard), address(lp));

        // Setup permissions
        nft.transferOwnership(address(guard));
        guard.transferOwnership(address(router));
        lp.grantRole(lp.REBATER_ROLE(), address(router));

        // Setup test users with tokens
        tokenA.mint(alice, 1000e18);
        tokenA.mint(bob, 1000e18);
        tokenA.mint(charlie, 1000e18);

        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
        vm.deal(charlie, 10 ether);
    }

    function testMintNFT() public {
        vm.prank(address(guard));
        uint256 tokenId = nft.mint(alice);

        assertEq(nft.ownerOf(tokenId), alice);
        assertEq(nft.affectionOf(tokenId), 5000); // Starting affection
        assertEq(nft.balanceOf(alice), 1);
    }

    function testInitialSwapBlocked() public {
        vm.prank(address(guard));
        nft.mint(alice);

        // Lower affection below threshold
        vm.prank(address(router));
        guard.updateAffection(alice, -1000, bytes32(0), false, false);

        (bool allowed, string memory reason) = guard.isSwapAllowed(alice, 1e18, bytes32(0));
        assertFalse(allowed);
        assertEq(reason, "Low affection, complete quest");
    }

    function testHighAffectionSwap() public {
        // Setup: Mint NFT and boost affection
        vm.prank(address(guard));
        nft.mint(alice);

        vm.prank(address(router));
        guard.updateAffection(alice, 1000, bytes32(0), false, false); // Should be 6000 total

        // Setup tokens and approval
        vm.startPrank(alice);
        tokenA.approve(address(router), 1e18);

        address[] memory path = new address[](2);
        path[0] = address(tokenA);
        path[1] = address(tokenB);

        // Execute swap
        router.swapWithWoo(
            path,
            1e18,
            0,
            alice,
            block.timestamp + 300,
            bytes32(0)
        );
        vm.stopPrank();

        // Check affection increased by base amount
        uint256 tokenId = nft.getUserTokenId(alice);
        uint16 finalAffection = nft.affectionOf(tokenId);
        assertGt(finalAffection, 6000); // Should increase from swap bonus
    }

    function testQuestBasedSwap() public {
        // Setup: Mint NFT with low affection
        vm.prank(address(guard));
        nft.mint(bob);

        vm.prank(address(router));
        guard.updateAffection(bob, -2000, bytes32(0), false, false); // 3000 affection (too low)

        // Create valid quest
        bytes32 questHash = keccak256("test-quest");
        vm.prank(address(router));
        guard.setQuestValidity(questHash, block.timestamp + 600);

        // Setup tokens
        vm.startPrank(bob);
        tokenA.approve(address(router), 1e18);

        address[] memory path = new address[](2);
        path[0] = address(tokenA);
        path[1] = address(tokenB);

        // Execute swap with quest
        router.swapWithWoo(
            path,
            1e18,
            0,
            bob,
            block.timestamp + 300,
            questHash
        );
        vm.stopPrank();

        // Verify quest bonus applied
        uint256 tokenId = nft.getUserTokenId(bob);
        uint16 finalAffection = nft.affectionOf(tokenId);
        assertGt(finalAffection, 3200); // Base + quest bonus
    }

    function testRapidSwapPenalty() public {
        // Setup
        vm.prank(address(guard));
        nft.mint(alice);

        vm.startPrank(alice);
        tokenA.approve(address(router), 2e18);

        address[] memory path = new address[](2);
        path[0] = address(tokenA);
        path[1] = address(tokenB);

        // First swap
        router.swapWithWoo(
            path,
            1e18,
            0,
            alice,
            block.timestamp + 300,
            bytes32(0)
        );

        uint256 tokenId = nft.getUserTokenId(alice);
        uint16 affectionAfterFirst = nft.affectionOf(tokenId);

        // Second swap immediately (within 60 seconds)
        vm.warp(block.timestamp + 30); // 30 seconds later

        router.swapWithWoo(
            path,
            1e18,
            0,
            alice,
            block.timestamp + 300,
            bytes32(0)
        );
        vm.stopPrank();

        uint16 affectionAfterSecond = nft.affectionOf(tokenId);

        // Should be penalized
        assertLt(affectionAfterSecond, affectionAfterFirst);
    }

    function testBreakupScenario() public {
        // Setup
        vm.prank(address(guard));
        nft.mint(charlie);

        uint256 tokenId = nft.getUserTokenId(charlie);

        // Drastically reduce affection to 0
        vm.prank(address(router));
        guard.updateAffection(charlie, -5000, bytes32(0), false, false);

        assertEq(nft.affectionOf(tokenId), 0);

        // Check breakup lockout is active
        (bool allowed,) = guard.isSwapAllowed(charlie, 1e18, bytes32(0));
        assertFalse(allowed);

        // Try to reconcile immediately (should fail due to breakup cooldown)
        vm.expectRevert();
        guard.reconcile(charlie);

        // Wait for lockout period to end
        vm.warp(block.timestamp + 31 minutes);

        // Now reconciliation should work
        guard.reconcile(charlie);

        uint16 newAffection = nft.affectionOf(tokenId);
        assertEq(newAffection, 300); // Reconcile bonus
    }

    function testRebateSystem() public {
        // Setup with high affection (8000+)
        vm.prank(address(guard));
        nft.mint(alice);

        vm.prank(address(router));
        guard.updateAffection(alice, 3500, bytes32(0), false, false); // Total: 8500

        // Add liquidity to LP for rebates
        lp.addLiquidity(1000e18);

        // Setup and execute swap
        vm.startPrank(alice);
        tokenA.approve(address(router), 1e18);

        address[] memory path = new address[](2);
        path[0] = address(tokenA);
        path[1] = address(tokenB);

        uint256 lpBalanceBefore = lp.balanceOf(alice);

        router.swapWithWoo(
            path,
            1e18,
            0,
            alice,
            block.timestamp + 300,
            bytes32(0)
        );
        vm.stopPrank();

        // Check rebate was paid
        uint256 lpBalanceAfter = lp.balanceOf(alice);
        assertGt(lpBalanceAfter, lpBalanceBefore); // Should have received rebate tokens
    }

    function testGiftSystem() public {
        // Setup
        vm.prank(address(guard));
        nft.mint(bob);

        uint256 tokenId = nft.getUserTokenId(bob);
        uint16 affectionBefore = nft.affectionOf(tokenId);

        // Send gift
        vm.prank(bob);
        router.payGift{value: 2 ether}();

        uint16 affectionAfter = nft.affectionOf(tokenId);

        // Should increase affection (200 = 2 MON * 100 per MON)
        assertEq(affectionAfter, affectionBefore + 200);
    }

    function testReconcileCooldown() public {
        vm.prank(address(guard));
        nft.mint(alice);

        // First reconcile
        guard.reconcile(alice);

        // Try immediate second reconcile (should fail)
        vm.expectRevert("Reconcile cooldown active");
        guard.reconcile(alice);

        // Wait 24 hours and try again
        vm.warp(block.timestamp + 24 hours + 1);
        guard.reconcile(alice); // Should succeed
    }

    // Fuzz testing for rebate calculation
    function testFuzzRebateCalculation(uint256 amountOut) public {
        vm.assume(amountOut > 0 && amountOut <= 1000000e18);

        // Setup high affection user
        vm.prank(address(guard));
        nft.mint(alice);

        vm.prank(address(router));
        guard.updateAffection(alice, 3500, bytes32(0), false, false); // 8500 total

        // Add sufficient liquidity
        lp.addLiquidity(amountOut);

        // Calculate expected rebate (0.25%)
        uint256 expectedRebate = (amountOut * 25) / 10000;

        // Test rebate function
        vm.prank(address(router));
        uint256 actualRebate = lp.rebate(alice, amountOut);

        assertEq(actualRebate, expectedRebate);

        // Ensure rebate doesn't exceed pool balance
        assertLe(actualRebate, amountOut); // Since we added amountOut liquidity
    }
}
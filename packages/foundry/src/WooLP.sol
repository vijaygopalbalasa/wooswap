// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./WooRelationNFT.sol";

error InsufficientPoolBalance();
error InvalidRebateAmount();

contract WooLP is ERC20, AccessControl {
    bytes32 public constant REBATER_ROLE = keccak256("REBATER_ROLE");

    WooRelationNFT public immutable relationNFT;
    address public immutable router;
    uint256 public poolBalance;

    event FeeCollected(address indexed from, uint256 amount);
    event RebatePaid(address indexed user, uint256 amount, uint16 affection);

    constructor(
        address _relationNFT,
        address _router
    ) ERC20("WooLPToken", "WOOLP") {
        relationNFT = WooRelationNFT(_relationNFT);
        router = _router;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REBATER_ROLE, _router);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        super._beforeTokenTransfer(from, to, amount);

        // Collect 1% fee when users transfer tokens to router for swaps
        // This simulates fee collection from swap volume
        if (from != address(0) && to == router && from != router && from != address(this)) {
            uint256 fee = amount / 100; // 1% fee
            poolBalance += fee;
            emit FeeCollected(from, fee);
        }
    }

    // Alternative fee collection for direct token swaps
    function collectSwapFee(address tokenIn, uint256 amountIn) external onlyRole(REBATER_ROLE) {
        // This would be called by router during actual swaps
        // Simulates 1% fee collection from swap volume
        uint256 fee = amountIn / 100;
        poolBalance += fee;
        emit FeeCollected(msg.sender, fee);
    }

    function rebate(
        address user,
        uint256 amountOut
    ) external onlyRole(REBATER_ROLE) returns (uint256 rebateAmount) {
        uint256 tokenId = _getUserTokenId(user);
        if (tokenId == type(uint256).max) return 0;

        uint16 affection = relationNFT.affectionOf(tokenId);
        if (affection < 8000) return 0;

        uint16 bps = 25; // 0.25% rebate for high affection
        rebateAmount = (amountOut * bps) / 10000;

        if (rebateAmount > poolBalance) {
            rebateAmount = poolBalance;
        }

        if (rebateAmount > 0) {
            poolBalance -= rebateAmount;
            _mint(user, rebateAmount);
            emit RebatePaid(user, rebateAmount, affection);
        }

        return rebateAmount;
    }

    function addLiquidity(uint256 amount) external {
        _mint(msg.sender, amount);
        poolBalance += amount;
    }

    function _getUserTokenId(address user) internal view returns (uint256) {
        try relationNFT.getUserTokenId(user) returns (uint256 tokenId) {
            return tokenId;
        } catch {
            return type(uint256).max;
        }
    }
}
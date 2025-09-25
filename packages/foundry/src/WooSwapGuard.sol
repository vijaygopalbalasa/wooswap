// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./WooRelationNFT.sol";

error SwapNotAllowed(string reason);
error InvalidUser();
error BreakupCooldown();

contract WooSwapGuard is Ownable {
    WooRelationNFT public immutable relationNFT;

    mapping(bytes32 questHash => uint256 validUntil) public questValidity;
    mapping(address user => uint256 timestamp) public lastSwap;
    mapping(address user => uint256 timestamp) public lastReconcile;
    mapping(address user => uint256 timestamp) public breakupTime;

    uint256 private constant RECONCILE_COOLDOWN = 24 hours;
    uint256 private constant BREAKUP_LOCKOUT = 30 minutes;

    event BreakUp(address indexed user, string reason);
    event Reconciled(address indexed user, uint16 newAffection);

    constructor(address _relationNFT) Ownable(msg.sender) {
        relationNFT = WooRelationNFT(_relationNFT);
    }

    function isSwapAllowed(
        address user,
        uint256 amountIn,
        bytes32 questHash
    ) external view returns (bool allowed, string memory reason) {
        if (user == address(0)) {
            return (false, "Invalid user");
        }

        uint256 tokenId = _getUserTokenId(user);
        if (tokenId == type(uint256).max) {
            return (false, "No relationship NFT");
        }

        uint16 affection = relationNFT.affectionOf(tokenId);

        if (affection == 0) {
            if (breakupTime[user] + BREAKUP_LOCKOUT > block.timestamp) {
                return (false, "Breakup cooldown active");
            }
        }

        if (affection >= 5000) {
            return (true, "High affection");
        }

        if (questHash != bytes32(0) && questValidity[questHash] > block.timestamp) {
            return (true, "Valid quest");
        }

        return (false, "Low affection, complete quest");
    }

    function updateAffection(address user, int16 delta, bytes32 questHash, bool isGift, bool hasEduFlag) external payable onlyOwner {
        uint256 tokenId = _getUserTokenId(user);
        if (tokenId == type(uint256).max) revert InvalidUser();

        uint16 oldAffection = relationNFT.affectionOf(tokenId);
        int16 finalDelta = delta;

        // Check for rapid swapping penalty
        if (lastSwap[user] != 0 && (block.timestamp - lastSwap[user]) < 60) {
            finalDelta -= 500; // Penalty for swapping within 60 seconds
        }

        // Quest-based bonuses
        if (questHash != bytes32(0) && questValidity[questHash] > block.timestamp) {
            finalDelta += 200; // Valid quest bonus

            if (hasEduFlag) {
                finalDelta += 50; // Educational quest bonus
            }
        }

        // Gift bonuses (capped at +1000)
        if (isGift) {
            uint256 giftValue = (msg.value / 1e18) * 100; // 100 per MON
            if (giftValue > 1000) giftValue = 1000;
            int16 giftBonus = int16(uint16(giftValue));
            finalDelta += giftBonus;
        }

        relationNFT.updateAffection(tokenId, finalDelta);
        uint16 newAffection = relationNFT.affectionOf(tokenId);

        // Check for breakup
        if (oldAffection > 0 && newAffection == 0) {
            breakupTime[user] = block.timestamp;
            emit BreakUp(user, "Low affection");
        }

        lastSwap[user] = block.timestamp;
    }

    function createCompanion(address user) external returns (uint256) {
        // Check if user already has an NFT
        uint256 existingTokenId = _getUserTokenId(user);
        if (existingTokenId != type(uint256).max) {
            revert("User already has a companion");
        }

        // Mint new companion NFT
        uint256 tokenId = relationNFT.mint(user);
        return tokenId;
    }

    function reconcile(address user) external {
        uint256 tokenId = _getUserTokenId(user);
        if (tokenId == type(uint256).max) revert InvalidUser();

        if (lastReconcile[user] + RECONCILE_COOLDOWN > block.timestamp) {
            revert("Reconcile cooldown active");
        }

        uint16 affection = relationNFT.affectionOf(tokenId);
        if (affection == 0) {
            if (breakupTime[user] + BREAKUP_LOCKOUT > block.timestamp) {
                revert BreakupCooldown();
            }
        }

        relationNFT.updateAffection(tokenId, 300);
        lastReconcile[user] = block.timestamp;

        uint16 newAffection = relationNFT.affectionOf(tokenId);
        emit Reconciled(user, newAffection);
    }

    function setQuestValidity(bytes32 questHash, uint256 validUntil) external onlyOwner {
        questValidity[questHash] = validUntil;
    }

    function _getUserTokenId(address user) internal view returns (uint256) {
        try relationNFT.getUserTokenId(user) returns (uint256 tokenId) {
            return tokenId;
        } catch {
            return type(uint256).max;
        }
    }
}
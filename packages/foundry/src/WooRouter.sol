// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./WooSwapGuard.sol";
import "./WooLP.sol";

interface IUniswapV2Router {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

error SwapNotAuthorized(string reason);
error InvalidPath();
error SwapFailed();

contract WooRouter is Ownable {
    IUniswapV2Router public immutable uniRouter;
    WooSwapGuard public immutable guard;
    WooLP public immutable lp;

    event WooSwapExecuted(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 rebateAmount
    );

    event GiftReceived(address indexed user, uint256 amount, uint16 newAffection);

    modifier wooApproved(address user, uint256 amountIn, bytes32 questHash) {
        (bool ok, string memory reason) = guard.isSwapAllowed(user, amountIn, questHash);
        if (!ok) revert SwapNotAuthorized(reason);
        _;
    }

    constructor(
        address _uniRouter,
        address _guard,
        address _lp
    ) Ownable(msg.sender) {
        uniRouter = IUniswapV2Router(_uniRouter);
        guard = WooSwapGuard(_guard);
        lp = WooLP(_lp);
    }

    function swapWithWoo(
        address[] calldata path,
        uint256 amountIn,
        uint256 minOut,
        address to,
        uint256 deadline,
        bytes32 questHash
    ) external wooApproved(msg.sender, amountIn, questHash) {
        if (path.length < 2) revert InvalidPath();

        // Monad parallel: read/write in 1 tx
        IERC20 tokenIn = IERC20(path[0]);
        IERC20 tokenOut = IERC20(path[path.length - 1]);

        // Transfer tokens from user
        tokenIn.transferFrom(msg.sender, address(this), amountIn);

        // Approve router
        tokenIn.approve(address(uniRouter), amountIn);

        // Get balance before swap
        uint256 balanceBefore = tokenOut.balanceOf(address(this));

        // Execute swap
        try uniRouter.swapExactTokensForTokens(
            amountIn,
            minOut,
            path,
            address(this),
            deadline
        ) returns (uint[] memory amounts) {
            uint256 amountOut = amounts[amounts.length - 1];

            // Monad parallel: read guard + swap + transfer in 1 tx, ~80k gas
            uint256 rebateAmount = 0;

            // Check if user qualifies for rebate (affection >= 8000)
            try guard.relationNFT().getUserTokenId(msg.sender) returns (uint256 tokenId) {
                uint16 userAffection = guard.relationNFT().affectionOf(tokenId);
                if (userAffection >= 8000) {
                    rebateAmount = lp.rebate(msg.sender, amountOut);
                }
            } catch {
                // No NFT or other error, no rebate
            }

            // Transfer final amount to recipient
            uint256 finalAmount = amountOut;
            if (rebateAmount > 0) {
                // Rebate is minted as LP tokens to user, not deducted from amountOut
                finalAmount = amountOut;
            }
            tokenOut.transfer(to, finalAmount);

            // Update affection with enhanced logic
            bool hasEduFlag = _extractEduFlag(questHash);
            guard.updateAffection(msg.sender, 200, questHash, false, hasEduFlag);

            emit WooSwapExecuted(
                msg.sender,
                address(tokenIn),
                address(tokenOut),
                amountIn,
                finalAmount,
                rebateAmount
            );
        } catch {
            revert SwapFailed();
        }
    }

    function payGift() external payable {
        if (msg.value == 0) revert("No gift sent");

        uint256 giftInMON = msg.value;
        uint16 affectionBonus = uint16((giftInMON / 1e18) * 100); // 100 per MON

        if (affectionBonus > 1000) {
            affectionBonus = 1000; // Max 1000 affection boost
        }

        guard.updateAffection(msg.sender, int16(affectionBonus), bytes32(0), true, false);

        emit GiftReceived(msg.sender, msg.value, affectionBonus);
    }

    function setQuestValidity(bytes32 questHash, uint256 validUntil) external onlyOwner {
        guard.setQuestValidity(questHash, validUntil);
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function _extractEduFlag(bytes32 questHash) internal view returns (bool) {
        // Simple heuristic: if questHash has specific pattern, it's educational
        // In real implementation, this could be more sophisticated
        if (questHash == bytes32(0)) return false;
        return uint256(questHash) % 3 == 1; // 1/3 chance for demo
    }

    receive() external payable {
        payGift();
    }
}
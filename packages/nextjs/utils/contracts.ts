// Real contract addresses loader - loaded from actual deployment
import deployments from '../../../deployments/monad-testnet.json';

export const CONTRACT_ADDRESSES = {
  NFT: deployments.nft as `0x${string}`,
  GUARD: deployments.guard as `0x${string}`,
  LP: deployments.lp as `0x${string}`,
  ROUTER: deployments.router as `0x${string}`,
  UNISWAP_V2_ROUTER: deployments.uniswapRouter as `0x${string}`, // Real Monad testnet UniswapV2Router02
} as const;

// Deployment info for reference
export const DEPLOYMENT_INFO = {
  chainId: deployments.chainId,
  deployer: deployments.deployer,
  blockNumber: deployments.blockNumber,
  timestamp: deployments.timestamp,
};

// Real token addresses on Monad testnet
export const TOKEN_ADDRESSES = {
  MON: '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701' as `0x${string}`,
  USDT: '0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D' as `0x${string}`,
} as const;
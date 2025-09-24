// Real contract addresses - deployed on Monad testnet
export const CONTRACT_ADDRESSES = {
  NFT: "0xb00F943698687E916325a706dCaB6998B2187567" as `0x${string}`,
  GUARD: "0x46ae94Fb7f129aCAA8932137b2226ab3b81988A7" as `0x${string}`,
  LP: "0x85DA3317C78246D57203c6134BaDB372353e7701" as `0x${string}`,
  ROUTER: "0x449c4eC0676c71c177Ca7B4545285b853C07B685" as `0x${string}`,
  UNISWAP_V2_ROUTER: "0xfB8e1C3b833f9E67a71C859a132cf783b645e436" as `0x${string}`, // Real Monad testnet UniswapV2Router02
} as const;

// Deployment info for reference
export const DEPLOYMENT_INFO = {
  chainId: 10143,
  deployer: "0xe4Bb5CfB8374D20bF40270c5cAe33FA12937e175",
  blockNumber: 39174077,
  timestamp: 1758722983,
};

// Real token addresses on Monad testnet
export const TOKEN_ADDRESSES = {
  MON: '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701' as `0x${string}`,
  USDT: '0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D' as `0x${string}`,
} as const;
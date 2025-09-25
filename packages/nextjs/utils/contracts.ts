import { defineChain } from 'viem'

// Monad Testnet Configuration
export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://testnet.monadexplorer.com',
    },
  },
  testnet: true,
})

// Real contract addresses - deployed on Monad testnet
export const CONTRACT_ADDRESSES = {
  NFT: "0xC6F5b2A1C84050cbAa81C69f88B84cc80b28a20D" as `0x${string}`,
  GUARD: "0x94DBa3486B05F8Ca28C55002B24bC069bB2A537B" as `0x${string}`,
  LP: "0xEb23912a659d7CCa98624eA975487B9C82c9dEDb" as `0x${string}`,
  ROUTER: "0x7c9fF7598d3CeABa092881119B23B484DA4816BF" as `0x${string}`,
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

// WooRouter ABI
export const WOO_ROUTER_ABI = [
  {
    type: 'constructor',
    inputs: [
      { name: '_uniRouter', type: 'address', internalType: 'address' },
      { name: '_guard', type: 'address', internalType: 'address' },
      { name: '_lp', type: 'address', internalType: 'address' }
    ],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'swapWithWoo',
    inputs: [
      { name: 'path', type: 'address[]', internalType: 'address[]' },
      { name: 'amountIn', type: 'uint256', internalType: 'uint256' },
      { name: 'minOut', type: 'uint256', internalType: 'uint256' },
      { name: 'to', type: 'address', internalType: 'address' },
      { name: 'deadline', type: 'uint256', internalType: 'uint256' },
      { name: 'questHash', type: 'bytes32', internalType: 'bytes32' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'payGift',
    inputs: [],
    outputs: [],
    stateMutability: 'payable'
  },
  {
    type: 'function',
    name: 'guard',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'contract WooSwapGuard' }],
    stateMutability: 'view'
  },
  {
    type: 'event',
    name: 'WooSwapExecuted',
    inputs: [
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'tokenIn', type: 'address', indexed: true, internalType: 'address' },
      { name: 'tokenOut', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amountIn', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'amountOut', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'rebateAmount', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'GiftReceived',
    inputs: [
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'newAffection', type: 'uint16', indexed: false, internalType: 'uint16' }
    ],
    anonymous: false
  },
  {
    type: 'error',
    name: 'SwapNotAuthorized',
    inputs: [{ name: 'reason', type: 'string', internalType: 'string' }]
  }
] as const

// WooRelationNFT ABI
export const WOO_RELATION_NFT_ABI = [
  {
    type: 'function',
    name: 'mint',
    inputs: [{ name: 'to', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'affectionOf',
    inputs: [{ name: 'tokenId', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'uint16', internalType: 'uint16' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'getUserTokenId',
    inputs: [{ name: 'user', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'owner', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'tokenURI',
    inputs: [{ name: 'tokenId', type: 'uint256', internalType: 'uint256' }],
    outputs: [{ name: '', type: 'string', internalType: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'event',
    name: 'AffectionUpdated',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'newAffection', type: 'uint16', indexed: false, internalType: 'uint16' }
    ],
    anonymous: false
  }
] as const

// WooSwapGuard ABI
export const WOO_SWAP_GUARD_ABI = [
  {
    type: 'function',
    name: 'createCompanion',
    inputs: [{ name: 'user', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'isSwapAllowed',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'amountIn', type: 'uint256', internalType: 'uint256' },
      { name: 'questHash', type: 'bytes32', internalType: 'bytes32' }
    ],
    outputs: [
      { name: 'allowed', type: 'bool', internalType: 'bool' },
      { name: 'reason', type: 'string', internalType: 'string' }
    ],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'reconcile',
    inputs: [{ name: 'user', type: 'address', internalType: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'relationNFT',
    inputs: [],
    outputs: [{ name: '', type: 'address', internalType: 'contract WooRelationNFT' }],
    stateMutability: 'view'
  },
  {
    type: 'event',
    name: 'BreakUp',
    inputs: [
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'reason', type: 'string', indexed: false, internalType: 'string' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'Reconciled',
    inputs: [
      { name: 'user', type: 'address', indexed: true, internalType: 'address' },
      { name: 'newAffection', type: 'uint16', indexed: false, internalType: 'uint16' }
    ],
    anonymous: false
  }
] as const

// ERC20 ABI (minimal for tokens)
export const ERC20_ABI = [
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [{ name: '', type: 'string', internalType: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ name: '', type: 'string', internalType: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8', internalType: 'uint8' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address', internalType: 'address' },
      { name: 'spender', type: 'address', internalType: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'transferFrom',
    inputs: [
      { name: 'from', type: 'address', internalType: 'address' },
      { name: 'to', type: 'address', internalType: 'address' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true, internalType: 'address' },
      { name: 'to', type: 'address', indexed: true, internalType: 'address' },
      { name: 'value', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'Approval',
    inputs: [
      { name: 'owner', type: 'address', indexed: true, internalType: 'address' },
      { name: 'spender', type: 'address', indexed: true, internalType: 'address' },
      { name: 'value', type: 'uint256', indexed: false, internalType: 'uint256' }
    ],
    anonymous: false
  }
] as const
import { createAppKit } from '@reown/appkit'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { defineChain } from 'viem'
import { QueryClient } from '@tanstack/react-query'
import { cookieStorage, createStorage } from 'wagmi'

// Define Monad Testnet
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

// Set up the Wagmi Adapter (Config)
const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId: '80f9b73154dcae39b653674ecf802554',
  networks: [monadTestnet]
})

// Create the modal
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId: '80f9b73154dcae39b653674ecf802554',
  networks: [monadTestnet],
  defaultNetwork: monadTestnet,
  metadata: {
    name: 'WooSwap',
    description: 'The world\'s first gamified DEX where you build relationships with AI companions',
    url: 'https://wooswap.com', // origin must match your domain & subdomain
    icons: ['https://avatars.githubusercontent.com/u/37784886']
  },
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
    '--w3m-border-radius-master': '16px'
  }
})

export const config = wagmiAdapter.wagmiConfig

// Export query client for React Query
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
    },
  },
})
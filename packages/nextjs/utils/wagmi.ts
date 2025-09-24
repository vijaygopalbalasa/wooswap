import { http, createConfig } from 'wagmi'
import { defineChain } from 'viem'
import { injected, walletConnect } from 'wagmi/connectors'

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

export const config = createConfig({
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(),
  },
  connectors: [
    injected(),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'c4f0c9dd4c7e3ea30e1c1e6b8f6b3b2a',
      showQrModal: true,
    }),
  ],
  ssr: true,
  storage: typeof window !== 'undefined' ? createStorage({ storage: window.localStorage }) : undefined,
})

// Create storage helper for client-side only
function createStorage(parameters: { storage: Storage }) {
  return {
    ...parameters.storage,
    getItem: (key: string) => {
      if (typeof window === 'undefined') return null
      return parameters.storage.getItem(key)
    },
    setItem: (key: string, value: string) => {
      if (typeof window === 'undefined') return
      parameters.storage.setItem(key, value)
    },
    removeItem: (key: string) => {
      if (typeof window === 'undefined') return
      parameters.storage.removeItem(key)
    },
  }
}
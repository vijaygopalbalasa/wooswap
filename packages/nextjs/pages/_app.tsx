import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConnectKitProvider } from 'connectkit'
import { config } from '../utils/wagmi'
import { Toaster } from 'react-hot-toast'

const queryClient = new QueryClient()

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          theme="midnight"
          mode="dark"
          customTheme={{
            "--ck-font-family": "system-ui, sans-serif",
            "--ck-border-radius": "16px",
            "--ck-primary-button-border-radius": "16px",
            "--ck-secondary-button-border-radius": "16px",
            "--ck-primary-button-color": "#ffffff",
            "--ck-primary-button-background": "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)",
            "--ck-primary-button-hover-background": "linear-gradient(135deg, #db2777 0%, #7c3aed 100%)",
          }}
        >
          <div data-theme="wooswap">
            <Component {...pageProps} />
            <Toaster
              position="top-center"
              toastOptions={{
                className: '',
                duration: 4000,
                style: {
                  background: 'rgba(0, 0, 0, 0.8)',
                  color: '#fff',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
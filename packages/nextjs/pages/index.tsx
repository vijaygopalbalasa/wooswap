import type { NextPage } from 'next';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { modal } from '../utils/reown-config';

// Dynamic import to avoid hydration issues with wallet connection
const WooSwapGameified = dynamic(
  () => import('../components/WooSwapGameified'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">💖</div>
          <p className="text-lg text-gray-600">Loading your heartfelt journey...</p>
        </div>
      </div>
    )
  }
);

const Home: NextPage = () => {
  const { address, isConnected } = useAccount();

  return (
    <>
      <Head>
        <title>WooSwap 💖 - Gamified DEX on Monad</title>
        <meta
          name="description"
          content="The world's first gamified DEX where you build relationships with AI companions to unlock trading rebates on Monad testnet."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />

        {/* Open Graph */}
        <meta property="og:title" content="WooSwap 💖 - Gamified DEX" />
        <meta property="og:description" content="Build relationships with AI companions, earn rebates through gamified trading on Monad testnet." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://wooswap.monad.xyz" />
        <meta property="og:image" content="/og-image.png" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="WooSwap 💖 - Gamified DEX" />
        <meta name="twitter:description" content="The future of DeFi relationships on Monad testnet" />
        <meta name="twitter:image" content="/og-image.png" />
      </Head>

      <div className="min-h-screen">
        {/* Header */}
        <header className="navbar-heartfelt fixed top-0 left-0 right-0 z-50">
          <div className="container mx-auto flex items-center justify-between px-6 py-4">
            <motion.div
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="text-3xl float-element">💖</div>
              <div>
                <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-heartfelt-coral to-pink-600">WooSwap</h1>
                <div className="text-xs text-gray-600">Heartfelt DeFi Journey</div>
              </div>
            </motion.div>

            <div className="flex items-center space-x-4">
              {isConnected ? (
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-gray-600">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </div>
                  <button
                    onClick={() => modal.open()}
                    className="btn btn-sm bg-gradient-to-r from-pink-500 to-purple-600 text-white border-none hover:from-pink-600 hover:to-purple-700"
                  >
                    Account
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => modal.open()}
                  className="btn bg-gradient-to-r from-pink-500 to-purple-600 text-white border-none hover:from-pink-600 hover:to-purple-700"
                >
                  Connect Wallet 💖
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-cyber-grid opacity-30 pointer-events-none"></div>
          <div className="absolute top-20 left-10 w-72 h-72 bg-pink-500 rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-purple-500 rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-blue-500 rounded-full opacity-10 blur-3xl"></div>

          <div className="relative z-10">
            <WooSwapGameified />
          </div>
        </main>

        {/* Footer */}
        <footer className="relative overflow-hidden py-16">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-blue-500/10"></div>
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>

          <div className="relative container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
              {/* Brand */}
              <div className="md:col-span-2">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="text-3xl">💖</div>
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                      WooSwap
                    </h3>
                    <p className="text-gray-600 text-sm">AI Girlfriend-Powered DEX</p>
                  </div>
                </div>
                <p className="text-gray-700 max-w-md">
                  The first emotional trading platform where you build relationships with AI companions
                  to unlock better deals and learn DeFi safely.
                </p>
              </div>

              {/* Network Info */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-4">Network</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Monad Testnet</p>
                  <p>Chain ID: 10143</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Active</span>
                  </div>
                </div>
              </div>

              {/* Resources */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-4">Resources</h4>
                <div className="space-y-3">
                  <a
                    href="https://testnet.monadexplorer.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-pink-600 transition-colors"
                  >
                    <span>🔍</span>
                    <span>Block Explorer</span>
                  </a>
                  <a
                    href="https://testnet.monad.xyz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-pink-600 transition-colors"
                  >
                    <span>🚰</span>
                    <span>Get Test Tokens</span>
                  </a>
                  <a
                    href="https://monad.xyz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-pink-600 transition-colors"
                  >
                    <span>⚡</span>
                    <span>Learn About Monad</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-200 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <p className="text-sm text-gray-600">
                  © 2024 WooSwap. Built with 💖 for the Monad ecosystem.
                </p>
                <p className="text-xs text-gray-500">
                  Testnet Beta • Educational Purposes
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Home;
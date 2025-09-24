import type { NextPage } from 'next';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { ConnectKitButton } from 'connectkit';
import { motion } from 'framer-motion';

// Dynamic import to avoid hydration issues with wallet connection
const WooSwapGameified = dynamic(
  () => import('../components/WooSwapGameified'),
  { ssr: false }
);

const Home: NextPage = () => {
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
        <header className="navbar-woo sticky top-0 z-50">
          <div className="container mx-auto">
            <div className="navbar-start">
              <motion.div
                className="flex items-center space-x-3"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="text-3xl floating-element">💖</div>
                <div>
                  <h1 className="text-2xl font-bold text-glow">WooSwap</h1>
                  <div className="badge badge-accent badge-sm">Monad Testnet</div>
                </div>
              </motion.div>
            </div>

            <div className="navbar-end">
              <ConnectKitButton />
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
        <footer className="bg-black/20 backdrop-blur-md border-t border-white/10 py-8 text-center text-white/60">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <h3 className="font-bold text-white mb-2">WooSwap</h3>
                <p className="text-sm">The first gamified DEX with AI companions</p>
              </div>
              <div>
                <h3 className="font-bold text-white mb-2">Network</h3>
                <p className="text-sm">Monad Testnet • Chain ID: 10143</p>
              </div>
              <div>
                <h3 className="font-bold text-white mb-2">Links</h3>
                <div className="flex justify-center space-x-4">
                  <a
                    href="https://testnet.monadexplorer.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-400 hover:text-pink-300 transition-colors"
                  >
                    Explorer
                  </a>
                  <a
                    href="https://testnet.monad.xyz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-400 hover:text-pink-300 transition-colors"
                  >
                    Faucet
                  </a>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <p className="text-sm">
                Built with ❤️ for the Monad ecosystem • Production Ready • No Mocks
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Home;
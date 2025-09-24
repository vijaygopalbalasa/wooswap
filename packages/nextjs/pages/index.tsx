import type { NextPage } from 'next';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { ConnectKitButton } from 'connectkit';

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

      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        {/* Header */}
        <header className="p-4">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="text-3xl">💖</div>
              <h1 className="text-2xl font-bold text-white">WooSwap</h1>
              <div className="badge badge-accent badge-sm">Monad Testnet</div>
            </div>

            <ConnectKitButton />
          </div>
        </header>

        {/* Main Content */}
        <main>
          <WooSwapGameified />
        </main>

        {/* Footer */}
        <footer className="p-8 text-center text-white/60">
          <div className="container mx-auto">
            <p className="text-sm">
              Built with ❤️ for the Monad ecosystem
            </p>
            <p className="text-xs mt-2">
              Testnet Only • ChainID: 10143 •
              <a
                href="https://testnet.monadexplorer.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white ml-1"
              >
                Explorer
              </a>
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Home;
'use client';

import { useState, useEffect } from 'react';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useSwitchChain,
  useChainId
} from 'wagmi';
import { parseEther, type Address, keccak256, encodeAbiParameters } from 'viem';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { CONTRACT_ADDRESSES, TOKEN_ADDRESSES } from '../utils/contracts';
import {
  WOO_RELATION_NFT_ABI,
  WOO_ROUTER_ABI,
  WOO_GUARD_ABI,
  ERC20_ABI
} from '../utils/abis';

// Monad Testnet Configuration - Real chain config
export const monadChain = {
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.monad.xyz', 'https://rpc.testnet.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' },
  },
} as const;

interface Quest {
  reply: string;
  code: number;
  questId: string;
  questHash: string;
  validUntil: number;
  eduMode?: boolean;
}

interface TopUser {
  address: string;
  totalVolume: number;
  swapCount: number;
  currentAffection: number;
  totalRebates: number;
}

export default function WooSwapGameified() {
  const { address: user, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { writeContract, isPending: isWritePending } = useWriteContract();

  const [swapAmount, setSwapAmount] = useState('1');
  const [quest, setQuest] = useState<Quest | null>(null);
  const [isLoadingQuest, setIsLoadingQuest] = useState(false);
  const [breakupTimer, setBreakupTimer] = useState<number>(0);
  const [showRebateAnimation, setShowRebateAnimation] = useState(false);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [userInput, setUserInput] = useState('');

  // Read NFT balance - Real contract calls
  const { data: nftBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.NFT,
    abi: WOO_RELATION_NFT_ABI,
    functionName: 'balanceOf',
    args: user ? [user] : undefined,
    query: { enabled: Boolean(user && chainId === 10143) },
  });

  // Read user token ID
  const { data: tokenId } = useReadContract({
    address: CONTRACT_ADDRESSES.NFT,
    abi: WOO_RELATION_NFT_ABI,
    functionName: 'getUserTokenId',
    args: user ? [user] : undefined,
    query: { enabled: Boolean(user && nftBalance && nftBalance > 0) },
  });

  // Read affection - Real data
  const { data: affection } = useReadContract({
    address: CONTRACT_ADDRESSES.NFT,
    abi: WOO_RELATION_NFT_ABI,
    functionName: 'affectionOf',
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: tokenId !== undefined, refetchInterval: 5000 },
  });

  // Read breakup time
  const { data: breakupTime } = useReadContract({
    address: CONTRACT_ADDRESSES.GUARD,
    abi: WOO_GUARD_ABI,
    functionName: 'breakupTime',
    args: user ? [user] : undefined,
    query: { enabled: Boolean(user && affection === 0), refetchInterval: 1000 },
  });

  // Read token balances for real amounts
  const { data: monBalance } = useReadContract({
    address: TOKEN_ADDRESSES.MON,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: user ? [user] : undefined,
    query: { enabled: Boolean(user), refetchInterval: 10000 },
  });

  // Auto-switch to Monad chain
  useEffect(() => {
    if (isConnected && chainId !== 10143) {
      switchChain({ chainId: 10143 });
    }
  }, [isConnected, chainId, switchChain]);

  // Handle breakup timer
  useEffect(() => {
    if (affection === 0 && breakupTime) {
      const lockoutEnd = Number(breakupTime) + 30 * 60;
      const now = Math.floor(Date.now() / 1000);

      if (lockoutEnd > now) {
        setBreakupTimer(lockoutEnd - now);
        const timer = setInterval(() => {
          const timeLeft = lockoutEnd - Math.floor(Date.now() / 1000);
          setBreakupTimer(Math.max(0, timeLeft));
          if (timeLeft <= 0) clearInterval(timer);
        }, 1000);
        return () => clearInterval(timer);
      }
    }
  }, [affection, breakupTime]);

  // Load leaderboard from indexer GraphQL
  useEffect(() => {
    const loadTopUsers = async () => {
      try {
        const response = await fetch('http://localhost:8080/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `query TopUsers { topUsers(limit: 5) { address totalVolume swapCount currentAffection totalRebates } }`
          }),
        });
        const data = await response.json();
        if (data.data?.topUsers) setTopUsers(data.data.topUsers);
      } catch (error) {
        console.log('Leaderboard temporarily unavailable');
      }
    };
    loadTopUsers();
  }, []);

  const mintNFT = async () => {
    if (!user) return;
    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.NFT,
        abi: WOO_RELATION_NFT_ABI,
        functionName: 'mint',
        args: [user],
        chainId: 10143n,
      });
      toast.success('NFT minted! Welcome to WooSwap! 💖');
    } catch (error) {
      console.error('Mint error:', error);
      toast.error('Failed to mint NFT');
    }
  };

  const fetchQuest = async () => {
    if (!user || affection === undefined) return;
    setIsLoadingQuest(true);
    try {
      const response = await fetch('/api/quest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user,
          lastAffection: affection,
          lastSwapTime: Math.floor(Date.now() / 1000) - 3600,
          userInput: userInput.trim() || undefined,
        }),
      });
      const questData = await response.json();
      setQuest(questData);
      setUserInput('');
    } catch (error) {
      console.error('Quest fetch error:', error);
      toast.error('Failed to get quest');
    } finally {
      setIsLoadingQuest(false);
    }
  };

  const executeSwap = async () => {
    if (!user || !quest) return;
    try {
      const amountIn = parseEther(swapAmount);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 300);

      await writeContract({
        address: CONTRACT_ADDRESSES.ROUTER,
        abi: WOO_ROUTER_ABI,
        functionName: 'swapWithWoo',
        args: [
          [TOKEN_ADDRESSES.MON, TOKEN_ADDRESSES.USDT],
          amountIn,
          0n,
          user,
          deadline,
          quest.questHash as `0x${string}`,
        ],
        chainId: 10143n,
      });

      // Trigger rebate animation if high affection
      if (Number(affection || 0) >= 8000) {
        setShowRebateAnimation(true);
        setTimeout(() => setShowRebateAnimation(false), 2000);
      }

      toast.success('Swap executed with Woo! 💫');
    } catch (error) {
      console.error('Swap error:', error);
      toast.error('Swap failed');
    }
  };

  const sendGift = async () => {
    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.ROUTER,
        abi: WOO_ROUTER_ABI,
        functionName: 'payGift',
        value: parseEther('1'),
        chainId: 10143n,
      });
      toast.success('Gift sent! Affection boosted! 🎁');
    } catch (error) {
      console.error('Gift error:', error);
      toast.error('Failed to send gift');
    }
  };

  const reconcile = async () => {
    if (!user) return;
    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.GUARD,
        abi: WOO_GUARD_ABI,
        functionName: 'reconcile',
        args: [user],
        chainId: 10143n,
      });
      toast.success('Reconciliation successful! 💝');
    } catch (error) {
      console.error('Reconcile error:', error);
      toast.error('Failed to reconcile');
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAffectionTier = (aff: number) => {
    if (aff >= 8000) return { tier: 'gold', icon: '🎖️', color: 'badge-warning' };
    if (aff >= 5000) return { tier: 'silver', icon: '🥈', color: 'badge-info' };
    return { tier: 'bronze', icon: '🥉', color: 'badge-error' };
  };

  const currentAffection = Number(affection || 0);
  const isBreakupActive = currentAffection === 0 && breakupTimer > 0;
  const affectionTier = getAffectionTier(currentAffection);

  if (!isConnected) {
    return (
      <div className="hero min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
        <div className="hero-content text-center">
          <div className="card w-96 bg-base-100 shadow-2xl">
            <div className="card-body">
              <h1 className="text-5xl font-bold">WooSwap 💖</h1>
              <p className="text-lg">Connect your wallet to start your gamified trading journey!</p>
              <p className="text-sm opacity-70">Supports MetaMask/Phantom/Backpack—auto-adds Monad chain</p>
              <div className="card-actions justify-center">
                <div className="btn btn-primary btn-lg">Connect Wallet</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (chainId !== 10143) {
    return (
      <div className="hero min-h-screen bg-gradient-to-br from-orange-400 to-red-600">
        <div className="hero-content text-center">
          <div className="card w-96 bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title justify-center">⚡ Switch to Monad</h2>
              <p>Experience blazing fast swaps on Monad Testnet</p>
              <button
                className="btn btn-primary"
                onClick={() => switchChain({ chainId: 10143 })}
              >
                Switch Network
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!nftBalance || nftBalance === 0n) {
    return (
      <div className="hero min-h-screen bg-gradient-to-br from-cyan-400 to-blue-600">
        <div className="hero-content text-center">
          <div className="card w-96 bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title justify-center">🤖 Meet Your AI Companion</h2>
              <p>Start your gamified trading journey with a free Relationship NFT!</p>
              <div className="py-4">
                <div className="text-6xl animate-pulse">💖</div>
              </div>
              <button
                className="btn btn-primary btn-lg"
                onClick={mintNFT}
                disabled={isWritePending}
              >
                {isWritePending ? 'Minting...' : 'Mint Free NFT'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main Trading Card */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card bg-base-100 shadow-2xl"
            >
              <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="card-title text-3xl">WooSwap 💖</h2>
                  <div className={`badge ${affectionTier.color} badge-lg gap-2`}>
                    {affectionTier.icon} {affectionTier.tier.charAt(0).toUpperCase() + affectionTier.tier.slice(1)} Tier
                  </div>
                </div>

                {/* Affection Progress Bar with Gradient */}
                <div className="w-full mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-bold">Affection Level</span>
                    <span className="font-mono">{currentAffection}/10000</span>
                  </div>
                  <progress
                    className="progress progress-success w-full h-4"
                    value={currentAffection}
                    max={10000}
                    style={{
                      background: 'linear-gradient(to right, #ef4444, #f59e0b, #10b981)',
                    }}
                  />
                  <div className="text-xs text-center mt-1 opacity-70">
                    {currentAffection >= 8000 ? '🎉 Rebate Eligible!' : 'Complete quests to earn rebates'}
                  </div>
                </div>

                {/* Breakup Status Alert */}
                {isBreakupActive && (
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="alert alert-error mb-4"
                  >
                    <span>💔 Breakup cooldown: {formatTimer(breakupTimer)}</span>
                  </motion.div>
                )}

                {/* Balance Display */}
                <div className="stats shadow mb-4">
                  <div className="stat">
                    <div className="stat-title">MON Balance</div>
                    <div className="stat-value text-sm">
                      {monBalance ? Number(monBalance) / 1e18 : 0} MON
                    </div>
                  </div>
                </div>

                {/* Swap Form */}
                <div className="form-control w-full mb-4">
                  <label className="label">
                    <span className="label-text font-bold">Swap Amount (MON → USDT)</span>
                  </label>
                  <input
                    type="number"
                    value={swapAmount}
                    onChange={(e) => setSwapAmount(e.target.value)}
                    className="input input-bordered input-lg w-full"
                    placeholder="1.0"
                    disabled={isBreakupActive}
                    step="0.1"
                    min="0"
                  />
                </div>

                {/* Quest Section - Gamified Chat */}
                {currentAffection < 5000 && !isBreakupActive && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 p-4 rounded-lg mb-4 text-white"
                  >
                    <h3 className="font-bold mb-2">💭 Chat with AI Companion</h3>

                    {/* User Input */}
                    <div className="form-control mb-2">
                      <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        className="input input-ghost text-white placeholder-white/70"
                        placeholder="Ask your AI companion anything..."
                        onKeyPress={(e) => e.key === 'Enter' && fetchQuest()}
                      />
                    </div>

                    {quest ? (
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="chat chat-start"
                      >
                        <div className="chat-bubble chat-bubble-primary">
                          <div className="text-sm">{quest.reply}</div>
                          {quest.eduMode && (
                            <div className="badge badge-accent badge-sm mt-1">📚 Edu Mode</div>
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      <button
                        className="btn btn-outline btn-sm w-full text-white border-white hover:bg-white hover:text-cyan-500"
                        onClick={fetchQuest}
                        disabled={isLoadingQuest}
                      >
                        {isLoadingQuest ? (
                          <>
                            <span className="loading loading-spinner loading-sm"></span>
                            Getting Quest...
                          </>
                        ) : (
                          <>🎯 Get Quest</>
                        )}
                      </button>
                    )}
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="card-actions justify-center gap-4">
                  {isBreakupActive ? (
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={reconcile}
                      disabled={isWritePending}
                    >
                      {isWritePending ? 'Reconciling...' : '💝 Reconcile'}
                    </button>
                  ) : (
                    <>
                      <button
                        className="btn btn-secondary"
                        onClick={sendGift}
                        disabled={isWritePending}
                      >
                        {isWritePending ? 'Sending...' : '🎁 Send Gift (1 MON)'}
                      </button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn btn-primary btn-lg"
                        onClick={executeSwap}
                        disabled={currentAffection < 5000 && !quest || isWritePending}
                      >
                        {isWritePending ? (
                          <>
                            <span className="loading loading-spinner"></span>
                            Swapping...
                          </>
                        ) : (
                          '💫 Swap with Woo'
                        )}
                      </motion.button>
                    </>
                  )}
                </div>

                {/* Rebate Info */}
                <div className="text-center mt-4">
                  <div className="text-xs opacity-60">
                    {currentAffection >= 8000 ? (
                      <span className="text-success font-bold">
                        🎉 You earn 0.25% rebates on all swaps!
                      </span>
                    ) : (
                      `Reach 8000 affection for 0.25% rebates! (${8000 - currentAffection} to go)`
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar - Leaderboard & Stats */}
          <div className="space-y-6">

            {/* Mini Leaderboard */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card bg-base-100 shadow-xl"
            >
              <div className="card-body">
                <h3 className="card-title text-lg">🏆 Top Wooers</h3>
                <div className="space-y-2">
                  {topUsers.length > 0 ? (
                    topUsers.map((u, i) => (
                      <div key={u.address} className="flex justify-between items-center p-2 bg-base-200 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                          <span className="font-mono text-xs">{u.address.slice(0, 6)}...</span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold">{u.currentAffection}</div>
                          <div className="text-xs opacity-60">{u.swapCount} swaps</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-sm opacity-60">
                      Loading leaderboard...
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* How It Works */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title text-lg">📖 How to Woo</h3>
                <div className="steps steps-vertical">
                  <div className="step step-primary">Complete quests</div>
                  <div className="step step-primary">Build affection</div>
                  <div className="step step-primary">Earn rebates</div>
                  <div className="step">Avoid breakups!</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rebate Animation Overlay */}
        <AnimatePresence>
          {showRebateAnimation && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
            >
              <motion.div
                animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-8xl"
              >
                🎉
              </motion.div>
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute text-4xl font-bold text-yellow-400"
              >
                Rebate Earned!
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Custom CSS for confetti animation */}
      <style jsx>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); }
          100% { transform: translateY(-100vh) rotate(720deg); }
        }
        .confetti {
          animation: confetti 3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
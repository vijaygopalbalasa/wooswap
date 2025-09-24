'use client';

import { useState, useEffect } from 'react';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useSwitchChain,
  useChainId
} from 'wagmi';
import { parseEther, formatEther, type Address, keccak256, encodeAbiParameters } from 'viem';
import { toast } from 'react-hot-toast';
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
  nativeCurrency: {
    name: 'MON',
    symbol: 'MON',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz', 'https://rpc.testnet.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://testnet.monadexplorer.com',
    },
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

// Simple ABI definitions
const nftABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'to', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getUserTokenId',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'affectionOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint16' }],
  },
] as const;

const routerABI = [
  {
    name: 'swapWithWoo',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'path', type: 'address[]' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'minOut', type: 'uint256' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
      { name: 'questHash', type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    name: 'payGift',
    type: 'function',
    stateMutability: 'payable',
    inputs: [],
    outputs: [],
  },
] as const;

const guardABI = [
  {
    name: 'reconcile',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [],
  },
  {
    name: 'breakupTime',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export default function WooSwap() {
  const { address: user, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { writeContract } = useWriteContract();

  const [swapAmount, setSwapAmount] = useState('1');
  const [quest, setQuest] = useState<Quest | null>(null);
  const [isLoadingQuest, setIsLoadingQuest] = useState(false);
  const [breakupTimer, setBreakupTimer] = useState<number>(0);

  // Read NFT balance
  const { data: nftBalance } = useReadContract({
    address: NFT_ADDR,
    abi: nftABI,
    functionName: 'balanceOf',
    args: user ? [user] : undefined,
    query: {
      enabled: Boolean(user && chainId === 10143),
    },
  });

  // Read user token ID
  const { data: tokenId } = useReadContract({
    address: NFT_ADDR,
    abi: nftABI,
    functionName: 'getUserTokenId',
    args: user ? [user] : undefined,
    query: {
      enabled: Boolean(user && nftBalance && nftBalance > 0),
    },
  });

  // Read affection
  const { data: affection } = useReadContract({
    address: NFT_ADDR,
    abi: nftABI,
    functionName: 'affectionOf',
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: tokenId !== undefined,
      refetchInterval: 5000,
    },
  });

  // Read breakup time
  const { data: breakupTime } = useReadContract({
    address: GUARD_ADDR,
    abi: guardABI,
    functionName: 'breakupTime',
    args: user ? [user] : undefined,
    query: {
      enabled: Boolean(user && affection === 0),
      refetchInterval: 1000,
    },
  });

  // Handle breakup timer
  useEffect(() => {
    if (affection === 0 && breakupTime) {
      const lockoutEnd = Number(breakupTime) + 30 * 60; // 30 minutes
      const now = Math.floor(Date.now() / 1000);

      if (lockoutEnd > now) {
        setBreakupTimer(lockoutEnd - now);

        const timer = setInterval(() => {
          const timeLeft = lockoutEnd - Math.floor(Date.now() / 1000);
          setBreakupTimer(Math.max(0, timeLeft));

          if (timeLeft <= 0) {
            clearInterval(timer);
          }
        }, 1000);

        return () => clearInterval(timer);
      }
    }
  }, [affection, breakupTime]);

  // Auto-switch to Monad chain
  useEffect(() => {
    if (isConnected && chainId !== 10143) {
      switchChain({ chainId: 10143 });
    }
  }, [isConnected, chainId, switchChain]);

  const mintNFT = async () => {
    if (!user) return;

    try {
      await writeContract({
        address: NFT_ADDR,
        abi: nftABI,
        functionName: 'mint',
        args: [user],
      });
      toast.success('NFT minted! Welcome to WooSwap! 💖');
    } catch (error) {
      console.error('Mint error:', error);
      toast.error('Failed to mint NFT');
    }
  };

  const fetchQuest = async () => {
    if (!user || !affection) return;

    setIsLoadingQuest(true);
    try {
      const response = await fetch('/api/quest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user,
          lastAffection: affection,
          lastSwapTime: Math.floor(Date.now() / 1000) - 3600,
        }),
      });

      const questData = await response.json();
      setQuest(questData);
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
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 300); // 5 minutes

      await writeContract({
        address: ROUTER_ADDR,
        abi: routerABI,
        functionName: 'swapWithWoo',
        args: [
          [MON_ADDR, USDT_ADDR], // path
          amountIn,
          0n, // minOut (0 for demo)
          user,
          deadline,
          quest.questHash as `0x${string}`,
        ],
      });

      toast.success('Swap executed with Woo! 💫');
    } catch (error) {
      console.error('Swap error:', error);
      toast.error('Swap failed');
    }
  };

  const sendGift = async () => {
    try {
      await writeContract({
        address: ROUTER_ADDR,
        abi: routerABI,
        functionName: 'payGift',
        value: parseEther('1'), // 1 MON
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
        address: GUARD_ADDR,
        abi: guardABI,
        functionName: 'reconcile',
        args: [user],
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

  if (!isConnected) {
    return (
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body text-center">
          <h2 className="card-title">Connect Wallet</h2>
          <p>Connect your wallet to start your WooSwap journey! 💖</p>
          <p className="text-xs">Supports MetaMask/Phantom/Backpack—auto-adds Monad chain</p>
        </div>
      </div>
    );
  }

  if (chainId !== 10143) {
    return (
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body text-center">
          <h2 className="card-title">Switch to Monad</h2>
          <p>Please switch to Monad Testnet to continue</p>
          <button
            className="btn btn-primary"
            onClick={() => switchChain({ chainId: 10143 })}
          >
            Switch Network
          </button>
        </div>
      </div>
    );
  }

  if (!nftBalance || nftBalance === 0n) {
    return (
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body text-center">
          <h2 className="card-title">Mint Your AI Companion 🤖</h2>
          <p>Start your journey with a free Relationship NFT!</p>
          <button className="btn btn-primary" onClick={mintNFT}>
            Mint Free NFT
          </button>
        </div>
      </div>
    );
  }

  const currentAffection = Number(affection || 0);
  const isBreakupActive = currentAffection === 0 && breakupTimer > 0;

  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">WooSwap 💖</h2>

        {/* Affection Bar */}
        <div className="w-full">
          <div className="flex justify-between text-xs mb-1">
            <span>Affection</span>
            <span>{currentAffection}/10000</span>
          </div>
          <progress
            className={`progress w-full ${
              currentAffection >= 8000 ? 'progress-success' :
              currentAffection >= 5000 ? 'progress-warning' :
              'progress-error'
            }`}
            value={currentAffection}
            max={10000}
          />
        </div>

        {/* Breakup Status */}
        {isBreakupActive && (
          <div className="alert alert-error">
            <span>💔 Breakup cooldown: {formatTimer(breakupTimer)}</span>
          </div>
        )}

        {/* Swap Form */}
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">Swap Amount (MON to USDT)</span>
          </label>
          <input
            type="number"
            value={swapAmount}
            onChange={(e) => setSwapAmount(e.target.value)}
            className="input input-bordered w-full"
            placeholder="1"
            disabled={isBreakupActive}
          />
        </div>

        {/* Quest Section */}
        {currentAffection < 5000 && !isBreakupActive && (
          <div className="bg-base-200 p-3 rounded-lg">
            {quest ? (
              <div>
                <p className="text-sm mb-2">{quest.reply}</p>
                {quest.eduMode && (
                  <div className="badge badge-info badge-sm">Edu Mode</div>
                )}
              </div>
            ) : (
              <button
                className="btn btn-sm btn-outline w-full"
                onClick={fetchQuest}
                disabled={isLoadingQuest}
              >
                {isLoadingQuest ? 'Loading...' : 'Get Quest 🎯'}
              </button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="card-actions justify-end">
          {isBreakupActive ? (
            <button className="btn btn-primary" onClick={reconcile}>
              Reconcile 💝
            </button>
          ) : (
            <>
              <button
                className="btn btn-secondary btn-sm"
                onClick={sendGift}
              >
                Send Gift (1 MON) 🎁
              </button>
              <button
                className="btn btn-primary"
                onClick={executeSwap}
                disabled={currentAffection < 5000 && !quest}
              >
                Swap with Woo 💫
              </button>
            </>
          )}
        </div>

        <div className="text-xs text-center mt-2 opacity-60">
          High affection (≥8000) = 0.25% rebate! 💰
        </div>
      </div>
    </div>
  );
}
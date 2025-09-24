import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import toast from 'react-hot-toast'
import { CONTRACT_ADDRESSES } from '../utils/contracts'
import { WOO_ROUTER_ABI, WOO_RELATION_NFT_ABI } from '../utils/abis'

interface Companion {
  id: number
  name: string
  type: 'cute' | 'mysterious' | 'energetic' | 'wise'
  affection: number
  level: number
  avatar: string
  personality: string
}

interface Quest {
  id: string
  title: string
  description: string
  reward: number
  type: 'educational' | 'social' | 'trading'
  completed: boolean
  expiresAt: Date
}

export default function WooSwapGameified() {
  const { address, isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState<'companion' | 'quest' | 'swap' | 'leaderboard'>('companion')
  const [companion, setCompanion] = useState<Companion | null>(null)
  const [quests, setQuests] = useState<Quest[]>([])
  const [isGeneratingQuest, setIsGeneratingQuest] = useState(false)
  const [swapAmount, setSwapAmount] = useState('')
  const [giftAmount, setGiftAmount] = useState('')

  const { writeContract, data: txHash, isPending: isWriting } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // Read companion NFT data
  const { data: nftData, refetch: refetchNFT } = useReadContract({
    address: CONTRACT_ADDRESSES.NFT,
    abi: WOO_RELATION_NFT_ABI,
    functionName: 'tokenOfOwnerByIndex',
    args: [address, 0],
    query: { enabled: !!address }
  })

  const { data: affectionData } = useReadContract({
    address: CONTRACT_ADDRESSES.NFT,
    abi: WOO_RELATION_NFT_ABI,
    functionName: 'affectionOf',
    args: [nftData],
    query: { enabled: !!nftData }
  })

  useEffect(() => {
    if (nftData && affectionData) {
      const affectionNum = Number(affectionData)
      setCompanion({
        id: Number(nftData),
        name: generateCompanionName(),
        type: getCompanionType(affectionNum),
        affection: affectionNum,
        level: Math.floor(affectionNum / 1000) + 1,
        avatar: getCompanionAvatar(affectionNum),
        personality: getPersonality(affectionNum)
      })
    }
  }, [nftData, affectionData])

  const generateCompanionName = () => {
    const names = ['Luna', 'Pixel', 'Nova', 'Echo', 'Zara', 'Kira', 'Axel', 'Sage']
    return names[Math.floor(Math.random() * names.length)]
  }

  const getCompanionType = (affection: number): Companion['type'] => {
    if (affection < 2500) return 'mysterious'
    if (affection < 5000) return 'cute'
    if (affection < 7500) return 'energetic'
    return 'wise'
  }

  const getCompanionAvatar = (affection: number) => {
    const avatars = {
      mysterious: '🌙',
      cute: '💖',
      energetic: '⚡',
      wise: '🔮'
    }
    return avatars[getCompanionType(affection)]
  }

  const getPersonality = (affection: number) => {
    if (affection < 1000) return "Still getting to know you..."
    if (affection < 2500) return "Warming up to your presence"
    if (affection < 5000) return "Enjoys your company!"
    if (affection < 7500) return "Deeply cares about you"
    return "Completely devoted to you"
  }

  const mintCompanion = async () => {
    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.NFT,
        abi: WOO_RELATION_NFT_ABI,
        functionName: 'mint',
        args: [address]
      })
      toast.success('Minting your AI companion...')
    } catch (error) {
      toast.error('Failed to mint companion')
    }
  }

  const generateQuest = async () => {
    setIsGeneratingQuest(true)
    try {
      // Simulate AI quest generation
      await new Promise(resolve => setTimeout(resolve, 2000))

      const questTypes: Quest['type'][] = ['educational', 'social', 'trading']
      const randomType = questTypes[Math.floor(Math.random() * questTypes.length)]

      const questTemplates = {
        educational: [
          { title: "Learn about DeFi", description: "Research liquidity pools and explain how they work", reward: 250 },
          { title: "Smart Contract Security", description: "Study common vulnerabilities in DeFi protocols", reward: 300 },
          { title: "Tokenomics Analysis", description: "Analyze the token distribution of a major DeFi project", reward: 200 }
        ],
        social: [
          { title: "Community Engagement", description: "Share your WooSwap experience on social media", reward: 150 },
          { title: "Help a Friend", description: "Refer a friend to start their DeFi journey", reward: 400 },
          { title: "Discord Activity", description: "Participate in community discussions", reward: 100 }
        ],
        trading: [
          { title: "Perfect Timing", description: "Execute a swap during peak trading hours", reward: 180 },
          { title: "Small Steps", description: "Make 3 small test swaps to practice", reward: 120 },
          { title: "Portfolio Balance", description: "Maintain a balanced token portfolio", reward: 250 }
        ]
      }

      const templates = questTemplates[randomType]
      const quest = templates[Math.floor(Math.random() * templates.length)]

      const newQuest: Quest = {
        id: Date.now().toString(),
        title: quest.title,
        description: quest.description,
        reward: quest.reward + (randomType === 'educational' ? 50 : 0), // Educational bonus
        type: randomType,
        completed: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }

      setQuests(prev => [newQuest, ...prev.slice(0, 4)]) // Keep max 5 quests
      toast.success('New quest generated!')
    } catch (error) {
      toast.error('Failed to generate quest')
    } finally {
      setIsGeneratingQuest(false)
    }
  }

  const completeQuest = (questId: string) => {
    setQuests(prev => prev.map(q =>
      q.id === questId ? { ...q, completed: true } : q
    ))
    const quest = quests.find(q => q.id === questId)
    if (quest) {
      toast.success(`Quest completed! +${quest.reward} affection`)
      // In a real implementation, this would call the smart contract
    }
  }

  const sendGift = async () => {
    if (!giftAmount || !companion) return

    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.ROUTER,
        abi: WOO_ROUTER_ABI,
        functionName: 'payGift',
        value: parseEther(giftAmount)
      })
      toast.success(`Sending ${giftAmount} MON as a gift...`)
      setGiftAmount('')
    } catch (error) {
      toast.error('Failed to send gift')
    }
  }

  const performSwap = async () => {
    if (!swapAmount || !companion) return

    if (companion.affection < 2500) {
      toast.error('Your companion needs more affection to unlock trading!')
      return
    }

    try {
      // This would call the actual swap function
      toast.success('Swap initiated...')
      setSwapAmount('')
    } catch (error) {
      toast.error('Swap failed')
    }
  }

  const getRebatePercentage = (affection: number) => {
    if (affection >= 7500) return 0.25
    if (affection >= 5000) return 0.1
    return 0
  }

  const getAffectionColor = (affection: number) => {
    if (affection >= 7500) return 'text-purple-400'
    if (affection >= 5000) return 'text-pink-400'
    if (affection >= 2500) return 'text-blue-400'
    return 'text-gray-400'
  }

  if (!isConnected) {
    return (
      <div className="hero-woo">
        <div className="hero-content text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md"
          >
            <h1 className="text-5xl font-bold text-glow">WooSwap 💖</h1>
            <p className="py-6 text-xl">
              The first gamified DEX where you build relationships with AI companions
              to unlock trading rebates!
            </p>
            <div className="floating-element">
              <div className="text-6xl mb-4">🎮</div>
            </div>
            <p className="text-lg opacity-80">
              Connect your wallet to start your journey
            </p>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Navigation */}
      <div className="tabs tabs-boxed mb-8 bg-glass border-glass justify-center">
        {[
          { key: 'companion', label: '🤖 Companion', icon: '💖' },
          { key: 'quest', label: '⚔️ Quests', icon: '🎯' },
          { key: 'swap', label: '💱 Trading', icon: '🔄' },
          { key: 'leaderboard', label: '🏆 Leaderboard', icon: '👑' }
        ].map(tab => (
          <button
            key={tab.key}
            className={`tab tab-lg ${activeTab === tab.key ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab.key as any)}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'companion' && (
          <motion.div
            key="companion"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {!companion ? (
              <div className="text-center">
                <div className="companion-card card-woo card-body max-w-md mx-auto">
                  <h2 className="card-title justify-center text-2xl">Create Your AI Companion</h2>
                  <div className="text-6xl my-4">🌟</div>
                  <p>Mint your unique AI companion NFT to start building a relationship!</p>
                  <div className="card-actions justify-center mt-4">
                    <button
                      className="btn-woo btn-lg"
                      onClick={mintCompanion}
                      disabled={isWriting || isConfirming}
                    >
                      {isWriting || isConfirming ? 'Minting...' : 'Mint Companion'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Companion Card */}
                <div className="companion-card card-woo card-body">
                  <div className="text-center">
                    <div className="text-8xl mb-4 affection-glow">{companion.avatar}</div>
                    <h2 className="text-3xl font-bold text-glow">{companion.name}</h2>
                    <p className="text-lg opacity-80 capitalize">{companion.type} Companion</p>
                  </div>

                  <div className="stats stats-vertical shadow bg-glass border-glass mt-6">
                    <div className="stat-woo">
                      <div className="stat-title text-white/60">Affection Level</div>
                      <div className={`stat-value ${getAffectionColor(companion.affection)}`}>
                        {companion.affection.toLocaleString()}
                      </div>
                      <div className="stat-desc">
                        <progress
                          className="progress-woo w-full"
                          value={companion.affection}
                          max="10000"
                        />
                        {companion.affection}/10,000
                      </div>
                    </div>

                    <div className="stat-woo">
                      <div className="stat-title text-white/60">Relationship Level</div>
                      <div className="stat-value text-accent">{companion.level}</div>
                      <div className="stat-desc">{companion.personality}</div>
                    </div>

                    <div className="stat-woo">
                      <div className="stat-title text-white/60">Trading Rebate</div>
                      <div className="stat-value text-success">
                        {getRebatePercentage(companion.affection)}%
                      </div>
                      <div className="stat-desc">
                        {companion.affection < 2500 ? 'Unlock at 2500 affection' : 'Active!'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gift Interface */}
                <div className="card-woo card-body">
                  <h3 className="card-title">💝 Send Gift</h3>
                  <p>Send MON tokens to increase affection (100 points per MON)</p>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text text-white">Gift Amount (MON)</span>
                    </label>
                    <div className="input-group">
                      <input
                        type="number"
                        placeholder="0.1"
                        className="input-woo flex-1"
                        value={giftAmount}
                        onChange={(e) => setGiftAmount(e.target.value)}
                      />
                      <button
                        className="btn-woo"
                        onClick={sendGift}
                        disabled={!giftAmount || isWriting || isConfirming}
                      >
                        Send Gift
                      </button>
                    </div>
                  </div>

                  <div className="alert bg-info/20 border-info/30 mt-4">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">💡</span>
                      <div>
                        <h4 className="font-bold">Affection Tips</h4>
                        <p className="text-sm opacity-80">
                          Complete quests for bonus points! Educational quests give +50 extra.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'quest' && (
          <motion.div
            key="quest"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-4xl font-bold text-glow mb-4">⚔️ Daily Quests</h2>
              <p className="text-xl opacity-80 mb-6">
                Complete AI-generated challenges to boost your companion's affection!
              </p>
              <button
                className="btn-woo btn-lg"
                onClick={generateQuest}
                disabled={isGeneratingQuest}
              >
                {isGeneratingQuest ? (
                  <>
                    <div className="loading loading-spinner"></div>
                    Generating Quest...
                  </>
                ) : (
                  '✨ Generate New Quest'
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quests.map((quest, index) => (
                <motion.div
                  key={quest.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`quest-card card-woo card-body ${quest.completed ? 'opacity-60' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="card-title text-lg">
                        {quest.type === 'educational' && '📚'}
                        {quest.type === 'social' && '👥'}
                        {quest.type === 'trading' && '💰'}
                        {quest.title}
                      </h3>
                      <p className="opacity-80 mt-2">{quest.description}</p>

                      <div className="flex justify-between items-center mt-4">
                        <div className="badge-woo">
                          +{quest.reward} Affection
                        </div>
                        <div className="text-sm opacity-60">
                          Expires: {quest.expiresAt.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card-actions justify-end mt-4">
                    {quest.completed ? (
                      <div className="badge badge-success">Completed ✓</div>
                    ) : (
                      <button
                        className="btn btn-sm btn-outline btn-primary"
                        onClick={() => completeQuest(quest.id)}
                      >
                        Complete Quest
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {quests.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎯</div>
                <p className="text-xl opacity-60">No active quests. Generate one to get started!</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'swap' && (
          <motion.div
            key="swap"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="max-w-lg mx-auto"
          >
            <div className="swap-interface card-woo card-body">
              <h2 className="card-title text-3xl justify-center text-glow">
                💱 Affection-Gated Trading
              </h2>

              {companion && companion.affection < 2500 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🔒</div>
                  <h3 className="text-xl font-bold mb-2">Trading Locked</h3>
                  <p className="opacity-80">
                    Build {2500 - companion.affection} more affection to unlock trading
                  </p>
                  <div className="mt-4">
                    <progress
                      className="progress-woo w-full"
                      value={companion.affection}
                      max="2500"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="badge-woo badge-lg mb-4">
                      🎉 Trading Unlocked!
                      {companion && getRebatePercentage(companion.affection) > 0 &&
                        ` ${getRebatePercentage(companion.affection)}% Rebate`
                      }
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-white">From: MON</span>
                      </label>
                      <input
                        type="number"
                        placeholder="0.0"
                        className="input-woo"
                        value={swapAmount}
                        onChange={(e) => setSwapAmount(e.target.value)}
                      />
                    </div>

                    <div className="text-center">
                      <button className="btn btn-circle btn-primary">
                        ↓
                      </button>
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-white">To: USDT</span>
                      </label>
                      <input
                        type="text"
                        placeholder="0.0"
                        className="input-woo"
                        disabled
                        value={swapAmount ? (parseFloat(swapAmount) * 0.1).toFixed(4) : ''}
                      />
                    </div>

                    <button
                      className="btn-woo btn-block btn-lg"
                      onClick={performSwap}
                      disabled={!swapAmount || isWriting || isConfirming}
                    >
                      {isWriting || isConfirming ? 'Swapping...' : 'Swap Tokens'}
                    </button>

                    {companion && getRebatePercentage(companion.affection) > 0 && (
                      <div className="alert bg-success/20 border-success/30">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">💰</span>
                          <div>
                            <h4 className="font-bold">Rebate Active!</h4>
                            <p className="text-sm">
                              You'll earn {getRebatePercentage(companion.affection)}% back from trading fees
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'leaderboard' && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="text-center"
          >
            <h2 className="text-4xl font-bold text-glow mb-8">🏆 Affection Leaderboard</h2>

            <div className="card-woo card-body max-w-2xl mx-auto">
              <div className="text-6xl mb-4">🚧</div>
              <h3 className="text-xl font-bold mb-2">Coming Soon!</h3>
              <p className="opacity-80">
                The leaderboard is being developed. Soon you'll be able to see how your
                companion relationship ranks against other users!
              </p>

              <div className="mt-6 space-y-2">
                <div className="flex justify-between items-center p-3 bg-white/5 rounded">
                  <span>🥇 Most Affectionate</span>
                  <span className="badge badge-warning">Coming Soon</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded">
                  <span>🎯 Quest Master</span>
                  <span className="badge badge-info">Coming Soon</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded">
                  <span>💰 Top Trader</span>
                  <span className="badge badge-success">Coming Soon</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
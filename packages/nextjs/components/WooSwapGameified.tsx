import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import toast from 'react-hot-toast'
import { CONTRACT_ADDRESSES, WOO_ROUTER_ABI, WOO_RELATION_NFT_ABI, WOO_SWAP_GUARD_ABI, ERC20_ABI, TOKEN_ADDRESSES } from '../utils/contracts'

interface Companion {
  id: number
  name: string
  type: 'budding' | 'growing' | 'blooming' | 'flourishing'
  affection: number
  level: number
  avatar: string
  personality: string
  rarity: 'new' | 'cherished' | 'beloved' | 'soulmate'
}

interface ChatMessage {
  text: string
  isUser: boolean
  timestamp: Date
}

interface Quest {
  id: string
  title: string
  description: string
  reward: number
  type: 'connect' | 'nurture' | 'grow' | 'discover'
  completed: boolean
  expiresAt: Date
  difficulty: 'gentle' | 'steady' | 'passionate' | 'devoted'
}

export default function WooSwapGameified() {
  const { address, isConnected } = useAccount()
  const [activeTab, setActiveTab] = useState<'companion' | 'quest' | 'swap' | 'leaderboard'>('companion')
  const [companion, setCompanion] = useState<Companion | null>(null)
  const [quests, setQuests] = useState<Quest[]>([])
  const [isGeneratingQuest, setIsGeneratingQuest] = useState(false)
  const [swapAmount, setSwapAmount] = useState('')
  const [giftAmount, setGiftAmount] = useState('')
  const [fromToken, setFromToken] = useState(TOKEN_ADDRESSES.MON)
  const [toToken, setToToken] = useState(TOKEN_ADDRESSES.USDT)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isSwapBlocked, setIsSwapBlocked] = useState(false)
  const [blockReason, setBlockReason] = useState('')
  const [showConfetti, setShowConfetti] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])

  const { writeContract, data: txHash, isPending: isWriting } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // Read companion NFT data
  const { data: nftBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.NFT,
    abi: WOO_RELATION_NFT_ABI,
    functionName: 'balanceOf',
    args: [address],
    query: { enabled: !!address }
  })

  const { data: nftData } = useReadContract({
    address: CONTRACT_ADDRESSES.NFT,
    abi: WOO_RELATION_NFT_ABI,
    functionName: 'getUserTokenId',
    args: [address],
    query: { enabled: !!address && nftBalance && Number(nftBalance) > 0 }
  })

  const { data: affectionData, refetch: refetchAffection } = useReadContract({
    address: CONTRACT_ADDRESSES.NFT,
    abi: WOO_RELATION_NFT_ABI,
    functionName: 'affectionOf',
    args: [nftData],
    query: { enabled: !!nftData }
  })

  // Check if swap is allowed
  const { data: swapCheck } = useReadContract({
    address: CONTRACT_ADDRESSES.GUARD,
    abi: WOO_SWAP_GUARD_ABI,
    functionName: 'isSwapAllowed',
    args: [address, parseEther(swapAmount || '0'), '0x0000000000000000000000000000000000000000000000000000000000000000'],
    query: { enabled: !!address && !!swapAmount }
  })

  // Token balances
  const { data: fromTokenBalance } = useReadContract({
    address: fromToken,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
    query: { enabled: !!address }
  })

  const { data: toTokenBalance } = useReadContract({
    address: toToken,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
    query: { enabled: !!address }
  })

  // Update companion when data changes
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
        personality: getPersonality(affectionNum),
        rarity: getCompanionRarity(affectionNum)
      })
    }
  }, [nftData, affectionData])

  // Handle swap validation
  useEffect(() => {
    if (swapCheck) {
      const [allowed, reason] = swapCheck as [boolean, string]
      setIsSwapBlocked(!allowed)
      setBlockReason(reason)

      // Add chat message from companion
      if (!allowed && companion) {
        const newChatMessage: ChatMessage = {
          text: getCompanionResponse(reason),
          isUser: false,
          timestamp: new Date()
        }
        setChatMessages(prev => [...prev.slice(-9), newChatMessage])
      }
    }
  }, [swapCheck, companion])

  const generateCompanionName = () => {
    const names = ['Luna', 'Aria', 'Zara', 'Maya', 'Rose', 'Grace', 'Hope', 'Joy']
    return names[Math.floor(Math.random() * names.length)]
  }

  const getCompanionType = (affection: number): Companion['type'] => {
    if (affection < 2500) return 'budding'
    if (affection < 5000) return 'growing'
    if (affection < 7500) return 'blooming'
    return 'flourishing'
  }

  const getCompanionRarity = (affection: number): Companion['rarity'] => {
    if (affection < 1000) return 'new'
    if (affection < 5000) return 'cherished'
    if (affection < 8000) return 'beloved'
    return 'soulmate'
  }

  const getCompanionAvatar = (affection: number) => {
    const avatars = {
      budding: '🌱',
      growing: '🌸',
      blooming: '🌺',
      flourishing: '💖'
    }
    const type = getCompanionType(affection)
    return avatars[type]
  }

  const getPersonality = (affection: number) => {
    if (affection < 1000) return "Still getting to know you 😊"
    if (affection < 2500) return "Starting to trust you 💕"
    if (affection < 5000) return "Enjoys your company 🌸"
    if (affection < 7500) return "Deeply cares for you 💖"
    return "Devoted to your journey together 💍"
  }

  const getRarityColor = (rarity: string) => {
    const colors = {
      new: 'text-gray-400',
      cherished: 'text-blue-400',
      beloved: 'text-purple-400',
      soulmate: 'text-yellow-400'
    }
    return colors[rarity as keyof typeof colors] || colors.new
  }

  const getCompanionResponse = (reason: string) => {
    const responses = {
      'Low affection, complete quest': "Let's strengthen our bond first! Try completing a quest together 💕",
      'Breakup cooldown active': "I need some time to heal... Please be patient with me 💔",
      'No relationship NFT': "We haven't met yet! Let me introduce myself first 🌸",
      'Invalid user': "Something seems wrong... Are you connected? 🤔"
    }
    return responses[reason as keyof typeof responses] || "Let's work on our connection! 💖"
  }

  const mintCompanion = async () => {
    if (!address) return

    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.NFT,
        abi: WOO_RELATION_NFT_ABI,
        functionName: 'mint',
        args: [address]
      })
      toast.success('💖 Creating your heartfelt companion...')

      // Add welcome message
      const welcomeMessage: ChatMessage = {
        text: "Hello! I'm so excited to start this journey with you! 🌸",
        isUser: false,
        timestamp: new Date()
      }
      setChatMessages([welcomeMessage])
    } catch (error) {
      toast.error('Failed to create companion')
    }
  }

  const executeSwap = async () => {
    if (!address || !swapAmount || isSwapBlocked) return

    try {
      const deadline = Math.floor(Date.now() / 1000) + 1200 // 20 minutes

      await writeContract({
        address: CONTRACT_ADDRESSES.ROUTER,
        abi: WOO_ROUTER_ABI,
        functionName: 'swapWithWoo',
        args: [
          [fromToken, toToken],
          parseEther(swapAmount),
          parseEther('0'), // Accept any amount of tokens out
          address,
          BigInt(deadline),
          '0x0000000000000000000000000000000000000000000000000000000000000000' // No quest hash
        ]
      })

      toast.success('💖 Swap initiated with love!')

      // Add success message and show confetti
      const successMessage: ChatMessage = {
        text: "Wonderful! Our bond grows stronger with each trade! ✨",
        isUser: false,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, successMessage])

      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)

      // Refetch affection after successful swap
      setTimeout(() => {
        refetchAffection()
      }, 2000)

    } catch (error) {
      toast.error('Swap failed - let me help you try again!')

      const errorMessage: ChatMessage = {
        text: "Don't worry, we'll figure this out together! 💕",
        isUser: false,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, errorMessage])
    }
  }

  const sendGift = async () => {
    if (!address || !giftAmount) return

    try {
      await writeContract({
        address: CONTRACT_ADDRESSES.ROUTER,
        abi: WOO_ROUTER_ABI,
        functionName: 'payGift',
        value: parseEther(giftAmount)
      })

      toast.success('💖 Gift sent with love!')

      const giftMessage: ChatMessage = {
        text: `Thank you for this beautiful gift! You make my heart flutter! ${parseFloat(giftAmount) > 1 ? '😍' : '😊'}`,
        isUser: false,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, giftMessage])

      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 2000)

      setGiftAmount('')

      // Refetch affection after gift
      setTimeout(() => {
        refetchAffection()
      }, 2000)

    } catch (error) {
      toast.error('Gift failed - your intention matters most! 💕')
    }
  }

  const sendChatMessage = () => {
    if (!newMessage.trim()) return

    const userMessage: ChatMessage = {
      text: newMessage,
      isUser: true,
      timestamp: new Date()
    }

    // Generate companion response
    const responses = [
      "That's so sweet of you to say! 💕",
      "I feel the same way! 🌸",
      "You always know what to say! ✨",
      "Our connection is growing stronger! 💖",
      "Thank you for sharing that with me! 😊"
    ]

    const companionMessage: ChatMessage = {
      text: responses[Math.floor(Math.random() * responses.length)],
      isUser: false,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev.slice(-9), userMessage, companionMessage])
    setNewMessage('')
  }

  const generateQuest = async () => {
    setIsGeneratingQuest(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))

      const questTypes: Quest['type'][] = ['connect', 'nurture', 'grow', 'discover']
      const randomType = questTypes[Math.floor(Math.random() * questTypes.length)]

      const questTemplates = {
        connect: [
          { title: "First Steps Together", description: "Complete your first heartfelt trade", reward: 300, difficulty: 'gentle' },
          { title: "Building Trust", description: "Send a gift to show your care", reward: 400, difficulty: 'steady' },
          { title: "Deep Connection", description: "Have 10 conversations in chat", reward: 500, difficulty: 'passionate' }
        ],
        nurture: [
          { title: "Tender Care", description: "Check in daily for a week", reward: 350, difficulty: 'steady' },
          { title: "Growing Bond", description: "Complete 5 successful swaps together", reward: 600, difficulty: 'passionate' },
          { title: "Devoted Partnership", description: "Reach 1000 MON in total trading", reward: 800, difficulty: 'devoted' }
        ],
        grow: [
          { title: "Flourishing Relationship", description: "Achieve 5000 affection together", reward: 750, difficulty: 'passionate' },
          { title: "Blooming Love", description: "Help 3 friends start their journey", reward: 500, difficulty: 'devoted' },
          { title: "Eternal Bond", description: "Reach soulmate status", reward: 1000, difficulty: 'devoted' }
        ],
        discover: [
          { title: "New Horizons", description: "Try a new token pair", reward: 250, difficulty: 'gentle' },
          { title: "Adventure Together", description: "Explore different DeFi protocols", reward: 400, difficulty: 'steady' },
          { title: "Journey of Hearts", description: "Share your story on social media", reward: 300, difficulty: 'gentle' }
        ]
      }

      const templates = questTemplates[randomType]
      const randomTemplate = templates[Math.floor(Math.random() * templates.length)]

      const newQuest: Quest = {
        id: Date.now().toString(),
        title: randomTemplate.title,
        description: randomTemplate.description,
        reward: randomTemplate.reward,
        type: randomType,
        completed: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        difficulty: randomTemplate.difficulty as Quest['difficulty']
      }

      setQuests(prev => [newQuest, ...prev.slice(0, 4)])

      const questMessage: ChatMessage = {
        text: `I have a new adventure for us! "${newQuest.title}" - shall we embark on this journey together? 🌟`,
        isUser: false,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, questMessage])

    } catch (error) {
      toast.error('Quest generation failed')
    } finally {
      setIsGeneratingQuest(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 max-w-md"
        >
          <div className="text-6xl mb-4">💖</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Welcome to Your Heartfelt DeFi Journey</h1>
          <p className="text-lg text-gray-600 mb-8">
            Connect your wallet to meet your AI companion and begin building a meaningful relationship through DeFi
          </p>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-pink-200">
            <p className="text-sm text-gray-500 mb-4">Ready to start your journey of connection and growth?</p>
            <div className="text-2xl">🌱 → 🌸 → 🌺 → 💖</div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50 pt-24 pb-12">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: -100, x: Math.random() * window.innerWidth, rotate: 0 }}
              animate={{
                y: window.innerHeight + 100,
                rotate: 360,
                transition: { duration: 3, delay: Math.random() * 2 }
              }}
              className="absolute text-2xl"
            >
              {['💖', '🌸', '✨', '🌺', '💕'][Math.floor(Math.random() * 5)]}
            </motion.div>
          ))}
        </div>
      )}

      <div className="container mx-auto px-6 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-rose-500 to-orange-500 mb-4">
            Heartfelt DeFi Journey
          </h1>
          <p className="text-lg text-gray-700">
            Build meaningful connections • Grow together • Create lasting bonds
          </p>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex justify-center">
          <div className="bg-white/60 backdrop-blur-sm rounded-full p-2 border border-pink-200">
            {[
              { key: 'companion', label: 'My Companion', icon: '💖' },
              { key: 'quest', label: 'Adventures', icon: '🌟' },
              { key: 'swap', label: 'Trading Together', icon: '🤝' },
              { key: 'leaderboard', label: 'Community', icon: '🏆' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-6 py-3 rounded-full transition-all duration-300 font-medium ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg'
                    : 'text-gray-600 hover:text-pink-600 hover:bg-white/50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'companion' && (
            <motion.div
              key="companion"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid lg:grid-cols-2 gap-8"
            >
              {/* Companion Card */}
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-pink-200 shadow-xl">
                {companion ? (
                  <div className="text-center space-y-6">
                    <div className="text-8xl mb-4">{companion.avatar}</div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-800 mb-2">{companion.name}</h2>
                      <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getRarityColor(companion.rarity)} bg-white/50`}>
                        {companion.rarity} • Level {companion.level}
                      </span>
                    </div>

                    {/* Affection Bar */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Affection</span>
                        <span className="text-sm font-bold text-pink-600">{companion.affection}/10000</span>
                      </div>
                      <div className="w-full bg-pink-100 rounded-full h-3 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(companion.affection / 10000) * 100}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full"
                        />
                      </div>
                    </div>

                    <p className="text-gray-600 italic">{companion.personality}</p>

                    {/* Gift Section */}
                    <div className="bg-pink-50 rounded-2xl p-6 space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Send a Gift 💝</h3>
                      <div className="flex gap-3">
                        <input
                          type="number"
                          value={giftAmount}
                          onChange={(e) => setGiftAmount(e.target.value)}
                          placeholder="Amount in MON"
                          className="flex-1 px-4 py-3 rounded-xl border border-pink-200 focus:border-pink-400 focus:outline-none bg-white/70"
                        />
                        <button
                          onClick={sendGift}
                          disabled={!giftAmount || isWriting}
                          className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-medium hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 transition-all"
                        >
                          {isWriting ? '💖' : 'Send'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-6">
                    <div className="text-8xl mb-4">🌱</div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-800 mb-4">Meet Your Companion</h2>
                      <p className="text-gray-600 mb-8">
                        Begin your heartfelt journey by creating your AI companion. They'll guide you through DeFi with care and understanding.
                      </p>
                      <button
                        onClick={mintCompanion}
                        disabled={isWriting}
                        className="px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-medium hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 transition-all text-lg"
                      >
                        {isWriting ? 'Creating...' : '💖 Create My Companion'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Section */}
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border border-pink-200 shadow-xl">
                <h3 className="text-xl font-bold text-gray-800 mb-4">💬 Heart to Heart</h3>

                {/* Chat Messages */}
                <div className="bg-pink-50 rounded-2xl p-4 h-80 overflow-y-auto mb-4 space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <div className="text-4xl mb-2">💕</div>
                      <p>Start a conversation with your companion!</p>
                    </div>
                  ) : (
                    chatMessages.map((message, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-2xl ${
                            message.isUser
                              ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white'
                              : 'bg-white text-gray-800 border border-pink-200'
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                          <span className="text-xs opacity-70">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Chat Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder="Share your thoughts..."
                    className="flex-1 px-4 py-2 rounded-xl border border-pink-200 focus:border-pink-400 focus:outline-none bg-white/70"
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 transition-all"
                  >
                    💕
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'swap' && (
            <motion.div
              key="swap"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-pink-200 shadow-xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">🤝 Trading Together</h2>

                {isSwapBlocked && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🥺</div>
                      <div>
                        <h4 className="font-semibold text-yellow-800">Companion's Guidance</h4>
                        <p className="text-yellow-700 text-sm">{blockReason}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-6">
                  {/* Token Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                      <div className="bg-pink-50 rounded-xl p-4 border border-pink-200">
                        <div className="font-medium text-gray-800">MON</div>
                        <div className="text-sm text-gray-600">
                          Balance: {fromTokenBalance ? formatEther(fromTokenBalance as bigint) : '0'} MON
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                      <div className="bg-mint-50 rounded-xl p-4 border border-green-200">
                        <div className="font-medium text-gray-800">USDT</div>
                        <div className="text-sm text-gray-600">
                          Balance: {toTokenBalance ? formatEther(toTokenBalance as bigint) : '0'} USDT
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Swap Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount to Trade</label>
                    <input
                      type="number"
                      value={swapAmount}
                      onChange={(e) => setSwapAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full px-4 py-3 rounded-xl border border-pink-200 focus:border-pink-400 focus:outline-none bg-white/70"
                    />
                  </div>

                  {/* Swap Button */}
                  <button
                    onClick={executeSwap}
                    disabled={!swapAmount || isSwapBlocked || isWriting}
                    className={`w-full px-8 py-4 rounded-xl font-medium text-lg transition-all ${
                      isSwapBlocked
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600'
                    }`}
                  >
                    {isWriting ? '💖 Processing with care...' : '🤝 Trade Together'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'quest' && (
            <motion.div
              key="quest"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">🌟 Our Adventures</h2>
                <p className="text-gray-600 mb-6">Embark on journeys that strengthen your bond</p>

                <button
                  onClick={generateQuest}
                  disabled={isGeneratingQuest}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-medium hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 transition-all"
                >
                  {isGeneratingQuest ? '✨ Creating adventure...' : '🌟 New Adventure'}
                </button>
              </div>

              {/* Quest Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {quests.map((quest) => (
                  <motion.div
                    key={quest.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-pink-200 shadow-lg"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{quest.title}</h3>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          quest.difficulty === 'gentle' ? 'bg-green-100 text-green-700' :
                          quest.difficulty === 'steady' ? 'bg-blue-100 text-blue-700' :
                          quest.difficulty === 'passionate' ? 'bg-purple-100 text-purple-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {quest.difficulty}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-pink-600">+{quest.reward}</div>
                        <div className="text-xs text-gray-500">affection</div>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-4">{quest.description}</p>

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        Expires: {quest.expiresAt.toLocaleDateString()}
                      </span>
                      <button className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg text-sm font-medium hover:from-pink-600 hover:to-rose-600 transition-all">
                        Begin Journey
                      </button>
                    </div>
                  </motion.div>
                ))}

                {quests.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <div className="text-4xl mb-4">🌸</div>
                    <p className="text-gray-500">Generate your first adventure to begin!</p>
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
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-pink-200 shadow-xl">
                <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">🏆 Community Hearts</h2>

                <div className="text-center py-12">
                  <div className="text-4xl mb-4">💖</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Celebrating Love & Growth</h3>
                  <p className="text-gray-600 mb-6">
                    See how your relationship compares with other heartfelt journeys in the community
                  </p>
                  <div className="text-sm text-gray-500">
                    Leaderboard coming soon - focus on your unique bond for now! 🌸
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
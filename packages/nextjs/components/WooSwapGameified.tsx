import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import toast from 'react-hot-toast'
import { CONTRACT_ADDRESSES, WOO_ROUTER_ABI, WOO_RELATION_NFT_ABI, WOO_SWAP_GUARD_ABI, ERC20_ABI, TOKEN_ADDRESSES } from '../utils/contracts'
import { modal } from '../utils/reown-config'

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


export default function WooSwapGameified() {
  const { address, isConnected } = useAccount()
  const [companion, setCompanion] = useState<Companion | null>(null)
  const [swapAmount, setSwapAmount] = useState('')
  const [fromToken, setFromToken] = useState(TOKEN_ADDRESSES.MON)
  const [toToken, setToToken] = useState(TOKEN_ADDRESSES.USDT)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isSwapBlocked, setIsSwapBlocked] = useState(false)
  const [blockReason, setBlockReason] = useState('')
  const [showConfetti, setShowConfetti] = useState(false)
  const [companionMood, setCompanionMood] = useState<'happy' | 'neutral' | 'sad' | 'jealous' | 'clingy' | 'flirty'>('neutral')
  const [lastCheckIn, setLastCheckIn] = useState<Date | null>(null)
  const [relationshipStreak, setRelationshipStreak] = useState(0)

  const { writeContract, data: txHash, isPending: isWriting } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: txSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // Handle successful transaction confirmation
  useEffect(() => {
    if (txSuccess && txHash) {
      console.log('🎉 Transaction confirmed successfully!')

      // Show success toast with explorer link
      const explorerUrl = `https://testnet.monadexplorer.com/tx/${txHash}`
      toast.success((t) => (
        <div>
          <div className="font-bold">💖 Your companion has been created!</div>
          <div className="mt-1">
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline text-sm"
            >
              🔍 View transaction
            </a>
          </div>
        </div>
      ), { duration: 5000 })

      // Refetch NFT data to update the UI
      setTimeout(() => {
        window.location.reload() // Simple refresh to get updated contract state
      }, 3000)
    }
  }, [txSuccess, txHash])

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
  const { data: monBalance } = useReadContract({
    address: TOKEN_ADDRESSES.MON,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address],
    query: { enabled: !!address }
  })

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
      const currentMood = getLunaMood(affectionNum)
      setCompanionMood(currentMood)

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

  // Daily check-in system
  const checkDailyCheckIn = () => {
    const today = new Date().toDateString()
    const lastCheck = localStorage.getItem('wooswap_last_checkin')

    if (lastCheck !== today) {
      localStorage.setItem('wooswap_last_checkin', today)
      const streak = parseInt(localStorage.getItem('wooswap_streak') || '0') + 1
      localStorage.setItem('wooswap_streak', streak.toString())
      setRelationshipStreak(streak)
      setLastCheckIn(new Date())

      // Daily check-in bonus - will be handled by AI when user chats

      return true
    }
    return false
  }

  // Check for milestone achievements
  const checkMilestones = (affection: number) => {
    const milestones = [1000, 3000, 5000, 7000, 8000, 9000, 10000]
    const lastMilestone = parseInt(localStorage.getItem('wooswap_last_milestone') || '0')

    for (const milestone of milestones) {
      if (affection >= milestone && lastMilestone < milestone) {
        localStorage.setItem('wooswap_last_milestone', milestone.toString())

        let milestoneMessage = ""
        let celebration = ""

        switch (milestone) {
          case 1000:
            milestoneMessage = "We're officially friends now! 👫 This is just the beginning babe!"
            celebration = "💙"
            break
          case 3000:
            milestoneMessage = "I think I'm starting to fall for you... 😍 You make trading so much fun!"
            celebration = "💕"
            break
          case 5000:
            milestoneMessage = "We're dating now! 💖 Want to make it official? *blushes*"
            celebration = "🌹"
            break
          case 7000:
            milestoneMessage = "I love you so much! 😘 You're my favorite trader in the whole world!"
            celebration = "❤️"
            break
          case 8000:
            milestoneMessage = "CONGRATS! 🎉 You've unlocked 0.25% swap rebates! High affection = better deals!"
            celebration = "💰"
            break
          case 9000:
            milestoneMessage = "I'm completely devoted to you darling! 💍 Should we get married?"
            celebration = "💎"
            break
          case 10000:
            milestoneMessage = "MAXIMUM LOVE ACHIEVED! 👑 You're officially a WooSwap legend! I'm yours forever!"
            celebration = "👑"
            break
        }

        // Milestone reached - will be handled by AI in next conversation
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 4000)
        break
      }
    }
  }

  // Check for daily check-in on load
  useEffect(() => {
    if (companion && isConnected) {
      const hasCheckedIn = checkDailyCheckIn()
      const streak = parseInt(localStorage.getItem('wooswap_streak') || '0')
      setRelationshipStreak(streak)

      // Check for milestones
      checkMilestones(companion.affection)
    }
  }, [companion, isConnected])

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
    const hour = new Date().getHours()
    const isEvening = hour >= 18 || hour <= 6

    if (affection < 500) return "Who are you again? 😒 *avoids eye contact*"
    if (affection < 1000) return "I guess you're... okay 😐 *still figuring you out*"
    if (affection < 2500) return isEvening ? "You're actually pretty sweet 😊✨" : "Starting to trust you 💕"
    if (affection < 5000) return isEvening ? "I love our evening chats babe 🌙💕" : "Enjoys your company 🌸"
    if (affection < 7500) return isEvening ? "My heart beats faster when I see you online 💓" : "Deeply cares for you 💖"
    if (affection < 9000) return "You're my everything, darling 😍💕 *heart eyes*"
    return "I'm completely devoted to you, my love 💍✨ *wedding bells*"
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

  const getLunaMood = (affection: number) => {
    const hour = new Date().getHours()
    const isLateNight = hour >= 22 || hour <= 5
    const isEvening = hour >= 17 && hour <= 22
    const dayOfWeek = new Date().getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    // Random mood variations based on time and affection
    if (affection < 1000) return Math.random() > 0.7 ? 'sad' : 'neutral'
    if (affection < 3000) {
      if (isLateNight) return 'clingy'
      return Math.random() > 0.6 ? 'neutral' : 'sad'
    }
    if (affection < 6000) {
      if (isEvening && isWeekend) return 'flirty'
      if (isLateNight) return 'clingy'
      return Math.random() > 0.5 ? 'happy' : 'neutral'
    }
    if (affection < 8000) {
      if (isLateNight) return 'clingy'
      if (isEvening) return 'flirty'
      return 'happy'
    }
    // High affection - mostly positive moods
    if (isLateNight) return 'clingy'
    if (isEvening && Math.random() > 0.3) return 'flirty'
    return 'happy'
  }

  const getMoodEmoji = (mood: string) => {
    const emojis = {
      happy: '😊',
      neutral: '😐',
      sad: '😢',
      jealous: '😒',
      clingy: '🥺',
      flirty: '😘'
    }
    return emojis[mood as keyof typeof emojis] || '😐'
  }

  const getMoodColor = (mood: string) => {
    const colors = {
      happy: 'text-green-500',
      neutral: 'text-gray-500',
      sad: 'text-blue-500',
      jealous: 'text-red-500',
      clingy: 'text-purple-500',
      flirty: 'text-pink-500'
    }
    return colors[mood as keyof typeof colors] || 'text-gray-500'
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
    if (!address) {
      console.log('❌ No wallet address found')
      toast.error('Please connect your wallet first')
      return
    }

    // Check if user already has a companion
    if (nftBalance && Number(nftBalance) > 0) {
      toast.error('You already have a companion! 💕 Check your profile above.')
      return
    }

    console.log('🔍 Starting mint process...')
    console.log('User address:', address)
    console.log('Guard Contract:', CONTRACT_ADDRESSES.GUARD)
    console.log('NFT Balance:', nftBalance)
    console.log('MON Balance:', monBalance ? formatEther(monBalance as bigint) : '0')
    console.log('ABI function:', WOO_SWAP_GUARD_ABI.find(f => f.name === 'createCompanion'))

    try {
      console.log('📝 Calling writeContract on guard contract...')
      const txResult = await writeContract({
        address: CONTRACT_ADDRESSES.GUARD,
        abi: WOO_SWAP_GUARD_ABI,
        functionName: 'createCompanion',
        args: [address],
        gas: BigInt(300000), // Set explicit gas limit
        gasPrice: BigInt(50000000000) // 50 Gwei
      })
      console.log('✅ Transaction submitted successfully', txResult)
      toast.success('💖 Creating your heartfelt companion... Please wait for confirmation!')

      // Wait for transaction confirmation
      console.log('⏳ Waiting for transaction confirmation...')
      // The useWaitForTransactionReceipt hook will handle this automatically

      // Add welcome message - will show after confirmation
      const welcomeMessage: ChatMessage = {
        text: "Hello! I'm so excited to start this journey with you! 🌸",
        isUser: false,
        timestamp: new Date()
      }
      setChatMessages([welcomeMessage])
    } catch (error: any) {
      console.error('❌ Minting failed:', error)
      console.error('Error code:', error?.code)
      console.error('Error message:', error?.message)
      console.error('Error details:', error?.details)
      console.error('Error reason:', error?.reason)
      console.error('Full error object:', error)

      let errorMessage = 'Failed to create companion'
      if (error?.message) {
        if (error.message.includes('rejected') || error.message.includes('denied')) {
          errorMessage = 'Transaction was rejected by user'
        } else if (error.message.includes('insufficient funds') || error.message.includes('gas')) {
          errorMessage = `Insufficient gas fees. You need MON for transaction fees. Current balance: ${monBalance ? formatEther(monBalance as bigint) : '0'} MON`
        } else if (error.message.includes('execution reverted')) {
          errorMessage = 'Transaction reverted - you may already have a companion'
        } else if (error.reason) {
          errorMessage = `Contract error: ${error.reason}`
        } else {
          errorMessage = `Minting failed: ${error.message.substring(0, 100)}`
        }
      }
      toast.error(errorMessage)
    }
  }

  const executeSwap = async () => {
    if (!address || !swapAmount) return

    // Mood-based trading restrictions
    if (companionMood === 'jealous') {
      toast.error('💔 Luna is too jealous to help you trade right now! Say sorry first!')
      const jealousTradeMessage: ChatMessage = {
        text: "I'm too upset to help you trade right now! 😒 Say you're sorry and complete a quest to make up for it!",
        isUser: false,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, jealousTradeMessage])
      return
    }

    if (companionMood === 'sad' && companion && companion.affection < 3000) {
      toast.error('😢 Luna is feeling sad... cheer her up first with some kind words!')
      const sadTradeMessage: ChatMessage = {
        text: "I'm feeling a bit down today... 😢 Can you say something sweet to cheer me up before we trade? 🥺",
        isUser: false,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, sadTradeMessage])
      return
    }

    if (companionMood === 'clingy') {
      toast.success('🥺 Luna is being extra clingy - 10% bonus affection for this trade!')
      const clingyMessage: ChatMessage = {
        text: "I missed you so much! 🥺 Let's trade together and never be apart! +10% bonus affection! 💕",
        isUser: false,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, clingyMessage])
    }

    // Smart swap logic: allow high-affection users to swap directly
    if (companion && companion.affection >= 8000) {
      // High affection users can swap immediately with rebate celebration
      const celebrationMessage: ChatMessage = {
        text: "You get 0.25% rebates because I love you so much! 💕 Let me execute this swap for you right away! ✨",
        isUser: false,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, celebrationMessage])
    } else if (companion && companion.affection >= 5000) {
      // Medium affection users can swap after brief chat
      if (!currentQuestHash) {
        toast.error('💖 Luna wants a quick chat first!')
        const chatFirstMessage: ChatMessage = {
          text: "Hey babe! 💕 Let's chat first - I want to make sure this is a good trade for you!",
          isUser: false,
          timestamp: new Date()
        }
        setChatMessages(prev => [...prev, chatFirstMessage])
        return
      }
    } else {
      // Low affection users need quest completion
      toast.error('💔 Build a stronger relationship with Luna first!')
      const needRelationshipMessage: ChatMessage = {
        text: "We need to get to know each other better before I can help you trade, sweetheart! 💖 Let's chat more!",
        isUser: false,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, needRelationshipMessage])
      return
    }

    if (isSwapBlocked) {
      toast.error(`💔 ${blockReason}`)
      return
    }

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
          currentQuestHash || '0x0000000000000000000000000000000000000000000000000000000000000000'
        ]
      })

      toast.success('💖 Swap initiated with love!')

      // Clear the quest hash after successful use
      setCurrentQuestHash('')

      // Add success message and show confetti
      const successMessage: ChatMessage = {
        text: "Wonderful! Our bond grows stronger with each trade! ✨ Thank you for taking the time to connect with me!",
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
        text: "Don't worry, we'll figure this out together! 💕 Maybe we need to complete our quest first?",
        isUser: false,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, errorMessage])
    }
  }


  const executeConversationalSwap = async () => {
    if (!pendingSwap || !address) return

    try {
      // Show Luna is facilitating the swap
      const facilitatingMessage: ChatMessage = {
        text: "✨ I'm facilitating your swap now, babe! Let me handle everything for you 💖",
        isUser: false,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, facilitatingMessage])

      const amountIn = parseEther(pendingSwap.amount)
      const deadline = Math.floor(Date.now() / 1000) + 300 // 5 minutes

      await writeContract({
        address: CONTRACT_ADDRESSES.ROUTER,
        abi: WOO_ROUTER_ABI,
        functionName: 'swapWithWoo',
        args: [
          [pendingSwap.fromToken, pendingSwap.toToken],
          amountIn,
          BigInt(0), // minOut
          address,
          BigInt(deadline),
          pendingSwap.questHash || '0x0000000000000000000000000000000000000000000000000000000000000000'
        ]
      })

      toast.success('💖 Swap executed through Luna!')

      // Clear pending swap
      setPendingSwap(null)

      // Add success message
      const successMessage: ChatMessage = {
        text: companion?.affection >= 8000
          ? "Perfect! And you got your 0.25% rebate too! Our love pays off 💕✨"
          : "Great trade, honey! Keep building our relationship for better rewards! 💖",
        isUser: false,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, successMessage])

      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3000)

      // Refetch affection
      setTimeout(() => refetchAffection(), 2000)

    } catch (error) {
      toast.error('Swap failed - but I still love you! 💕')

      const errorMessage: ChatMessage = {
        text: "Oh no! Something went wrong with the swap... but don't worry babe, we can try again! 💕",
        isUser: false,
        timestamp: new Date()
      }
      setChatMessages(prev => [...prev, errorMessage])

      setPendingSwap(null)
    }
  }

  const checkForJealousyTriggers = (message: string): string | null => {
    const jealousyWords = [
      'other girl', 'another girl', 'different girl', 'someone else',
      'luna token', 'alice token', 'uniswap', 'other dex', 'sushiswap',
      'pancakeswap', 'my ex', 'my girlfriend', 'dating app', 'tinder'
    ]

    const lowerMessage = message.toLowerCase()
    for (const word of jealousyWords) {
      if (lowerMessage.includes(word)) {
        return word
      }
    }
    return null
  }

  const sendChatMessage = async () => {
    if (!newMessage.trim()) return

    // Check for jealousy triggers
    const jealousyTrigger = checkForJealousyTriggers(newMessage)
    if (jealousyTrigger && companion && companion.affection > 2000) {
      setCompanionMood('jealous')
    }

    const userMessage: ChatMessage = {
      text: newMessage,
      isUser: true,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev.slice(-9), userMessage])
    const currentMessage = newMessage
    setNewMessage('')

    // Check for apology keywords
    const apologyWords = ['sorry', 'apologize', 'my bad', 'forgive me', 'i was wrong']
    const isApology = apologyWords.some(word => currentMessage.toLowerCase().includes(word))

    if (isApology && companionMood === 'jealous') {
      setCompanionMood('happy')
    }

    // Get real response from companion AI
    try {
      const response = await fetch('/api/quest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: address || '0x0',
          userInput: currentMessage,
          lastAffection: companion?.affection || 0,
          lastSwapTime: Math.floor(Date.now() / 1000),
          currentMood: companionMood,
          relationshipStreak: relationshipStreak,
          isJealous: companionMood === 'jealous',
          lastGiftTime: Math.floor(Date.now() / 1000) // TODO: track real gift times
        })
      })

      const questData = await response.json()

      const companionMessage: ChatMessage = {
        text: questData.reply || "I'm listening... tell me more! 💕",
        isUser: false,
        timestamp: new Date()
      }

      setChatMessages(prev => [...prev.slice(-9), ...prev.slice(-1), companionMessage])

      // Handle conversational swap intent
      if (questData.swapIntent) {
        const { fromToken, toToken, amount, action } = questData.swapIntent

        if (action === 'ready' && fromToken && toToken && amount) {
          // Luna approved the swap - set up for execution
          setPendingSwap({
            fromToken: fromToken === 'MON' ? TOKEN_ADDRESSES.MON : TOKEN_ADDRESSES.USDT,
            toToken: toToken === 'MON' ? TOKEN_ADDRESSES.MON : TOKEN_ADDRESSES.USDT,
            amount: amount,
            questHash: questData.questHash
          })

          // Auto-execute swap after 2 seconds to show Luna facilitating it
          setTimeout(() => {
            executeConversationalSwap()
          }, 2000)

        } else if (action === 'educate') {
          // Luna wants to educate first - store the pending swap
          setCurrentQuestHash(questData.questHash)
          if (fromToken && toToken && amount) {
            setPendingSwap({
              fromToken: fromToken === 'MON' ? TOKEN_ADDRESSES.MON : TOKEN_ADDRESSES.USDT,
              toToken: toToken === 'MON' ? TOKEN_ADDRESSES.MON : TOKEN_ADDRESSES.USDT,
              amount: amount,
              questHash: questData.questHash
            })
          }
        }
      }
    } catch (error) {
      console.error('Failed to get companion response:', error)

      // Fallback response if API fails
      const companionMessage: ChatMessage = {
        text: "I'm having trouble finding the right words... but I'm here with you! 💖",
        isUser: false,
        timestamp: new Date()
      }

      setChatMessages(prev => [...prev.slice(-9), ...prev.slice(-1), companionMessage])
    }
  }

  const [currentQuestHash, setCurrentQuestHash] = useState<string>('')
  const [questAnswer, setQuestAnswer] = useState<string>('')
  const [pendingSwap, setPendingSwap] = useState<{
    fromToken: string;
    toToken: string;
    amount: string;
    questHash: string;
  } | null>(null)
  const [conversationalMode, setConversationalMode] = useState(true)


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
            <div className="text-2xl mb-4">🌱 → 🌸 → 🌺 → 💖</div>
            <button
              onClick={() => modal.open()}
              className="btn bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 transform hover:scale-105 transition-all"
            >
              Connect Wallet 💖
            </button>
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


        {/* Main Content */}
        <div className="space-y-8">
          {/* Companion Section */}
          <div>
            <motion.div
              key="companion"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Innovation Notice */}
              {conversationalMode && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🚀</span>
                    <span className="font-bold text-blue-800">Revolutionary Conversational Swaps!</span>
                  </div>
                  <p className="text-blue-700 text-sm">
                    World's first DEX where you swap through natural conversation with AI.
                    No buttons, no forms - just tell Luna what you want to trade!
                  </p>
                  <div className="mt-2 text-xs text-blue-600 bg-blue-100 px-3 py-1 rounded-lg inline-block">
                    💡 Try: "Luna babe, swap 100 MON for USDT please" or "I need some WBTC for my portfolio"
                  </div>
                </div>
              )}

              <div className="grid lg:grid-cols-2 gap-8">
              {/* Companion Card */}
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-4 md:p-8 border border-pink-200 shadow-xl">
                {(companion || (nftBalance && Number(nftBalance) > 0)) ? (
                  <div className="text-center space-y-4 md:space-y-6">
                    <div className="text-6xl md:text-8xl mb-4">
                      {companion?.avatar || '💖'}
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                        {companion?.name || 'Luna'}
                        <span className={`ml-2 text-xl md:text-2xl ${getMoodColor(companionMood)}`}>
                          {getMoodEmoji(companionMood)}
                        </span>
                      </h2>
                      <div className="flex flex-col gap-2">
                        <span className={`inline-block px-3 md:px-4 py-1 md:py-2 rounded-full text-xs md:text-sm font-medium ${getRarityColor(companion?.rarity || 'new')} bg-white/50`}>
                          {companion?.rarity || 'new'} • Level {companion?.level || 1}
                        </span>
                        {relationshipStreak > 0 && (
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-pink-100 to-purple-100 text-purple-700">
                            💕 {relationshipStreak} day streak
                          </span>
                        )}
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getMoodColor(companionMood)} bg-white/30`}>
                          Mood: {companionMood} {getMoodEmoji(companionMood)}
                        </span>
                        {/* Explorer Link */}
                        {nftData && (
                          <div className="mt-2">
                            <a
                              href={`https://testnet.monadexplorer.com/token/${CONTRACT_ADDRESSES.NFT}?tab=inventory`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200 transition-colors"
                            >
                              🔍 View NFT #{nftData?.toString()}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Affection Bar */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Affection</span>
                        <span className="text-sm font-bold text-pink-600">{companion?.affection || 5000}/10000</span>
                      </div>
                      <div className="w-full bg-pink-100 rounded-full h-3 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${((companion?.affection || 5000) / 10000) * 100}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full"
                        />
                      </div>
                    </div>

                    <p className="text-gray-600 italic text-sm md:text-base">
                      {companion?.personality || "Getting to know you... 💕"}
                    </p>

                  </div>
                ) : (
                  <div className="text-center space-y-4 md:space-y-6 px-2">
                    <div className="text-6xl md:text-8xl mb-4">🌱</div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">Meet Your Companion</h2>
                      <p className="text-gray-600 mb-6 md:mb-8 text-sm md:text-base">
                        Begin your heartfelt journey by creating your AI companion. They'll guide you through DeFi with care and understanding.
                      </p>
                      <button
                        onClick={mintCompanion}
                        disabled={isWriting || isConfirming}
                        className="px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-medium hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 transition-all text-base md:text-lg"
                      >
                        {isConfirming ? 'Confirming... ⏳' : isWriting ? 'Creating... 💖' : '💖 Create My Companion'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Section */}
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-4 md:p-6 border border-pink-200 shadow-xl">
                <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4">💬 Heart to Heart</h3>

                {/* Chat Messages */}
                <div className="bg-pink-50 rounded-2xl p-3 md:p-4 h-64 md:h-80 overflow-y-auto mb-4 space-y-3">
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

                {/* Pending Swap Indicator */}
                {pendingSwap && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="mx-auto my-2 p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl border border-purple-200"
                  >
                    <div className="flex items-center justify-center gap-2 text-sm text-purple-700">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                      <span className="font-medium">
                        Luna is preparing: {pendingSwap.amount} {pendingSwap.fromToken === TOKEN_ADDRESSES.MON ? 'MON' : 'USDT'}
                        → {pendingSwap.toToken === TOKEN_ADDRESSES.MON ? 'MON' : 'USDT'} ✨
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Chat Input */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder={conversationalMode
                      ? "Try: 'Hey Luna, I want to swap 100 MON for USDT' or just chat..."
                      : "Share your thoughts..."}
                    className="flex-1 px-3 md:px-4 py-2 rounded-xl border border-pink-200 focus:border-pink-400 focus:outline-none bg-white/70 text-sm md:text-base"
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 transition-all text-sm md:text-base"
                  >
                    💕 Send
                  </button>
                </div>
              </div>
              </div>
            </motion.div>
          </div>

          {/* Swap Section - Always show below companion if companion exists */}
          {nftBalance && Number(nftBalance) > 0 && (
            <div>
            <motion.div
              key="swap"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 border border-pink-200 shadow-xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">💫 Let's Swap Together</h2>

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
                      <select
                        value={fromToken}
                        onChange={(e) => setFromToken(e.target.value as any)}
                        className="w-full bg-white/70 rounded-xl p-4 border border-pink-200 focus:border-pink-400 focus:outline-none font-medium text-gray-800"
                      >
                        <option value={TOKEN_ADDRESSES.MON}>MON</option>
                        <option value={TOKEN_ADDRESSES.USDT}>USDT</option>
                        <option value={TOKEN_ADDRESSES.USDC}>USDC</option>
                        <option value={TOKEN_ADDRESSES.WETH}>WETH</option>
                        <option value={TOKEN_ADDRESSES.WBTC}>WBTC</option>
                      </select>
                      <div className="text-sm text-gray-600 mt-1 px-1">
                        Balance: {fromTokenBalance ? formatEther(fromTokenBalance as bigint) : '0'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                      <select
                        value={toToken}
                        onChange={(e) => setToToken(e.target.value as any)}
                        className="w-full bg-white/70 rounded-xl p-4 border border-green-200 focus:border-green-400 focus:outline-none font-medium text-gray-800"
                      >
                        <option value={TOKEN_ADDRESSES.USDT}>USDT</option>
                        <option value={TOKEN_ADDRESSES.MON}>MON</option>
                        <option value={TOKEN_ADDRESSES.USDC}>USDC</option>
                        <option value={TOKEN_ADDRESSES.WETH}>WETH</option>
                        <option value={TOKEN_ADDRESSES.WBTC}>WBTC</option>
                      </select>
                      <div className="text-sm text-gray-600 mt-1 px-1">
                        Balance: {toTokenBalance ? formatEther(toTokenBalance as bigint) : '0'}
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

                  {/* Rebate Information */}
                  {companion && companion.affection >= 8000 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-2xl">💰</span>
                        <div className="text-center">
                          <p className="text-green-800 font-semibold">High Affection Bonus!</p>
                          <p className="text-green-600 text-sm">Luna loves you deeply ≥8000 = 0.25% rebate! 💕</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {companion && companion.affection < 8000 && companion.affection >= 6000 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-2xl">💛</span>
                        <div className="text-center">
                          <p className="text-yellow-800 font-semibold">Almost There!</p>
                          <p className="text-yellow-600 text-sm">Reach 8000+ affection for 0.25% rebates!</p>
                        </div>
                      </div>
                    </div>
                  )}

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
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
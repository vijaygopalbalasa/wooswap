# 🎮 WooSwap User Guide - Complete Testing Instructions

Welcome to **WooSwap**, the world's first gamified DEX where you build relationships with AI companions to unlock trading rebates on Monad testnet!

## 🚀 Quick Start (5 Minutes)

### Step 1: Access the Frontend
The frontend is now running at: **http://localhost:3001**

### Step 2: Setup Monad Testnet in MetaMask

1. **Add Monad Testnet Network:**
   - Network Name: `Monad Testnet`
   - RPC URL: `https://testnet-rpc.monad.xyz`
   - Chain ID: `10143`
   - Symbol: `MON`
   - Explorer: `https://testnet.monadexplorer.com`

2. **Get Test Tokens:**
   - Visit: https://testnet.monad.xyz
   - Connect your wallet and request test MON tokens
   - You'll need MON for gas fees and testing

### Step 3: Connect Your Wallet
1. Click the "Connect Wallet" button in the top right
2. Select MetaMask (or your preferred wallet)
3. Approve the connection to Monad Testnet

---

## 🎯 **DEPLOYED CONTRACTS** (Production Ready)

All contracts are **LIVE** on Monad Testnet:

- **🎨 WooRelationNFT**: `0xb00F943698687E916325a706dCaB6998B2187567`
- **🛡️ WooSwapGuard**: `0x46ae94Fb7f129aCAA8932137b2226ab3b81988A7`
- **💰 WooLP (Liquidity Pool)**: `0x85DA3317C78246D57203c6134BaDB372353e7701`
- **🔄 WooRouter (Main Contract)**: `0x449c4eC0676c71c177Ca7B4545285b853C07B685`
- **🦄 UniswapV2Router02**: `0xfB8e1C3b833f9E67a71C859a132cf783b645e436`

**Token Addresses:**
- **MON Token**: `0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701`
- **USDT Token**: `0x88b8E2161DEDC77EF4ab7585569D2415a1C1055D`

---

## 🎮 **How to Test All Features**

### 1. **Create Your AI Companion (Mint NFT)**
1. Click "Mint Your Companion"
2. Choose a companion type (each has unique traits)
3. Confirm the transaction (costs small gas fee)
4. Your NFT will appear with affection score: **0/10000**

### 2. **Build Affection Through Quests**
1. Click "Generate Quest" to get AI-generated challenges
2. Complete quests to earn **+200 affection points**
3. Educational quests give bonus **+50 points**
4. Each quest is unique, powered by OpenAI GPT-4

### 3. **Send Gifts to Your Companion**
1. Use the "Send Gift" feature
2. Send MON tokens to increase affection
3. **100 affection per 1 MON** sent (max +1000 per gift)
4. Gifts create emotional bonds with your AI companion

### 4. **Unlock Trading Rebates**
- **Affection 0-2499**: ❌ No trading allowed
- **Affection 2500-4999**: ✅ Basic trading unlocked
- **Affection 5000-7499**: 🎁 0.1% rebate on trades
- **Affection 7500-10000**: 🎉 0.25% rebate on trades

### 5. **Perform Swaps with Rebates**
1. Once you have sufficient affection (2500+), the swap interface unlocks
2. Select tokens to swap (MON ↔ USDT)
3. Enter amount and confirm swap
4. **Earn rebates** from the 1% fee pool based on your affection level!

### 6. **Experience Advanced Features**
- **Rapid Swap Penalty**: Trading within 60 seconds = -500 affection
- **Quest Validation**: Time-limited quests with expiration
- **Real Uniswap Integration**: Actual DEX functionality
- **Fee Collection**: 1% fees go to liquidity providers

---

## 🧪 **Testing Scenarios**

### Scenario A: New User Journey
1. Connect wallet → Mint NFT → Complete quest → Send gift → Swap tokens

### Scenario B: Affection Management
1. Build affection to 2500 → Test basic swaps
2. Build to 5000 → Test 0.1% rebates
3. Build to 7500+ → Test 0.25% rebates

### Scenario C: Edge Cases
1. Try swapping with low affection (should be blocked)
2. Test rapid swapping penalty
3. Test quest expiration
4. Test gift limits

---

## 🎨 **UI/UX Features**

- **🌈 Gamified Interface**: DaisyUI components with smooth animations
- **📱 Responsive Design**: Works on desktop and mobile
- **🎯 Real-time Updates**: Live affection scores and balances
- **💫 Framer Motion**: Smooth transitions and interactions
- **🎪 Toast Notifications**: User-friendly success/error messages

---

## 🔧 **Technical Stack**

**Frontend:**
- Next.js 14.2.3 with TypeScript
- Wagmi 2.10.2 + Viem 2.13.8 (latest Web3 stack)
- TailwindCSS + DaisyUI for styling
- ConnectKit for wallet connections

**Smart Contracts:**
- Solidity 0.8.25 with gas optimization
- OpenZeppelin 5.0.0 for security standards
- All contracts <24kB for efficiency
- Real Uniswap V2 integration

**Deployment:**
- Foundry for contract deployment
- All contracts verified and production-ready
- Real RPC endpoints, no mocks

---

## 🚨 **Troubleshooting**

### Common Issues:

1. **"Transaction Failed"**
   - Ensure you have enough MON for gas
   - Check you're connected to Monad Testnet (Chain ID: 10143)

2. **"Insufficient Affection"**
   - Complete more quests or send gifts
   - You need 2500+ affection to trade

3. **"Network Error"**
   - Switch to Monad Testnet in MetaMask
   - Try the fallback RPC: `https://rpc.testnet.monad.xyz`

4. **"Contract Not Found"**
   - The contracts are live on Monad Testnet
   - Clear browser cache and refresh

### Get Help:
- Check transactions on: https://testnet.monadexplorer.com
- Verify contract addresses match the deployed ones above
- Ensure wallet is connected to the correct network

---

## 🎉 **What Makes WooSwap Unique**

1. **🤖 AI-Powered Quests**: Real OpenAI integration for unique challenges
2. **💕 Emotional Trading**: Build relationships to unlock better rates
3. **🎮 Gamification**: Turn DeFi into an engaging experience
4. **💎 Real Rebates**: Actual money-saving benefits
5. **🏗️ Production Ready**: No mocks, all real functionality

---

## 📊 **Success Metrics**

Test these key performance indicators:

✅ **Wallet Connection**: Should work with MetaMask, WalletConnect, etc.
✅ **NFT Minting**: Creates unique companions with 0 initial affection
✅ **Quest Generation**: AI generates unique, contextual challenges
✅ **Affection System**: Points increase/decrease based on actions
✅ **Swap Gating**: Trading blocked below 2500 affection
✅ **Rebate Calculation**: Correct percentages based on affection level
✅ **Fee Collection**: 1% fees properly distributed
✅ **Real-time Updates**: UI updates immediately after transactions

---

## 🔮 **Future Enhancements**

Based on your feedback, we can add:
- More companion types and personalities
- Advanced quest categories
- Social features (companion interactions)
- Staking mechanisms
- Cross-chain bridging
- Mobile app version

---

**Ready to start your WooSwap journey? Visit http://localhost:3001 and begin building your AI relationship! 💖**

*Built for the Monad ecosystem with production-grade security and real functionality.*
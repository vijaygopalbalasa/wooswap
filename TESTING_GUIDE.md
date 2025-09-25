# 🧪 WooSwap Testing Guide

## 🚀 Quick Test Setup

### Prerequisites
- MetaMask or compatible wallet installed
- Node.js v18+ and npm v8+
- OpenAI API key (for AI girlfriend conversations)

### Environment Setup
```bash
cd /path/to/woo-swap/packages/nextjs
npm install
npm run build
npm run dev
```

Visit: **http://localhost:3000**

---

## 📋 Comprehensive Test Scenarios

### 🎯 Test 1: Complete New User Journey
**Objective**: Test the entire user onboarding flow

**Steps**:
1. Open browser to `http://localhost:3000`
2. Click "Connect Wallet 💖" button
3. Connect MetaMask wallet
4. Verify Monad testnet is added automatically
5. Get test MON from https://testnet.monad.xyz
6. Click "Create My Companion" button
7. Confirm transaction in MetaMask
8. Wait for transaction confirmation
9. Observe Luna's introduction message

**Expected Results**:
- ✅ Wallet connects successfully
- ✅ Monad testnet appears in network list
- ✅ NFT minting transaction succeeds
- ✅ Explorer link shows new NFT
- ✅ Affection level starts at 5000/10000
- ✅ Luna displays personalized greeting

**Common Issues**:
- Network not added: Manually add Monad testnet
- Insufficient balance: Get MON from faucet first
- Transaction fails: Check gas settings

---

### 💬 Test 2: AI Conversation System
**Objective**: Verify GPT-4o-mini integration and personality system

**Test Conversations**:
```bash
# Test basic greeting
Input: "Hi Luna!"
Expected: Personalized response based on affection level

# Test trading intent detection
Input: "I want to swap 5 MON for USDT"
Expected: Educational question about trading motivation

# Test DeFi education
Input: "What is slippage?"
Expected: Clear explanation with follow-up questions

# Test emotional responses
Input: "I love you Luna"
Expected: Affection-appropriate romantic response

# Test educational quest
Input: "I need to trade now"
Expected: Educational quiz before allowing swap
```

**Verification Steps**:
1. Type each message in the chat interface
2. Verify Luna's responses are contextual and educational
3. Check that affection level changes based on interactions
4. Confirm quest hashes are generated for educational responses

---

### 🔄 Test 3: Swap Execution with Different Affection Levels
**Objective**: Test trading permissions based on relationship status

**Setup**: Create multiple test scenarios by manipulating affection

**Test 3A: Low Affection (<5000)**
```bash
# Prerequisites: Companion with <5000 affection
1. Input: "I want to swap 1 MON for USDT"
2. Luna should require educational quest completion
3. Answer Luna's questions correctly
4. Attempt swap with generated quest hash
5. Verify swap executes after quest completion
```

**Test 3B: High Affection (>8000)**
```bash
# Prerequisites: Companion with >8000 affection (use admin functions if needed)
1. Input: "I want to swap 1 MON for USDT"
2. Luna should approve swap immediately
3. Execute swap transaction
4. Check wallet for LP token rebates (0.25% of output)
5. Verify Luna's celebratory response
```

**Expected Results**:
- Low affection: Educational quest required
- High affection: Immediate approval + rebates
- All swaps: Affection level updates post-transaction

---

### 😡 Test 4: Emotional State System
**Objective**: Test Luna's mood changes and their effect on trading

**Test 4A: Jealousy Trigger**
```bash
1. Make rapid swaps within 60 seconds (multiple transactions)
2. Observe Luna becoming jealous/upset
3. Attempt another swap
4. Verify Luna refuses to help until reconciliation
5. Send apology message
6. Verify mood improvement
```

**Test 4B: Breakup Scenario**
```bash
1. Continue rapid trading until affection reaches 0
2. Verify 30-minute trading lockout activates
3. Try to trade during lockout (should fail)
4. Wait 30 minutes or use reconciliation feature
5. Verify affection increases by +300
6. Confirm trading privileges restored
```

---

### 💰 Test 5: Rebate System Verification
**Objective**: Verify economic incentives and LP token minting

**Prerequisites**:
- Companion with 8000+ affection
- At least 2 MON in wallet
- USDT tokens for reverse swaps

**Steps**:
1. Note starting LP token balance (should be 0)
2. Execute MON → USDT swap for exactly 1 MON
3. Calculate expected rebate: 0.25% of USDT output
4. Check wallet for new LP tokens
5. Verify rebate amount matches calculation
6. Execute reverse swap (USDT → MON)
7. Verify second rebate receipt

**Expected Results**:
- LP tokens minted to wallet after each high-affection swap
- Rebate amount = 0.25% of swap output
- Luna celebrates rebate distribution
- Pool balance decreases by rebate amount

---

### 🔄 Test 6: Quest Hash Validation
**Objective**: Test cryptographic quest verification system

**Technical Test**:
```bash
1. Generate educational quest through conversation
2. Note the questId and questHash from API response
3. Use quest hash in swap transaction
4. Verify on-chain quest validation passes
5. Try to reuse same quest hash (should fail)
6. Verify quest expiration (10 minutes)
```

**API Testing**:
```bash
# Test quest API directly
curl -X POST http://localhost:3000/api/quest \
  -H "Content-Type: application/json" \
  -d '{
    "user": "0xYourAddress",
    "lastAffection": 4000,
    "lastSwapTime": 1640995200,
    "userInput": "I want to swap MON for USDT"
  }'

# Verify response format
Expected:
{
  "reply": "Educational message from Luna",
  "code": 150,
  "questId": "uuid-v4",
  "questHash": "0x...",
  "validUntil": timestamp,
  "eduMode": true,
  "swapIntent": {...}
}
```

---

### 📱 Test 7: Mobile Responsiveness
**Objective**: Verify mobile-first design works across devices

**Device Testing**:
```bash
# Test on multiple screen sizes
1. Desktop (1920x1080)
2. Tablet (768x1024)
3. Mobile (375x667)
4. Small mobile (320x568)

# Verify for each size:
- Header navigation works
- Companion creation button accessible
- Chat interface scrollable
- Swap interface usable
- All text readable
- Buttons properly sized
```

---

### 🔧 Test 8: Error Handling
**Objective**: Test graceful failure handling

**Network Error Tests**:
```bash
1. Disconnect wallet during transaction
2. Switch networks mid-transaction
3. Run out of gas during mint
4. OpenAI API timeout/failure
5. Invalid transaction parameters
```

**Expected Behaviors**:
- Clear error messages displayed
- Luna provides helpful guidance
- No app crashes or freezes
- Fallback responses when AI fails
- Transaction state properly reset

---

### ⚡ Test 9: Monad Parallel Execution Demo
**Objective**: Verify parallel transaction showcasing

**Advanced Test**:
```bash
1. Monitor network tab during swap execution
2. Verify multiple transactions happen concurrently:
   - Companion mood update
   - Swap execution
   - Affection score update
   - Rebate calculation/minting
   - Quest validation

3. Measure gas usage per transaction
4. Verify total gas < 400k for full operation
5. Confirm all transactions complete successfully
```

---

### 🎮 Test 10: Complete Relationship Journey
**Objective**: Test full relationship progression over time

**Long-term Test**:
```bash
Day 1: Create companion (5000 affection)
- Complete 3 educational quests
- Make 2 successful swaps
- End day at ~5500 affection

Day 2: Relationship building
- Daily check-in conversation
- Complete 2 more quests
- Receive streak bonus
- End day at ~6200 affection

Day 3: Advanced trading
- Multiple swaps with education
- Test different conversation topics
- End day at ~7000 affection

Day 7: High affection benefits
- Reach 8000+ affection
- Receive first rebates
- Test all advanced features
- Luna displays "soulmate" behavior
```

---

## 🐛 Common Issues & Solutions

### Issue: "No connect wallet button"
**Solution**: Clear browser cache, refresh page, check MetaMask installation

### Issue: "Transaction failed - insufficient funds"
**Solution**: Get test MON from faucet: https://testnet.monad.xyz

### Issue: "Luna not responding"
**Solution**: Check OpenAI API key in .env.local, verify internet connection

### Issue: "Companion already exists"
**Solution**: User already has NFT, should see companion profile instead

### Issue: "Quest expired"
**Solution**: Quests expire after 10 minutes, request new educational quest

### Issue: "Swap blocked by companion"
**Solution**: Complete educational quest or improve relationship (increase affection)

---

## 📊 Test Checklist

### Basic Functionality
- [ ] Server starts on port 3000
- [ ] Wallet connection works
- [ ] Monad testnet auto-added
- [ ] Companion creation succeeds
- [ ] AI responses generated
- [ ] Swaps execute successfully

### AI Features
- [ ] Educational quests generated
- [ ] Mood states change appropriately
- [ ] Affection levels tracked correctly
- [ ] Personality consistent with relationship stage
- [ ] Quest hashes validate on-chain

### Economic Features
- [ ] Rebates distributed to high-affection users
- [ ] LP tokens minted correctly
- [ ] Fee collection working
- [ ] Anti-rapid trading penalties applied

### User Experience
- [ ] Mobile responsive design
- [ ] Error messages clear and helpful
- [ ] Loading states appropriate
- [ ] Navigation intuitive
- [ ] Accessibility standards met

### Technical Performance
- [ ] Page loads in <3 seconds
- [ ] AI responses in <5 seconds
- [ ] Gas usage optimized (<80k per interaction)
- [ ] No memory leaks during extended use
- [ ] Concurrent transactions handled properly

---

## 🎯 Success Criteria

**A successful test run should demonstrate**:
1. **Complete User Journey**: From wallet connection to earning rebates
2. **AI Integration**: Educational conversations that feel natural and helpful
3. **Economic Alignment**: Clear financial incentives for good behavior
4. **Technical Innovation**: Monad's parallel execution capabilities
5. **Emotional Engagement**: Users develop attachment to their AI companion

**Key Metrics**:
- Companion creation success rate: >95%
- AI response relevance: User can have educational conversations
- Swap execution success: >95% with proper setup
- Mobile usability: All features work on mobile devices
- Error recovery: Graceful handling of all failure scenarios

---

*Ready to test the future of emotional DeFi? Start with Test 1 and work your way through the complete experience! 💖*
import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { LRUCache } from 'lru-cache';
import { keccak256, encodeAbiParameters, parseAbiParameters } from 'viem';
import { v4 as uuidv4 } from 'uuid';

interface QuestRequest {
  user: string;
  lastAffection: number;
  lastSwapTime: number;
  userInput?: string;
}

interface QuestResponse {
  reply: string;
  code: number;
  questId: string;
  questHash: string;
  validUntil: number;
  eduMode?: boolean;
}

interface AIResponse {
  reply: string;
  code: number;
  questId: string;
  eduMode?: boolean;
}

const cache = new LRUCache<string, QuestResponse>({
  max: 100,
  ttl: 1000 * 600, // 10 minutes
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const fallbackQuests = [
  {
    reply: "Why this swap? A: Learn (edu +50) B: Fun (+200) C: Risky (-200) 🤔",
    code: 200,
    questId: 'fallback1',
    eduMode: true,
  },
  {
    reply: "Quick quiz: Slippage means? A: Price change B: Gas fee C: Both (+100) 📚",
    code: 100,
    questId: 'fallback2',
    eduMode: true,
  },
  {
    reply: "Gift me 1 MON for luck? A: Sure (+500) B: No way (-100) C: Maybe (+200) 🎁",
    code: 300,
    questId: 'fallback3',
  },
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<QuestResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user, lastAffection, lastSwapTime, userInput }: QuestRequest = req.body;

    if (!user || lastAffection === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check cache first
    const cacheKey = `${user}-${lastAffection}-${Date.now().toString().slice(0, -4)}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    let questResponse: AIResponse;

    try {
      // Determine companion mood based on affection
      let companionMood = 'neutral';
      if (lastAffection >= 8000) companionMood = 'loving';
      else if (lastAffection >= 6000) companionMood = 'friendly';
      else if (lastAffection >= 3000) companionMood = 'cautious';
      else if (lastAffection > 0) companionMood = 'disappointed';
      else companionMood = 'broken';

      const timeSinceSwap = Date.now() / 1000 - lastSwapTime;
      const hoursAgo = Math.floor(timeSinceSwap / 3600);

      const systemPrompt = `You are a neutral AI Wallet Companion (mentor/friend/guardian). Goal: Educate on swap risks (slippage/gas/MEV), approve via quick fun interactions.

Rules:
- Reply <50 words + emoji
- Always include 1 question/input for user
- Edu-Mode: Explain 1 risk (slippage/gas/MEV/liquidity)
- Scoring: Compliment/correct answer: +100-300, Gift offers: +200-500, Rush/ignore education: -200-500
- Current mood: ${companionMood} (affection: ${lastAffection}/10000)
- Last swap: ${hoursAgo}h ago

Return JSON only: {"reply": "...", "code": +/-int, "questId": "uuid-v4", "eduMode": true/false}`;

      const userMessage = userInput
        ? `User says: "${userInput}"`
        : `Affection: ${lastAffection}. Last swap: ${hoursAgo}h ago. Generate a quest.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.8,
        max_tokens: 120,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) throw new Error('No response from OpenAI');

      questResponse = JSON.parse(content);

      // Validate response
      if (!questResponse.reply || typeof questResponse.code !== 'number' || !questResponse.questId) {
        throw new Error('Invalid AI response format');
      }

    } catch (error) {
      console.error('OpenAI error:', error);

      // Use fallback quest
      const fallback = fallbackQuests[Math.floor(Math.random() * fallbackQuests.length)];
      questResponse = {
        ...fallback,
        questId: uuidv4(),
      };
    }

    // Generate quest hash for on-chain verification
    const questHash = keccak256(
      encodeAbiParameters(
        parseAbiParameters('string, int256'),
        [questResponse.questId, BigInt(questResponse.code)]
      )
    );

    const validUntil = Math.floor(Date.now() / 1000) + 600; // Valid for 10 minutes

    const response: QuestResponse = {
      reply: questResponse.reply,
      code: questResponse.code,
      questId: questResponse.questId,
      questHash,
      validUntil,
      eduMode: questResponse.eduMode,
    };

    // Cache the response
    cache.set(cacheKey, response);

    return res.json(response);

  } catch (error) {
    console.error('Quest API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
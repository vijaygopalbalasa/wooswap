import {
  WooSwapExecutedEvent,
  BreakUpEvent,
  AffectionUpdatedEvent,
  RebatePaidEvent
} from './types';
import Redis from 'ioredis';
import axios from 'axios';

// Redis client for data storage
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

// Twitter API configuration
const TWITTER_API_BASE = 'https://api.twitter.com/2';
const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER;

interface UserStats {
  address: string;
  totalVolume: number;
  swapCount: number;
  currentAffection: number;
  totalRebates: number;
  lastSwapTime: number;
  breakupCount: number;
}

// Helper function to get user stats
async function getUserStats(userAddress: string): Promise<UserStats> {
  const key = `user:${userAddress}`;
  const data = await redis.get(key);

  if (data) {
    return JSON.parse(data);
  }

  return {
    address: userAddress,
    totalVolume: 0,
    swapCount: 0,
    currentAffection: 5000, // Default starting affection
    totalRebates: 0,
    lastSwapTime: 0,
    breakupCount: 0,
  };
}

// Helper function to save user stats
async function saveUserStats(stats: UserStats): Promise<void> {
  const key = `user:${stats.address}`;
  await redis.set(key, JSON.stringify(stats));

  // Also add to leaderboard
  await redis.zadd('leaderboard:volume', stats.totalVolume, stats.address);
  await redis.zadd('leaderboard:affection', stats.currentAffection, stats.address);
}

// Helper function to post breakup tweet
async function postBreakupTweet(userAddress: string): Promise<void> {
  if (!TWITTER_BEARER_TOKEN) {
    console.log('Twitter bearer token not configured, skipping tweet');
    return;
  }

  const tweetText = `💔 ${userAddress.slice(0, 6)}...${userAddress.slice(-4)} got dumped for rushing swaps! Time to reconcile on WooSwap. #DeFiEdu #Monad #WooSwap`;

  try {
    await axios.post(
      `${TWITTER_API_BASE}/tweets`,
      { text: tweetText },
      {
        headers: {
          'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`Posted breakup tweet for user ${userAddress}`);
  } catch (error) {
    console.error('Failed to post breakup tweet:', error);
  }
}

// Event handlers
export const handleWooSwapExecuted = async (event: WooSwapExecutedEvent) => {
  const { user, tokenIn, tokenOut, amountIn, amountOut, rebateAmount } = event.params;
  const timestamp = event.block.timestamp;

  console.log(`WooSwap executed: ${user} swapped ${amountIn} for ${amountOut}`);

  // Update user stats
  const stats = await getUserStats(user);
  stats.totalVolume += parseFloat(amountIn.toString());
  stats.swapCount += 1;
  stats.totalRebates += parseFloat(rebateAmount.toString());
  stats.lastSwapTime = timestamp;

  await saveUserStats(stats);

  // Store swap event for analytics
  const swapKey = `swap:${event.transactionHash}:${event.logIndex}`;
  await redis.set(swapKey, JSON.stringify({
    user,
    tokenIn,
    tokenOut,
    amountIn: amountIn.toString(),
    amountOut: amountOut.toString(),
    rebateAmount: rebateAmount.toString(),
    timestamp,
    blockNumber: event.block.number,
  }));

  // Add to daily volume tracking
  const dateKey = new Date(timestamp * 1000).toISOString().split('T')[0];
  await redis.zincrby(`daily_volume:${dateKey}`, parseFloat(amountIn.toString()), user);
};

export const handleBreakUp = async (event: BreakUpEvent) => {
  const { user, reason } = event.params;
  const timestamp = event.block.timestamp;

  console.log(`Breakup detected: ${user} - ${reason}`);

  // Update user stats
  const stats = await getUserStats(user);
  stats.breakupCount += 1;
  stats.currentAffection = 0; // Breakup sets affection to 0

  await saveUserStats(stats);

  // Store breakup event
  const breakupKey = `breakup:${event.transactionHash}:${event.logIndex}`;
  await redis.set(breakupKey, JSON.stringify({
    user,
    reason,
    timestamp,
    blockNumber: event.block.number,
  }));

  // Post breakup tweet
  await postBreakupTweet(user);

  // Add to breakup leaderboard (hall of shame)
  await redis.zincrby('leaderboard:breakups', 1, user);
};

export const handleAffectionUpdated = async (event: AffectionUpdatedEvent) => {
  const { tokenId, newAffection } = event.params;

  console.log(`Affection updated for token ${tokenId}: ${newAffection}`);

  // We'd need to map tokenId to user address here
  // This would require additional indexing of NFT transfers/mints
  const affectionKey = `affection:${tokenId}`;
  await redis.set(affectionKey, JSON.stringify({
    tokenId: tokenId.toString(),
    affection: newAffection.toString(),
    timestamp: event.block.timestamp,
    blockNumber: event.block.number,
  }));
};

export const handleRebatePaid = async (event: RebatePaidEvent) => {
  const { user, amount, affection } = event.params;

  console.log(`Rebate paid: ${amount} to ${user} (affection: ${affection})`);

  // Track total rebates paid
  await redis.zincrby('total_rebates', parseFloat(amount.toString()), 'protocol');

  // Store rebate event
  const rebateKey = `rebate:${event.transactionHash}:${event.logIndex}`;
  await redis.set(rebateKey, JSON.stringify({
    user,
    amount: amount.toString(),
    affection: affection.toString(),
    timestamp: event.block.timestamp,
    blockNumber: event.block.number,
  }));
};

// GraphQL resolvers for querying indexed data
export const resolvers = {
  Query: {
    topUsers: async (_: any, { limit = 10 }: { limit?: number }) => {
      // Get top users by volume
      const topByVolume = await redis.zrevrange('leaderboard:volume', 0, limit - 1, 'WITHSCORES');

      const users = [];
      for (let i = 0; i < topByVolume.length; i += 2) {
        const address = topByVolume[i];
        const volume = parseFloat(topByVolume[i + 1]);
        const stats = await getUserStats(address);

        users.push({
          address,
          totalVolume: volume,
          swapCount: stats.swapCount,
          currentAffection: stats.currentAffection,
          totalRebates: stats.totalRebates,
          breakupCount: stats.breakupCount,
        });
      }

      return users;
    },

    userStats: async (_: any, { address }: { address: string }) => {
      return await getUserStats(address);
    },

    dailyVolume: async (_: any, { date }: { date: string }) => {
      const volumes = await redis.zrevrange(`daily_volume:${date}`, 0, -1, 'WITHSCORES');

      const result = [];
      for (let i = 0; i < volumes.length; i += 2) {
        result.push({
          user: volumes[i],
          volume: parseFloat(volumes[i + 1]),
        });
      }

      return result;
    },

    protocolStats: async () => {
      const totalRebates = await redis.zscore('total_rebates', 'protocol') || 0;
      const totalUsers = await redis.zcard('leaderboard:volume');
      const totalBreakups = await redis.zcard('leaderboard:breakups');

      return {
        totalRebates: parseFloat(totalRebates.toString()),
        totalUsers,
        totalBreakups,
      };
    },
  },
};

// Cleanup function
export const cleanup = async () => {
  await redis.disconnect();
};
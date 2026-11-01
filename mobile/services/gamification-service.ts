import { getDb } from './database';
import {
  DEFAULT_ACHIEVEMENTS,
  DEFAULT_SHOP_ITEMS,
  LOCAL_USER_ID,
  RANKS,
} from '@/constants/gamification';

export interface UserRank {
  userId: string;
  currentRank: number;
  totalPoints: number;
  rankName: string;
  weeklyPoints: number;
  monthlyPoints: number;
  bestStreak: number;
  currentStreak: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  pointsReward: number;
  badgeIcon: string;
  isCompleted: boolean;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  pointsCost: number;
  unlockRank: number;
  canBuy: boolean;
  purchasable: boolean;
}

interface RankRow {
  user_id: string;
  current_rank: number;
  total_points: number;
  rank_name: string;
  weekly_points: number;
  monthly_points: number;
  best_streak: number;
  current_streak: number;
}

interface AchievementRow {
  id: string;
  achievement_name: string;
  description: string | null;
  points_reward: number;
  badge_icon: string | null;
  is_completed: number;
}

interface ShopRow {
  id: string;
  reward_name: string;
  description: string | null;
  icon: string | null;
  points_cost: number;
  unlock_rank: number;
}

function id(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function seedDefaults(userId: string): Promise<void> {
  const db = await getDb();
  for (const [achievementId, name, description, points, icon] of DEFAULT_ACHIEVEMENTS) {
    await db.runAsync(
      `INSERT OR IGNORE INTO achievements
       (id, user_id, achievement_name, description, points_reward, badge_icon)
       VALUES (?, ?, ?, ?, ?, ?)`,
      achievementId,
      userId,
      name,
      description,
      points,
      icon,
    );
  }
  for (const [itemId, name, description, icon, cost, unlockRank] of DEFAULT_SHOP_ITEMS) {
    await db.runAsync(
      `INSERT OR IGNORE INTO rewards_shop
       (id, reward_name, description, reward_type, points_cost, icon, unlock_rank)
       VALUES (?, ?, ?, 'cosmetic', ?, ?, ?)`,
      itemId,
      name,
      description,
      cost,
      icon,
      unlockRank,
    );
  }
}

export async function getUserRank(userId = LOCAL_USER_ID): Promise<UserRank> {
  const db = await getDb();
  const existing = await db.getFirstAsync<RankRow>(
    'SELECT user_id, current_rank, total_points, rank_name, weekly_points, monthly_points, best_streak, current_streak FROM user_ranks WHERE user_id = ?',
    userId,
  );
  if (existing) {
    return {
      userId: existing.user_id,
      currentRank: existing.current_rank,
      totalPoints: existing.total_points,
      rankName: existing.rank_name,
      weeklyPoints: existing.weekly_points,
      monthlyPoints: existing.monthly_points,
      bestStreak: existing.best_streak,
      currentStreak: existing.current_streak,
    };
  }
  const rank = RANKS[0];
  await db.runAsync(
    `INSERT INTO user_ranks
     (id, user_id, current_rank, total_points, rank_name, created_at, updated_at)
     VALUES (?, ?, ?, 0, ?, datetime('now'), datetime('now'))`,
    id('rank'),
    userId,
    rank.level,
    rank.name,
  );
  await seedDefaults(userId);
  return {
    userId,
    currentRank: rank.level,
    totalPoints: 0,
    rankName: rank.name,
    weeklyPoints: 0,
    monthlyPoints: 0,
    bestStreak: 0,
    currentStreak: 0,
  };
}

export async function getAchievements(userId = LOCAL_USER_ID): Promise<Achievement[]> {
  await getUserRank(userId);
  const db = await getDb();
  const rows = await db.getAllAsync<AchievementRow>(
    `SELECT id, achievement_name, description, points_reward, badge_icon, is_completed
     FROM achievements WHERE user_id = ? ORDER BY is_completed DESC, id ASC`,
    userId,
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.achievement_name,
    description: row.description ?? '',
    pointsReward: row.points_reward,
    badgeIcon: row.badge_icon ?? '🏅',
    isCompleted: row.is_completed === 1,
  }));
}

export async function getShopItems(userId = LOCAL_USER_ID): Promise<ShopItem[]> {
  const rank = await getUserRank(userId);
  const db = await getDb();
  const rows = await db.getAllAsync<ShopRow>(
    `SELECT id, reward_name, description, icon, points_cost, unlock_rank
     FROM rewards_shop ORDER BY points_cost ASC`,
  );
  return rows.map((row) => {
    const canBuy = rank.currentRank >= row.unlock_rank;
    return {
      id: row.id,
      name: row.reward_name,
      description: row.description ?? '',
      icon: row.icon ?? '🎁',
      pointsCost: row.points_cost,
      unlockRank: row.unlock_rank,
      canBuy,
      purchasable: canBuy && rank.totalPoints >= row.points_cost,
    };
  });
}

export async function purchaseReward(
  rewardId: string,
  userId = LOCAL_USER_ID,
): Promise<{ success: boolean; message: string }> {
  const rank = await getUserRank(userId);
  const items = await getShopItems(userId);
  const item = items.find((candidate) => candidate.id === rewardId);
  if (!item) return { success: false, message: 'Reward not found.' };
  if (!item.canBuy) return { success: false, message: `Reach rank ${item.unlockRank} to unlock this reward.` };
  if (rank.totalPoints < item.pointsCost) return { success: false, message: 'You do not have enough points.' };

  const db = await getDb();
  await db.runAsync(
    'UPDATE user_ranks SET total_points = total_points - ?, updated_at = datetime(\'now\') WHERE user_id = ? AND total_points >= ?',
    item.pointsCost,
    userId,
    item.pointsCost,
  );
  await db.runAsync(
    `INSERT INTO user_purchases (id, user_id, reward_id, points_spent, purchased_at)
     VALUES (?, ?, ?, ?, datetime('now'))`,
    id('purchase'),
    userId,
    rewardId,
    item.pointsCost,
  );
  return { success: true, message: `${item.name} purchased successfully.` };
}

export const gamificationService = {
  getUserRank,
  getAchievements,
  getShopItems,
  purchaseReward,
};

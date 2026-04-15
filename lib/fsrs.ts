import { db } from './db'
import type { Card, ReviewLog, SessionStats } from '@/types'
import { v4 as uuidv4 } from 'uuid'

// ===== 简化版 SM-2 间隔重复算法 =====
// 用户评分 → 下次间隔（天数）
function computeNextInterval(
  rating: 'fail' | 'hard' | 'good' | 'easy',
  prevInterval: number,
  prevEase: number
): { interval: number; ease: number } {
  let ease = prevEase
  let interval = prevInterval

  switch (rating) {
    case 'fail':
      ease = Math.max(1.3, prevEase - 0.2)
      interval = 1
      break
    case 'hard':
      ease = Math.max(1.3, prevEase - 0.15)
      interval = Math.max(1, Math.round(prevInterval * 1.2))
      break
    case 'good':
      if (prevInterval === 0) interval = 1
      else if (prevInterval === 1) interval = 3
      else interval = Math.round(prevInterval * prevEase)
      break
    case 'easy':
      ease = prevEase + 0.15
      if (prevInterval === 0) interval = 3
      else if (prevInterval === 1) interval = 5
      else interval = Math.round(prevInterval * prevEase * 1.3)
      break
  }

  return { interval, ease }
}

export async function getLatestLog(cardId: string): Promise<ReviewLog | undefined> {
  const logs = await db.reviewLogs
    .where('cardId')
    .equals(cardId)
    .toArray()
  if (!logs.length) return undefined
  return logs.sort((a, b) => b.reviewedAt - a.reviewedAt)[0]
}

export async function getDueCards(): Promise<Card[]> {
  const now = Date.now()
  const allCards = await db.cards.toArray()

  const dueLogs = await db.reviewLogs
    .where('due')
    .belowOrEqual(now)
    .toArray()

  const dueCardIds = new Set(dueLogs.map(l => l.cardId))
  const dueCards = (await Promise.all(
    [...dueCardIds].map(id => db.cards.get(id))
  )).filter(Boolean) as Card[]

  const newCards = allCards.filter(c => !dueCardIds.has(c.id)).slice(0, 3)

  return [...dueCards, ...newCards].sort(() => Math.random() - 0.5)
}

export async function submitReview(
  card: Card,
  rating: 'fail' | 'hard' | 'good' | 'easy'
): Promise<void> {
  const lastLog = await getLatestLog(card.id)
  const now = Date.now()

  const prevInterval = lastLog?.interval ?? 0
  const prevEase = lastLog?.ease ?? 2.5

  const { interval, ease } = computeNextInterval(rating, prevInterval, prevEase)

  await db.reviewLogs.add({
    id: uuidv4(),
    cardId: card.id,
    rating: rating === 'fail' ? 1 : rating === 'hard' ? 2 : rating === 'good' ? 3 : 4,
    interval,
    ease,
    due: now + interval * 24 * 60 * 60 * 1000,
    reviewedAt: now,
  })
}

export async function getStats(): Promise<SessionStats> {
  const now = Date.now()
  const todayStart = now - (now % (24 * 60 * 60 * 1000))
  const todayLogs = await db.reviewLogs
    .where('reviewedAt')
    .above(todayStart)
    .toArray()

  return {
    total: await db.cards.count(),
    completed: todayLogs.length,
    correct: todayLogs.filter(l => l.rating >= 3).length,
    wrong: todayLogs.filter(l => l.rating === 1).length,
  }
}

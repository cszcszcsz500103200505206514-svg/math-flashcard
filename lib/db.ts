import Dexie, { type Table } from 'dexie'
import type { Card, ReviewLog, Source } from '@/types'

export class MathFlashDB extends Dexie {
  cards!: Table<Card, string>
  reviewLogs!: Table<ReviewLog, string>
  sources!: Table<Source, string>

  constructor() {
    super('MathFlashDB')
    this.version(1).stores({
      cards: 'id, subjectTag, chapterTag, sourceTag, createdAt',
      reviewLogs: 'id, cardId, due, reviewedAt',
      sources: 'id, name, subject',
    })
  }
}

export const db = new MathFlashDB()

// 默认来源
export async function initDefaultSources() {
  const count = await db.sources.count()
  if (count === 0) {
    await db.sources.bulkAdd([
      { id: '1', name: '武忠祥660', subject: '高等数学', createdAt: Date.now() },
      { id: '2', name: '张宇1000题', subject: '高等数学', createdAt: Date.now() },
      { id: '3', name: '李林880', subject: '高等数学', createdAt: Date.now() },
      { id: '4', name: '汤家凤1800', subject: '高等数学', createdAt: Date.now() },
      { id: '5', name: '线性代数辅导讲义', subject: '线性代数', createdAt: Date.now() },
      { id: '6', name: '王式安概率论', subject: '概率论与数理统计', createdAt: Date.now() },
      { id: '99', name: '自己整理', subject: '通用', createdAt: Date.now() },
    ])
  }
}

'use client'
import { useEffect, useState, useCallback } from 'react'
import { db, initDefaultSources } from '@/lib/db'
import { getDueCards, submitReview, getStats } from '@/lib/fsrs'
import type { Card, ReviewRating, SessionStats } from '@/types'
import Link from 'next/link'

export default function HomePage() {
  const [cards, setCards] = useState<Card[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [stats, setStats] = useState<SessionStats>({ total: 0, completed: 0, correct: 0, wrong: 0 })
  const [loading, setLoading] = useState(true)
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
  const [selectedRating, setSelectedRating] = useState<ReviewRating | null>(null)

  const loadCards = useCallback(async () => {
    await initDefaultSources()
    const due = await getDueCards()
    setCards(due)
    const s = await getStats()
    setStats(s)
    setLoading(false)
    setFlipped(false)
    setCurrentIndex(0)
    setSelectedRating(null)
  }, [])

  useEffect(() => { loadCards() }, [loadCards])

  const currentCard = cards[currentIndex]

  const handleRate = async (rating: ReviewRating) => {
    if (!currentCard) return
    if (rating === 'easy') {
      await submitReview(currentCard, rating)
      advanceToNext()
      return
    }
    setSelectedRating(rating)
    setFlipped(true)
  }

  const confirmRating = async () => {
    if (!currentCard || !selectedRating) return
    await submitReview(currentCard, selectedRating)
    advanceToNext()
  }

  const advanceToNext = async () => {
    setFlipped(false)
    setSelectedRating(null)
    const s = await getStats()
    setStats(s)
    if (currentIndex + 1 >= cards.length) {
      setCards([])
    } else {
      setCurrentIndex(i => i + 1)
    }
  }

  const flipCard = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation()
    setFlipped(f => !f)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-indigo-600 text-lg">加载中…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* 顶部栏 */}
      <header className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-lg font-bold">数学闪卡</h1>
          <p className="text-xs text-indigo-200">今日已复习 {stats.completed} 题 · 共 {stats.total} 题</p>
        </div>
        <div className="flex gap-2">
          <Link href="/library" className="px-3 py-1.5 bg-indigo-500 rounded-lg text-sm font-medium">题库</Link>
          <Link href="/add" className="px-3 py-1.5 bg-white text-indigo-600 rounded-lg text-sm font-bold">+ 录入</Link>
        </div>
      </header>

      {/* 进度条 */}
      {stats.total > 0 && (
        <div className="h-1.5 bg-indigo-100">
          <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${Math.min((stats.completed / Math.max(stats.total, 1)) * 100, 100)}%` }} />
        </div>
      )}

      {/* 复习区域 */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {cards.length === 0 ? (
          <div className="text-center space-y-4 py-12">
            <div className="text-6xl">{stats.total === 0 ? '📚' : '🎉'}</div>
            <h2 className="text-xl font-bold text-slate-700">{stats.total === 0 ? '题库为空' : '今日复习完成！'}</h2>
            <p className="text-slate-500">{stats.total === 0 ? '去「录入」拍第一道题，开始复习' : `今日复习 ${stats.completed} 题 · 正确率 ${Math.round((stats.correct / Math.max(stats.completed, 1)) * 100)}%`}</p>
            <Link href="/add" className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium shadow-lg">+ 录入新题</Link>
            {stats.total > 0 && stats.completed === 0 && <p className="text-sm text-slate-400">暂无待复习题目，稍后再来</p>}
          </div>
        ) : currentCard ? (
          <div className="w-full max-w-lg">
            {/* 标签行 */}
            <div className="flex gap-2 mb-3 flex-wrap">
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">{currentCard.subjectTag}</span>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">{currentCard.chapterTag}</span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">{currentCard.sourceTag}</span>
              <span className={`px-2 py-0.5 rounded text-xs ${currentCard.difficulty >= 4 ? 'bg-red-100 text-red-700' : currentCard.difficulty >= 2 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{'★'.repeat(currentCard.difficulty)}</span>
            </div>

            {/* 卡片 — 点击翻转 */}
            <div
              onClick={flipCard}
              className="relative bg-white rounded-2xl shadow-xl overflow-hidden cursor-pointer select-none"
              style={{ minHeight: flipped ? 'auto' : 'auto' }}
            >
              {/* 正面 */}
              <div className={`transition-all duration-300 ease-in-out ${flipped ? 'hidden' : 'block'}`}>
                <div className="p-5 space-y-3">
                  {currentCard.questionImages.length > 0 && (
                    <div className="space-y-2">
                      {currentCard.questionImages.map((img, i) => (
                        <div key={i} className="relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                          <img src={img} alt={`题目图${i + 1}`} className="w-full object-contain cursor-zoom-in" style={{ maxHeight: '320px' }}
                            onClick={(e) => { e.stopPropagation(); setZoomedImage(img) }} />
                          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded pointer-events-none">点击放大</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {currentCard.question && <p className="text-base leading-relaxed whitespace-pre-wrap text-slate-800">{currentCard.question}</p>}
                  <div className="text-center text-slate-400 text-sm pt-2 pb-1">
                    <span className="bg-slate-100 px-3 py-1 rounded-full">👆 点击翻转查看答案</span>
                  </div>
                </div>
              </div>

              {/* 背面 */}
              <div className={`transition-all duration-300 ease-in-out ${flipped ? 'block' : 'hidden'}`}>
                <div className="p-5 space-y-4">
                  <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">核对答案</div>
                  {currentCard.solutionImages.length > 0 && (
                    <div className="space-y-2">
                      {currentCard.solutionImages.map((img, i) => (
                        <div key={i} className="relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                          <img src={img} alt={`答案图${i + 1}`} className="w-full object-contain cursor-zoom-in" style={{ maxHeight: '320px' }}
                            onClick={(e) => { e.stopPropagation(); setZoomedImage(img) }} />
                          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded pointer-events-none">点击放大</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {currentCard.solution && <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-800">{currentCard.solution}</p>}
                  {currentCard.traps && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <div className="text-xs font-bold text-amber-600">⚠️ 易错点</div>
                      <p className="text-sm text-amber-800 mt-1">{currentCard.traps}</p>
                    </div>
                  )}
                  <div className="text-center text-slate-400 text-sm pt-1">
                    <span className="bg-slate-100 px-3 py-1 rounded-full">👆 点击翻回题目</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 剩余 */}
            <div className="text-center text-slate-400 text-sm mt-3">{currentIndex + 1} / {cards.length}</div>
          </div>
        ) : null}
      </main>

      {/* 底部评分 */}
      {currentCard && (
        <div className="sticky bottom-0 left-0 right-0 bg-white border-t shadow-lg p-3 z-10">
          {!flipped ? (
            /* 翻牌前：四个按钮 */
            <div className="grid grid-cols-4 gap-2">
              {([['fail', '❌\n没想起'], ['hard', '🔁\n模糊'], ['good', '✅\n想到'], ['easy', '⭐\n秒了']] as [ReviewRating, string][]).map(([r, label]) => (
                <button key={r} onClick={() => handleRate(r)}
                  className={`py-4 rounded-xl text-sm font-bold transition-all active:scale-95 ${r === 'fail' ? 'bg-red-500 text-white' : r === 'hard' ? 'bg-orange-500 text-white' : r === 'good' ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white'}`}>
                  <pre className="whitespace-pre-wrap text-center leading-tight">{label}</pre>
                </button>
              ))}
            </div>
          ) : (
            /* 翻牌后：三个按钮 + 确认 */
            <div className="space-y-2">
              <div className="text-center text-sm text-slate-500">
                当前：{selectedRating === 'fail' ? '❌ 没想起' : selectedRating === 'hard' ? '🔁 模糊' : '✅ 想到'}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {([['fail', '❌ 没想起'], ['hard', '🔁 模糊'], ['good', '✅ 想到']] as [ReviewRating, string][]).map(([r, label]) => (
                  <button key={r} onClick={() => setSelectedRating(r)}
                    className={`py-3 rounded-xl text-sm font-bold transition-all ${selectedRating === r ? (r === 'fail' ? 'bg-red-500 text-white ring-2 ring-red-300' : r === 'hard' ? 'bg-orange-500 text-white ring-2 ring-orange-300' : 'bg-green-500 text-white ring-2 ring-green-300') : (r === 'fail' ? 'bg-red-100 text-red-600' : r === 'hard' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600')}`}>
                    {label}
                  </button>
                ))}
              </div>
              <button onClick={confirmRating} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-base transition-all active:scale-95">✓ 确认，进入下一题</button>
            </div>
          )}
        </div>
      )}

      {/* 图片放大 */}
      {zoomedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setZoomedImage(null)}>
          <img src={zoomedImage} alt="放大查看" className="max-w-full max-h-full object-contain rounded-lg" />
          <div className="absolute bottom-6 left-0 right-0 text-center text-white/60 text-sm pointer-events-none">点击任意处关闭</div>
        </div>
      )}
    </div>
  )
}

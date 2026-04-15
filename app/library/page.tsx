'use client'
import { useEffect, useState, useRef } from 'react'
import { db } from '@/lib/db'
import type { Card, Source } from '@/types'
import Link from 'next/link'
import { v4 as uuidv4 } from 'uuid'

export default function LibraryPage() {
  const [cards, setCards] = useState<Card[]>([])
  const [filter, setFilter] = useState({ subject: '', source: '' })
  const [sources, setSources] = useState<Source[]>([])
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    db.sources.toArray().then(setSources)
    loadCards()
  }, [])

  const loadCards = async () => {
    const all = await db.cards.orderBy('createdAt').reverse().toArray()
    setCards(all)
  }

  const deleteCard = async (id: string) => {
    if (!confirm('确定删除这道题？')) return
    await db.cards.delete(id)
    await db.reviewLogs.where('cardId').equals(id).delete()
    loadCards()
    if (selectedCard?.id === id) setSelectedCard(null)
  }

  const exportJson = () => {
    const data = JSON.stringify(cards, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `数学题库_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportMsg('')
    try {
      const text = await file.text()
      const imported: Card[] = JSON.parse(text)
      if (!Array.isArray(imported)) throw new Error('格式错误')
      let count = 0
      for (const card of imported) {
        // 重新生成 ID 避免冲突
        const newCard: Card = { ...card, id: uuidv4(), createdAt: card.createdAt || Date.now(), updatedAt: Date.now() }
        await db.cards.put(newCard)
        count++
      }
      setImportMsg(`成功导入 ${count} 道题`)
      loadCards()
    } catch {
      setImportMsg('导入失败：文件格式不正确')
    }
    setImporting(false)
    e.target.value = ''
  }

  const filtered = cards.filter(c => {
    if (filter.subject && c.subjectTag !== filter.subject) return false
    if (filter.source && c.sourceTag !== filter.source) return false
    return true
  })

  const subjects = [...new Set(cards.map(c => c.subjectTag))]
  const sourceNames = [...new Set(cards.map(c => c.sourceTag))]

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* 顶部 */}
      <header className="bg-indigo-600 text-white px-4 py-3 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-2xl leading-none">←</Link>
          <h1 className="text-lg font-bold">题库</h1>
          <span className="text-xs bg-indigo-500 px-2 py-0.5 rounded-full">{cards.length}题</span>
        </div>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={importJson} />
          <button onClick={() => fileRef.current?.click()} className="px-3 py-1.5 bg-indigo-500 rounded-lg text-sm">📤 导入</button>
          <button onClick={exportJson} className="px-3 py-1.5 bg-indigo-500 rounded-lg text-sm">📥 导出</button>
        </div>
      </header>

      {/* 导入提示 */}
      {importMsg && (
        <div className={`mx-4 mt-3 px-4 py-2 rounded-xl text-sm ${importMsg.includes('成功') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {importMsg}
        </div>
      )}

      <div className="p-4 space-y-3 max-w-xl mx-auto">
        {/* 筛选 */}
        <div className="flex gap-2 overflow-x-auto">
          <select value={filter.subject} onChange={e => setFilter(f => ({ ...f, subject: e.target.value }))}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm whitespace-nowrap bg-white">
            <option value="">全部科目</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filter.source} onChange={e => setFilter(f => ({ ...f, source: e.target.value }))}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm whitespace-nowrap bg-white">
            <option value="">全部来源</option>
            {sourceNames.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {(filter.subject || filter.source) && (
            <button onClick={() => setFilter({ subject: '', source: '' })}
              className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-sm whitespace-nowrap shrink-0">
              清除筛选
            </button>
          )}
        </div>

        {/* 统计栏 */}
        <div className="bg-white rounded-xl p-3 flex items-center justify-between shadow-sm">
          <span className="text-slate-600 text-sm">
            共 <span className="font-bold text-indigo-600">{filtered.length}</span> 道题
            {filtered.length !== cards.length && <span className="text-slate-400">（共{cards.length}）</span>}
          </span>
          <Link href="/add" className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium">
            + 录入
          </Link>
        </div>

        {/* 空状态 */}
        {filtered.length === 0 ? (
          cards.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="text-5xl">📚</div>
              <h3 className="font-bold text-slate-700">题库为空</h3>
              <p className="text-slate-400 text-sm">去「录入」拍第一道题，开始你的复习之旅</p>
              <Link href="/add" className="inline-block mt-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium">
                + 录入新题
              </Link>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <div className="text-4xl mb-2">🔍</div>
              <p>没有符合条件的题目</p>
            </div>
          )
        ) : (
          filtered.map(card => (
            <div
              key={card.id}
              onClick={() => setSelectedCard(selectedCard?.id === card.id ? null : card)}
              className={`bg-white rounded-xl p-3 shadow-sm cursor-pointer transition-all ${
                selectedCard?.id === card.id ? 'ring-2 ring-indigo-400' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex gap-1.5 flex-wrap mb-2">
                    <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-xs">{card.subjectTag}</span>
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-xs">{card.chapterTag}</span>
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-xs">{card.sourceTag}</span>
                    <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded text-xs">{'★'.repeat(card.difficulty)}</span>
                  </div>

                  {/* 题目缩略图 — 改为横向大图 */}
                  {card.questionImages.length > 0 && (
                    <div className="flex gap-1.5 mb-2 overflow-x-auto">
                      {card.questionImages.slice(0, 3).map((img, i) => (
                        <img
                          key={i} src={img} alt=""
                          className="h-24 w-auto object-contain rounded-lg cursor-zoom-in bg-slate-100 shrink-0"
                          onClick={(e) => { e.stopPropagation(); setZoomedImage(img) }}
                        />
                      ))}
                      {card.questionImages.length > 3 && (
                        <div className="h-24 w-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs shrink-0">
                          +{card.questionImages.length - 3}
                        </div>
                      )}
                    </div>
                  )}

                  {card.question && (
                    <p className="text-sm text-slate-700 line-clamp-2">{card.question}</p>
                  )}
                </div>

                <button
                  onClick={e => { e.stopPropagation(); deleteCard(card.id) }}
                  className="text-red-400 hover:text-red-600 text-xs px-2 py-1 shrink-0"
                >删除</button>
              </div>

              {/* 展开详情 */}
              {selectedCard?.id === card.id && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">题目</div>
                  {card.questionImages.map((img, i) => (
                    <img
                      key={i} src={img} alt=""
                      className="w-full object-contain rounded-lg cursor-zoom-in bg-slate-100"
                      style={{ maxHeight: '400px' }}
                      onClick={(e) => { e.stopPropagation(); setZoomedImage(img) }}
                    />
                  ))}
                  {card.solution && (
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">解法</div>
                      <p className="text-sm whitespace-pre-wrap">{card.solution}</p>
                    </div>
                  )}
                  {card.traps && (
                    <div className="bg-amber-50 rounded-xl p-3">
                      <div className="text-xs font-bold text-amber-600">⚠️ 易错点</div>
                      <p className="text-sm text-amber-800">{card.traps}</p>
                    </div>
                  )}
                  {card.methodTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {card.methodTags.map(m => (
                        <span key={m} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-xs">{m}</span>
                      ))}
                    </div>
                  )}
                  {card.solutionImages.length > 0 && (
                    <>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">答案图</div>
                      {card.solutionImages.map((img, i) => (
                        <img
                          key={i} src={img} alt=""
                          className="w-full object-contain rounded-lg cursor-zoom-in bg-slate-100"
                          style={{ maxHeight: '400px' }}
                          onClick={(e) => { e.stopPropagation(); setZoomedImage(img) }}
                        />
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 图片放大 */}
      {zoomedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setZoomedImage(null)}>
          <img src={zoomedImage} alt="放大查看" className="max-w-full max-h-full object-contain rounded-lg" />
          <div className="absolute bottom-6 left-0 right-0 text-center text-white/60 text-sm pointer-events-none">点击任意处关闭</div>
        </div>
      )}
    </div>
  )
}

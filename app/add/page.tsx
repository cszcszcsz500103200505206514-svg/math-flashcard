'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { db, initDefaultSources } from '@/lib/db'
import type { Card, Source } from '@/types'
import { SUBJECT_OPTIONS, CHAPTER_OPTIONS, METHOD_OPTIONS } from '@/types'
import { v4 as uuidv4 } from 'uuid'
import Link from 'next/link'

// ===== 移动端裁剪组件 =====
interface CropState {
  imageSrc: string
  target: 'question' | 'solution'
}

function ImageCropper({
  imageSrc,
  onConfirm,
  onCancel,
}: {
  imageSrc: string
  onConfirm: (cropped: string) => void
  onCancel: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [crop, setCrop] = useState({ x: 10, y: 15, w: 80, h: 30 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragType, setDragType] = useState('')
  const [dragStart, setDragStart] = useState({ px: 0, py: 0, cropX: 0, cropY: 0, cropW: 0, cropH: 0 })

  const clientToPercent = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { px: 0, py: 0 }
    const rect = containerRef.current.getBoundingClientRect()
    return {
      px: ((clientX - rect.left) / rect.width) * 100,
      py: ((clientY - rect.top) / rect.height) * 100,
    }
  }, [])

  const getTarget = useCallback((px: number, py: number) => {
    const { x, y, w, h } = crop
    const R = 10
    if (px < x + R && py < y + R) return 'nw'
    if (px > x + w - R && py < y + R) return 'ne'
    if (px < x + R && py > y + h - R) return 'sw'
    if (px > x + w - R && py > y + h - R) return 'se'
    if (px >= x && px <= x + w && py >= y && py <= y + h) return 'move'
    return ''
  }, [crop])

  const startDrag = (px: number, py: number) => {
    const t = getTarget(px, py)
    if (!t) return
    setIsDragging(true)
    setDragType(t)
    setDragStart({ px, py, cropX: crop.x, cropY: crop.y, cropW: crop.w, cropH: crop.h })
  }

  const onMove = useCallback((px: number, py: number) => {
    if (!isDragging) return
    const dx = px - dragStart.px
    const dy = py - dragStart.py
    setCrop(prev => {
      if (dragType === 'move') {
        return {
          ...prev,
          x: Math.max(0, Math.min(100 - prev.w, dragStart.cropX + dx)),
          y: Math.max(0, Math.min(100 - prev.h, dragStart.cropY + dy)),
        }
      }
      let { x, y, w, h } = { x: dragStart.cropX, y: dragStart.cropY, w: dragStart.cropW, h: dragStart.cropH }
      if (dragType === 'se') { w = Math.max(10, Math.min(100 - x, dragStart.cropW + dx)); h = Math.max(6, Math.min(100 - y, dragStart.cropH + dy)) }
      else if (dragType === 'sw') { x = Math.max(0, dragStart.cropX + dx); w = Math.max(10, dragStart.cropW - dx); h = Math.max(6, Math.min(100 - y, dragStart.cropH + dy)) }
      else if (dragType === 'ne') { y = Math.max(0, dragStart.cropY + dy); w = Math.max(10, Math.min(100 - x, dragStart.cropW + dx)); h = Math.max(6, dragStart.cropH - dy) }
      else if (dragType === 'nw') { y = Math.max(0, dragStart.cropY + dy); x = Math.max(0, dragStart.cropX + dx); w = Math.max(10, dragStart.cropW - dx); h = Math.max(6, dragStart.cropH - dy) }
      return { x, y, w, h }
    })
  }, [isDragging, dragType, dragStart])

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    const { px, py } = clientToPercent(e.clientX, e.clientY)
    startDrag(px, py)
  }
  const onMouseMove = (e: React.MouseEvent) => { e.preventDefault(); const { px, py } = clientToPercent(e.clientX, e.clientY); onMove(px, py) }
  const onMouseUp = () => setIsDragging(false)

  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    const { px, py } = clientToPercent(e.touches[0].clientX, e.touches[0].clientY)
    startDrag(px, py)
  }
  const onTouchMove = (e: React.TouchEvent) => { e.preventDefault(); const { px, py } = clientToPercent(e.touches[0].clientX, e.touches[0].clientY); onMove(px, py) }
  const onTouchEnd = () => setIsDragging(false)

  const handleConfirm = () => {
    const img = new window.Image()
    img.onload = () => {
      const sx = (crop.x / 100) * img.naturalWidth
      const sy = (crop.y / 100) * img.naturalHeight
      const sw = (crop.w / 100) * img.naturalWidth
      const sh = (crop.h / 100) * img.naturalHeight
      const canvas = document.createElement('canvas')
      canvas.width = sw
      canvas.height = sh
      canvas.getContext('2d')?.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)
      onConfirm(canvas.toDataURL('image/jpeg', 0.92))
    }
    img.src = imageSrc
  }

  const { x, y, w, h } = crop
  const corners = [
    { left: `${x}%`, top: `${y}%` },
    { left: `${x + w}%`, top: `${y}%` },
    { left: `${x}%`, top: `${y + h}%` },
    { left: `${x + w}%`, top: `${y + h}%` },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.94)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '12px', touchAction: 'none' }}>
      <div className="text-white text-center mb-3">
        <div className="font-bold text-lg">📐 裁剪题目区域</div>
      </div>

      <div
        ref={containerRef}
        style={{ position: 'relative', maxWidth: '100%', borderRadius: '10px', overflow: 'hidden', touchAction: 'none', userSelect: 'none' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* 原图 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageSrc} alt="" style={{ display: 'block', width: '100%', maxHeight: '50vh', objectFit: 'contain' }} draggable={false} />

        {/* 遮罩 */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${y}%`, background: 'rgba(0,0,0,0.68)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, top: `${y + h}%`, background: 'rgba(0,0,0,0.68)' }} />
          <div style={{ position: 'absolute', top: `${y}%`, left: 0, width: `${x}%`, height: `${h}%`, background: 'rgba(0,0,0,0.68)' }} />
          <div style={{ position: 'absolute', top: `${y}%`, right: 0, left: `${x + w}%`, height: `${h}%`, background: 'rgba(0,0,0,0.68)' }} />
        </div>

        {/* 裁剪框 */}
        <div style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%`, border: '2.5px solid #fff', boxShadow: '0 0 0 1px rgba(79,70,229,0.9)', boxSizing: 'border-box', pointerEvents: 'none' }} />

        {/* 网格线 */}
        <div style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%`, pointerEvents: 'none' }}>
          {[33, 66].map(p => <div key={`h${p}`} style={{ position: 'absolute', top: `${p}%`, left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.28)' }} />)}
          {[33, 66].map(p => <div key={`v${p}`} style={{ position: 'absolute', left: `${p}%`, top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.28)' }} />)}
        </div>

        {/* 四角把手 */}
        {corners.map((pos, i) => (
          <div key={i} style={{ position: 'absolute', left: pos.left, top: pos.top, transform: 'translate(-50%,-50%)', width: '24px', height: '24px', background: '#4F46E5', border: '2.5px solid #fff', borderRadius: '50%', cursor: isDragging && dragType === ['nw','ne','sw','se'][i] ? 'grabbing' : 'grab', boxShadow: '0 2px 8px rgba(0,0,0,0.5)', zIndex: 2 }} />
        ))}


      </div>

      <div className="flex gap-3 mt-5 w-full" style={{ maxWidth: '320px' }}>
        <button onClick={onCancel} style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.12)', color: '#fff', borderRadius: '12px', fontSize: '15px', fontWeight: 600, border: 'none' }}>取消</button>
        <button onClick={handleConfirm} style={{ flex: 2, padding: '14px', background: '#4F46E5', color: '#fff', borderRadius: '12px', fontSize: '15px', fontWeight: 700, border: 'none', boxShadow: '0 4px 12px rgba(79,70,229,0.4)' }}>✓ 确认裁剪</button>
      </div>
    </div>
  )
}

// ===== 录入页面 =====
export default function AddPage() {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [questionImages, setQuestionImages] = useState<string[]>([])
  const [solutionImages, setSolutionImages] = useState<string[]>([])
  const [question, setQuestion] = useState('')
  const [solution, setSolution] = useState('')
  const [traps, setTraps] = useState('')
  const [subjectTag, setSubjectTag] = useState('高等数学')
  const [chapterTag, setChapterTag] = useState('函数与极限')
  const [sourceTag, setSourceTag] = useState('武忠祥660')
  const [difficulty, setDifficulty] = useState(3)
  const [methodTags, setMethodTags] = useState<string[]>([])
  const [newSource, setNewSource] = useState('')
  const [cropping, setCropping] = useState<CropState | null>(null)

  useEffect(() => { initDefaultSources().then(() => db.sources.toArray().then(setSources)) }, [])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'question' | 'solution') => {
    const files = e.target.files
    if (!files || !files[0]) return
    const reader = new FileReader()
    reader.onload = (ev) => setCropping({ imageSrc: ev.target?.result as string, target })
    reader.readAsDataURL(files[0])
    e.target.value = ''
  }

  const handleCropConfirm = (cropped: string) => {
    if (!cropping) return
    if (cropping.target === 'question') setQuestionImages(p => [...p, cropped])
    else setSolutionImages(p => [...p, cropped])
    setCropping(null)
  }

  const removeImage = (target: 'question' | 'solution', index: number) => {
    if (target === 'question') setQuestionImages(p => p.filter((_, i) => i !== index))
    else setSolutionImages(p => p.filter((_, i) => i !== index))
  }

  const toggleMethod = (m: string) => setMethodTags(p => p.includes(m) ? p.filter(x => x !== m) : [...p, m])

  const handleAddSource = async () => {
    if (!newSource.trim()) return
    const id = uuidv4()
    await db.sources.add({ id, name: newSource.trim(), subject: subjectTag, createdAt: Date.now() })
    const all = await db.sources.toArray()
    setSources(all)
    setSourceTag(newSource.trim())
    setNewSource('')
  }

  const handleSave = async () => {
    if (!questionImages.length && !question.trim() && !solutionImages.length && !solution.trim()) { alert('请至少上传题目图或填写题干'); return }
    setLoading(true)
    const card: Card = { id: uuidv4(), question, questionImages, subjectTag, chapterTag, sourceTag, methodTags, difficulty, solution, solutionImages, traps, createdAt: Date.now(), updatedAt: Date.now() }
    await db.cards.add(card)
    setSaved(true)
    setLoading(false)
  }

  if (saved) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4 bg-slate-50">
      <div className="text-6xl">✅</div><h2 className="text-xl font-bold">保存成功！</h2><p className="text-slate-500">已存入题库</p>
      <div className="flex gap-3">
        <Link href="/" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium">开始复习</Link>
        <button onClick={() => { setSaved(false); setQuestionImages([]); setSolutionImages([]); setQuestion(''); setSolution(''); setTraps(''); setMethodTags([]); setDifficulty(3) }} className="px-6 py-3 bg-white border border-slate-300 rounded-xl font-medium">再录一道</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="bg-indigo-600 text-white px-4 py-3 sticky top-0 z-10 flex items-center gap-3">
        <Link href="/" className="text-2xl leading-none">←</Link><h1 className="text-lg font-bold">录入新题</h1>
        <span className="ml-auto text-xs bg-indigo-500 px-2 py-0.5 rounded-full">拍照后可裁剪</span>
      </header>
      <div className="p-4 space-y-5 max-w-xl mx-auto">
        <section className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-3">📝 题干</h2>
          <input type="file" accept="image/*" capture="environment" className="hidden" id="q-img" onChange={e => handleImageUpload(e, 'question')} />
          <label htmlFor="q-img" className="block w-full py-5 border-2 border-dashed border-indigo-300 rounded-xl text-center cursor-pointer hover:border-indigo-500 transition-colors bg-indigo-50">
            <div className="text-3xl mb-1">📷</div><div className="text-sm text-indigo-600 font-medium">拍照 / 选择图片</div><div className="text-xs text-slate-400 mt-1">拍完可裁剪出题目区域</div>
          </label>
          {questionImages.length > 0 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {questionImages.map((img, i) => (
                <div key={i} className="relative shrink-0 rounded-lg overflow-hidden bg-slate-100 border" style={{ width: '120px', height: '90px' }}>
                  <img src={img} alt="" className="w-full h-full object-contain" />
                  <button onClick={() => removeImage('question', i)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center leading-none">×</button>
                </div>
              ))}
            </div>
          )}
          <textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="或直接输入/粘贴题干（支持 LaTeX，如 $x^2$）" rows={3} className="mt-3 w-full border border-slate-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </section>
        <section className="bg-white rounded-xl p-4 shadow-sm space-y-3">
          <h2 className="font-bold text-slate-800">🏷️ 分类信息</h2>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-slate-500 mb-1 block">科目</label><select value={subjectTag} onChange={e => { setSubjectTag(e.target.value); setChapterTag(CHAPTER_OPTIONS[e.target.value]?.[0] || '') }} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white">{SUBJECT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="text-xs text-slate-500 mb-1 block">章节</label><select value={chapterTag} onChange={e => setChapterTag(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white">{(CHAPTER_OPTIONS[subjectTag] || []).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          </div>
          <div><label className="text-xs text-slate-500 mb-1 block">来源</label><select value={sourceTag} onChange={e => setSourceTag(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm bg-white">{sources.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select>
            <div className="flex gap-2 mt-2"><input value={newSource} onChange={e => setNewSource(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddSource()} placeholder="新增来源，如：武忠祥660" className="flex-1 border border-slate-200 rounded-lg p-2 text-sm bg-white" /><button onClick={handleAddSource} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium">添加</button></div>
          </div>
          <div><label className="text-xs text-slate-500 mb-1 block">难度：{'★'.repeat(difficulty)}</label><input type="range" min={1} max={5} value={difficulty} onChange={e => setDifficulty(Number(e.target.value))} className="w-full accent-indigo-600" /></div>
        </section>
        <section className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-bold text-slate-800 mb-3">💡 解法 / 答案</h2>
          <input type="file" accept="image/*" capture="environment" className="hidden" id="s-img" onChange={e => handleImageUpload(e, 'solution')} />
          <label htmlFor="s-img" className="block w-full py-5 border-2 border-dashed border-purple-300 rounded-xl text-center cursor-pointer hover:border-purple-500 transition-colors bg-purple-50">
            <div className="text-3xl mb-1">📷</div><div className="text-sm text-purple-600 font-medium">拍照解法 / 手写答案</div><div className="text-xs text-slate-400 mt-1">同样支持裁剪</div>
          </label>
          {solutionImages.length > 0 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {solutionImages.map((img, i) => (
                <div key={i} className="relative shrink-0 rounded-lg overflow-hidden bg-slate-100 border" style={{ width: '120px', height: '90px' }}>
                  <img src={img} alt="" className="w-full h-full object-contain" />
                  <button onClick={() => removeImage('solution', i)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center leading-none">×</button>
                </div>
              ))}
            </div>
          )}
          <textarea value={solution} onChange={e => setSolution(e.target.value)} placeholder="输入/粘贴解法摘要" rows={4} className="mt-3 w-full border border-slate-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </section>
        <section className="bg-white rounded-xl p-4 shadow-sm"><h2 className="font-bold text-slate-800 mb-3">⚠️ 易错点（可选）</h2><textarea value={traps} onChange={e => setTraps(e.target.value)} placeholder="这道题容易踩的坑…" rows={2} className="w-full border border-slate-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300" /></section>
        <section className="bg-white rounded-xl p-4 shadow-sm"><h2 className="font-bold text-slate-800 mb-3">🔧 解题方法标签</h2><div className="flex flex-wrap gap-2">{METHOD_OPTIONS.map(m => (<button key={m} onClick={() => toggleMethod(m)} className={`px-3 py-1.5 rounded-full text-sm ${methodTags.includes(m) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{m}</button>))}</div></section>
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg"><button onClick={handleSave} disabled={loading} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg disabled:opacity-50">{loading ? '保存中…' : '✅ 保存到题库'}</button></div>
      {cropping && <ImageCropper imageSrc={cropping.imageSrc} onConfirm={handleCropConfirm} onCancel={() => setCropping(null)} />}
    </div>
  )
}

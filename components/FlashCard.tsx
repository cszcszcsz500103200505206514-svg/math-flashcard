'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import type { Card } from '@/types'

interface Props {
  card: Card
  isFlipped: boolean
  onFlip: () => void
}

export default function FlashCard({ card, isFlipped, onFlip }: Props) {
  return (
    <div className="w-full max-w-sm">
      <div
        className="flip-card w-full aspect-[3/4] cursor-pointer"
        onClick={onFlip}
      >
        <div className={`flip-card-inner relative w-full h-full ${isFlipped ? 'flipped' : ''}`}>
          {/* 正面：题目 */}
          <div className="flip-card-front absolute inset-0 bg-white rounded-2xl shadow-lg border border-gray-100 p-5 flex flex-col overflow-hidden">
            {/* 标签 */}
            <div className="flex flex-wrap gap-1 mb-3">
              <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                {card.subjectTag}
              </span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {card.chapterTag}
              </span>
              <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                {card.sourceTag || '自整理'}
              </span>
            </div>

            {/* 题干 */}
            <div className="flex-1 overflow-auto">
              {card.question && (
                <div
                  className="text-base leading-relaxed text-gray-800 math-text"
                  dangerouslySetInnerHTML={{ __html: renderMath(card.question) }}
                />
              )}

              {/* 题干图片 */}
              {card.questionImages.map((img, i) => (
                <div key={i} className="mt-2 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`题目图${i + 1}`} className="image-preview rounded-lg w-full" />
                </div>
              ))}
            </div>

            {/* 难度 */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <span key={n} className={`text-sm ${n <= card.difficulty ? 'text-amber-400' : 'text-gray-200'}`}>
                    ★
                  </span>
                ))}
              </div>
              <span className="text-xs text-gray-400">点击翻面</span>
            </div>
          </div>

          {/* 背面：答案 */}
          <div className="flip-card-back absolute inset-0 bg-indigo-600 rounded-2xl shadow-lg p-5 flex flex-col overflow-hidden text-white">
            <div className="text-xs bg-white/20 text-white/80 px-2 py-0.5 rounded-full self-start mb-3">
              解法摘要
            </div>

            <div className="flex-1 overflow-auto">
              {/* 解法 */}
              {card.solution && (
                <div
                  className="text-sm leading-relaxed text-white/90 math-text"
                  dangerouslySetInnerHTML={{ __html: renderMath(card.solution) }}
                />
              )}

              {/* 解法图片 */}
              {card.solutionImages.map((img, i) => (
                <div key={i} className="mt-2 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`答案图${i + 1}`} className="image-preview rounded-lg w-full" />
                </div>
              ))}

              {/* 易错点 */}
              {card.traps && (
                <div className="mt-4 bg-white/10 rounded-xl p-3">
                  <div className="text-xs text-amber-300 font-medium mb-1">⚠️ 易错点</div>
                  <div className="text-xs text-white/80 leading-relaxed">
                    {card.traps}
                  </div>
                </div>
              )}

              {/* 方法标签 */}
              {card.methodTags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1">
                  {card.methodTags.map(tag => (
                    <span key={tag} className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 简单的 LaTeX 渲染：把 $...$ 包裹的内容用 katex 渲染
function renderMath(text: string): string {
  if (typeof window === 'undefined') return text
  try {
    // 动态加载 katex
    const katex = (window as any).katex
    if (!katex) return text

    return text.replace(/\$\$(.*?)\$\$/g, (_, expr) =>
      katex.renderToString(expr, { displayMode: true, throwOnError: false })
    ).replace(/\$(.*?)\$/g, (_, expr) =>
      katex.renderToString(expr, { displayMode: false, throwOnError: false })
    )
  } catch {
    return text
  }
}

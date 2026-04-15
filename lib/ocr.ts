/**
 * 文字识别方案：
 * 1. 优先尝试 Chrome 原生 Read API
 * 2. 不支持时提供手动输入
 * 注意：数学公式识别效果有限，建议配合手动输入/修正
 */
export async function extractTextFromImage(imageSrc: string): Promise<string> {
  try {
    // Chrome 原生 Read API（需要 Chrome 124+ 且开启 #OCRAssist 标志）
    if ('ai' in window && 'experimental' in (window as any).ai &&
        'recognizer' in (window as any).ai.experimental) {
      const result = await (window as any).ai.experimental.recognizer.recognize(imageSrc)
      if (result && result.length > 0) {
        return result.map((r: any) => r.rawString || r.string || '').join('\n')
      }
    }
  } catch (e) {
    console.warn('OCR unavailable:', e)
  }
  return ''
}

export function isOcrSupported(): boolean {
  return 'ai' in window && 'experimental' in (window as any).ai &&
         'recognizer' in (window as any).ai.experimental
}

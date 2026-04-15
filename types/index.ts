export interface Card {
  id: string
  question: string
  questionImages: string[]
  subjectTag: string
  chapterTag: string
  sourceTag: string
  methodTags: string[]
  difficulty: number
  solution: string
  solutionImages: string[]
  traps: string
  createdAt: number
  updatedAt: number
}

export interface Source {
  id: string
  name: string
  subject: string
  createdAt: number
}

export interface ReviewLog {
  id: string
  cardId: string
  rating: number
  interval: number
  ease: number
  due: number
  reviewedAt: number
}

export type ReviewRating = 'fail' | 'hard' | 'good' | 'easy'

export interface SessionStats {
  total: number
  completed: number
  correct: number
  wrong: number
}

export const SUBJECT_OPTIONS = [
  '高等数学', '线性代数', '概率论与数理统计'
] as const

export const CHAPTER_OPTIONS: Record<string, string[]> = {
  '高等数学': [
    '函数与极限', '导数与微分', '微分中值定理与导数应用',
    '不定积分', '定积分', '定积分应用', '微分方程',
    '多元函数微分学', '二重积分', '无穷级数'
  ],
  '线性代数': [
    '行列式', '矩阵', '向量', '线性方程组',
    '特征值与特征向量', '二次型'
  ],
  '概率论与数理统计': [
    '随机事件与概率', '一维随机变量', '二维随机变量',
    '数字特征', '大数定律与中心极限定理', '统计量与抽样分布', '参数估计'
  ]
}

export const METHOD_OPTIONS = [
  '直接法', '换元法', '分部积分法', '洛必达法则',
  '泰勒展开', '夹逼准则', '拉格朗日乘数法',
  '高斯消元', '矩阵初等变换', '特征值法',
  '古典概型', '分布函数法', '矩估计/最大似然估计'
] as const

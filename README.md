# 数学闪卡 - 考研数学复习工具

一款手机/电脑通用的考研数学闪卡应用，基于间隔重复算法，帮助你高效记忆题型和解法。

## 功能

- ✅ 拍照上传题目图片
- ✅ 手写/粘贴解法摘要
- ✅ 题型标签分类（科目+章节+来源）
- ✅ SM-2 间隔重复复习
- ✅ KaTeX 公式渲染（支持 LaTeX）
- ✅ 手机端 PWA 安装（离线可用）
- ✅ 数据导出/导入

## 快速开始

### 1. 安装依赖

```bash
cd math-flashcard
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

### 3. 打开浏览器

访问 http://localhost:3000

### 4. 手机上使用

在同一局域网下，用手机访问电脑的 IP 地址加端口号，如：
`http://192.168.x.x:3000`

然后用浏览器的"添加到主屏幕"功能安装为 App。

## 目录结构

```
math-flashcard/
├── app/
│   ├── page.tsx         # 首页/复习页
│   ├── add/page.tsx     # 添加卡片页
│   └── library/page.tsx # 题库管理页
├── components/
│   └── FlashCard.tsx    # 翻牌组件
├── lib/
│   ├── db.ts            # IndexedDB 数据库
│   └── fsrs.ts          # 间隔重复算法
├── types/
│   └── index.ts         # 类型定义
└── public/
    ├── manifest.json    # PWA 配置
    └── service-worker.js
```

## 使用流程

1. **添加卡片**：拍题目照片，填来源/章节/难度/解法
2. **复习**：看题干→想解法→翻牌→评分
3. **系统自动安排下次复习时间**

## 数据存储

所有数据存在本地 IndexedDB，不上传任何服务器。

定期点击「题库」→「导出」备份数据。

## 技术栈

- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- Dexie.js (IndexedDB)
- KaTeX (公式渲染)

# 目录结构

```
clothing02/
├── .env                    # 环境变量
├── .gitignore
├── ag-components.json      # shadcn 组件配置
├── next.config.ts          # Next.js 配置
├── package.json            # 依赖配置
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── postcss.config.mjs
├── tsconfig.json           # TypeScript 配置
├── data.db                  # SQLite 数据库文件
├── prisma/                 # Prisma ORM
│   ├── schema.prisma       # 数据模型定义
│   ├── seed.ts             # 种子数据
│   └── migrations/         # 迁移文件
├── docs/                   # 项目文档
│   ├── 原始想法.md          # 原始业务需求
│   ├── data-model.md       # 数据字典
│   ├── api.md              # API 文档
│   └── structure.md        # 本文档
├── public/                 # 静态资源
└── src/
    ├── app/                # Next.js App Router
    │   ├── api/            # API 路由
    │   │   ├── category/   # 品类管理
    │   │   ├── employee/   # 员工管理
    │   │   ├── inventory/  # 库存管理
    │   │   ├── loan/       # 活动管理
    │   │   ├── loan-record/# 借出记录
    │   │   ├── lost-record/# 丢失记录
    │   │   ├── return-record/# 归还记录
    │   │   ├── stats/      # 统计数据
    │   │   └── stats/return-stats/# 归还销账统计
    │   ├── employee/       # 员工管理页面
    │   ├── inventory/      # 库存管理页面
    │   ├── loan/           # 服装出借页面
    │   ├── return/         # 归还销账页面（三标签页）
    │   ├── layout.tsx      # 根布局
    │   ├── page.tsx        # 首页/仪表盘
    │   └── globals.css     # 全局样式
    ├── components/         # React 组件
    │   ├── layout/         # 布局组件
    │   │   ├── header.tsx  # 顶部导航
    │   │   └── sidebar.tsx # 侧边栏
    │   ├── return/         # 归还销账模块组件
    │   │   ├── index.ts
    │   │   ├── return-stats-cards.tsx  # 统计卡片
    │   │   ├── search-toolbar.tsx      # 搜索工具栏
    │   │   ├── pending-return-tab.tsx   # 待归还标签
    │   │   ├── return-records-tab.tsx   # 归还记录标签
    │   │   └── lost-records-tab.tsx     # 丢失记录标签
    │   └── ui/             # shadcn/ui 组件
    │       ├── avatar.tsx
    │       ├── badge.tsx
    │       ├── button.tsx
    │       ├── card.tsx
    │       ├── dialog.tsx
    │       ├── dropdown-menu.tsx
    │       ├── input.tsx
    │       ├── label.tsx
    │       ├── select.tsx
    │       ├── separator.tsx
    │       ├── skeleton.tsx
    │       ├── sonner.tsx
    │       ├── table.tsx
    │       ├── tabs.tsx
    │       └── textarea.tsx
    ├── generated/          # 生成的代码
    │   └── prisma/         # Prisma 生成的客户端
    └── lib/
        ├── prisma.ts       # Prisma 客户端实例
        └── utils.ts        # 工具函数
```

## 目录说明

| 目录/文件 | 用途 |
|----------|------|
| `prisma/` | 数据库模型定义和迁移 |
| `src/app/api/` | 后端 API 接口实现 |
| `src/app/[page]/` | 前端页面组件 |
| `src/components/return/` | 归还销账模块可复用组件 |
| `src/components/ui/` | UI 组件库（shadcn/ui） |
| `src/components/layout/` | 布局组件 |
| `src/lib/` | 工具函数和数据库客户端 |
| `docs/` | 项目文档 |

## 页面路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | 首页/仪表盘 | |
| `/inventory` | 库存管理 | |
| `/loan` | 服装出借 | |
| `/return` | 归还销账 | **三标签页**：待归还、归还记录、丢失记录 |
| `/employee` | 员工管理 | |

## 归还销账模块（/return）

该模块是本次重构的核心，将原来分散的三个页面合并为一个三标签页：

```
归还销账
├── 统计卡片（待归还总数 + 丢失总数）
├── 标签1 - 待归还：
│   ├── 搜索框
│   ├── 数据表格：员工 | 服装 | 活动 | 待归还数量 | 借出时间 | 操作（归还/丢失）
│   ├── 归还弹窗
│   └── 丢失弹窗
├── 标签2 - 归还记录：
│   ├── 搜索框
│   ├── 数据表格：员工 | 服装 | 活动 | 归还数量 | 归还时间 | 操作（详情）
│   └── 详情弹窗
└── 标签3 - 丢失记录：
    ├── 搜索框
    ├── 数据表格：员工 | 服装 | 活动 | 丢失数量 | 丢失时间 | 操作（详情）
    └── 详情弹窗
```

### 组件清单

| 组件 | 路径 | 说明 |
|------|------|------|
| `ReturnStatsCards` | `components/return/return-stats-cards.tsx` | 统计卡片组件 |
| `SearchToolbar` | `components/return/search-toolbar.tsx` | 搜索工具栏（支持活动/员工筛选） |
| `PendingReturnTab` | `components/return/pending-return-tab.tsx` | 待归还标签页 |
| `ReturnRecordsTab` | `components/return/return-records-tab.tsx` | 归还记录标签页 |
| `LostRecordsTab` | `components/return/lost-records-tab.tsx` | 丢失记录标签页 |

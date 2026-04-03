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
├── dev.db                  # SQLite 数据库文件
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
    │   │   └── stats/      # 统计数据
    │   ├── employee/       # 员工管理页面
    │   ├── inventory/      # 库存管理页面
    │   ├── loan/           # 服装出借页面
    │   ├── lost-record/    # 丢失记录页面
    │   ├── return/         # 归还页面
    │   ├── layout.tsx      # 根布局
    │   ├── page.tsx        # 首页/仪表盘
    │   └── globals.css     # 全局样式
    ├── components/         # React 组件
    │   ├── layout/         # 布局组件
    │   │   ├── header.tsx  # 顶部导航
    │   │   └── sidebar.tsx # 侧边栏
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
| `src/components/ui/` | UI 组件库（shadcn/ui） |
| `src/components/layout/` | 布局组件 |
| `src/lib/` | 工具函数和数据库客户端 |
| `docs/` | 项目文档 |

## 页面路由

| 路径 | 页面 |
|------|------|
| `/` | 首页/仪表盘 |
| `/inventory` | 库存管理 |
| `/loan` | 服装出借 |
| `/return` | 服装归还 |
| `/lost-record` | 丢失记录 |
| `/employee` | 员工管理 |
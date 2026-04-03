# 服装仓库管理系统

公司的服装库存管理系统，用于管理公司活动服装的出借和归还。

## 功能列表

- **库存管理** - 服装入库、日常盘点
- **服装出借** - 发起活动，登记员工借出的服装
- **服装归还** - 归还销账，支持部分归还
- **丢失记录** - 登记服装丢失情况
- **员工管理** - 员工信息维护
- **仪表盘** - 统计数据概览

## 技术栈

- **前端**: Next.js 16 (App Router) + React 19
- **UI**: shadcn/ui + Tailwind CSS 4
- **后端**: Next.js API Routes
- **数据库**: SQLite + Prisma ORM
- **图标**: Lucide React

## 本地运行

```bash
# 安装依赖
pnpm install

# 生成 Prisma 客户端
npx prisma generate

# 初始化数据库
npx prisma db push

# 启动开发服务器
pnpm dev
```

访问 http://localhost:3000

## 项目文档

- [数据字典](docs/data-model.md) - 数据模型说明
- [API文档](docs/api.md) - 接口说明
- [目录结构](docs/structure.md) - 项目结构说明
<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 项目开发规范

## 架构概览

本项目是一个服装仓库管理系统，采用前后端一体的 Next.js App Router 架构。

```
前端 (React + shadcn/ui)  →  API Routes (Next.js)  →  Prisma  →  SQLite
```

## 代码组织结构

- `/src/app/` - Next.js 页面和 API 路由
- `/src/app/api/` - 后端 API 接口
- `/src/app/[page]/` - 前端页面组件
- `/src/components/` - React 组件
- `/src/lib/` - 工具函数和数据库客户端
- `/prisma/` - 数据库模型和迁移文件

详细说明见 [目录结构](docs/structure.md)

## 开发规范

### API 响应格式

统一使用以下格式：

```typescript
// 成功
{ success: true, data: ... }

// 失败
{ success: false, error: "错误信息" }
```

### 数据库操作

- 使用 Prisma ORM 操作数据库
- 涉及多表操作时使用 `prisma.$transaction()` 保证事务一致性
- 借出/归还/丢失操作需要同时更新库存数量

### 数据模型

项目包含 6 个核心实体：ClothingCategory、ClothingItem、Employee、LoanEvent、LoanRecord、LostRecord。

详细说明见 [数据字典](docs/data-model.md)

### API 设计

RESTful 风格，支持 GET/POST/PUT/DELETE 方法。

详细说明见 [API文档](docs/api.md)

## 文档维护约定

**重要**：后续如果对项目进行以下修改，请同步更新对应文档：

| 修改内容 | 更新文档 |
|---------|---------|
| 新增/删除/修改页面 | docs/structure.md |
| 新增/修改 API 端点 | docs/api.md |
| 新增/修改数据模型 | docs/data-model.md |
| 修改目录结构 | docs/structure.md |

这样可以确保 Agent 在阅读文档时获得准确的信息。
# API 文档

## 通用约定

### 响应格式

```typescript
// 成功（列表接口返回分页信息）
{ success: true, data: [...], pagination: { total: number, page: number, pageSize: number, totalPages: number } }

// 成功（非列表接口）
{ success: true, data: ... }

// 失败
{ success: false, error: "错误信息" }
```

### 查询参数

- 支持 URL 参数过滤，如 `?eventId=xxx&status=borrowed`
- 列表接口统一支持分页参数：
  - `page` - 页码（默认 1）
  - `pageSize` - 每页条数（默认 20，最大 100）

---

## 库存管理 `/api/inventory`

### GET 获取库存列表（支持分页）

查询参数：
- `page` - 页码（默认 1）
- `pageSize` - 每页条数（默认 20）
- `categoryId` - 按品类筛选
- `search` - 搜索名称或尺码（服务端模糊匹配）

### POST 创建库存（入库）

请求体：
```json
{
  "name": "M码黑色裤子",
  "categoryId": "xxx",
  "size": "M",
  "quantity": 50,
  "unit": "件"
}
```

支持同名合并：已存在同名+同品类+同尺码时，增加数量而非创建新记录。

### PUT 更新库存信息

请求体：
```json
{
  "id": "xxx",
  "name": "L码黑色裤子",
  "size": "L",
  "unit": "件"
}
```

### DELETE 删除库存

查询参数：`?id=xxx`

---

## 品类管理 `/api/category`

### GET 获取品类列表

返回每个品类的库存汇总。

### POST 创建品类

请求体：
```json
{
  "name": "裤子",
  "nameEn": "Pants"
}
```

---

## 活动管理 `/api/loan`

### GET 获取活动列表（支持分页）

查询参数：
- `page` - 页码（默认 1）
- `pageSize` - 每页条数（默认 20）
- `search` - 按活动名称搜索
- `status` - 按状态筛选（active/closed）

返回每个活动的统计信息：
- `totalBorrowed` - 借出总数
- `totalReturned` - 已归还数
- `totalLost` - 丢失数
- `totalActive` - 未还数

### POST 创建活动

请求体：
```json
{
  "name": "2024年会",
  "description": "公司年会活动"
}
```

### PUT 更新活动

请求体：
```json
{
  "id": "xxx",
  "name": "2024年会",
  "description": "...",
  "status": "active" | "closed"
}
```

### DELETE 删除活动

查询参数：`?id=xxx`

注意：有未归还的服装时无法删除。

---

## 借出记录 `/api/loan-record`

### GET 获取借出记录（支持分页）

查询参数：
- `page` - 页码（默认 1）
- `pageSize` - 每页条数（默认 20）
- `search` - 搜索员工、服装或活动名称
- `eventId` - 按活动筛选
- `employeeId` - 按员工筛选
- `status` - 按状态筛选（borrowed/returned/lost）

不传 status 时默认返回未还清的记录。

### POST 创建借出记录

请求体：
```json
{
  "loanEventId": "xxx",
  "employeeId": "xxx",
  "clothingItemId": "xxx",
  "quantity": 5
}
```

会检查库存是否充足，并自动扣减可用库存。

### PUT 更新借出记录（仅丢失）

请求体 - 登记丢失：
```json
{
  "id": "xxx",
  "status": "lost",
  "quantity": 2
}
```

**注意**：归还功能已移至 `/api/return-record` 接口。

---

## 员工管理 `/api/employee`

### GET 获取员工列表（支持分页）

查询参数：
- `page` - 页码（默认 1）
- `pageSize` - 每页条数（默认 20）
- `search` - 搜索员工姓名或部门

返回每个员工的借出统计。

### POST 创建员工

请求体：
```json
{
  "name": "张三",
  "department": "技术部",
  "phone": "13800138000"
}
```

### PUT 更新员工

### DELETE 删除员工

查询参数：`?id=xxx`

注意：有未归还的服装时无法删除。

---

## 统计数据 `/api/stats`

### GET 获取统计数据

返回：
- `inventory` - 库存统计（总数量、可用数量、丢失数量、借出数量、品类数）
- `loans` - 借出统计（借出中数量、借出中件数、丢失数量）
- `events` - 活动统计（进行中活动数）
- `employees` - 员工统计（员工总数）
- `recentLoans` - 最近10条借出记录
- `recentReturns` - 最近10条归还记录

---

## 归还销账统计 `/api/stats/return-stats`

### GET 获取归还销账统计数据

返回待归还和丢失的汇总统计：

```json
{
  "success": true,
  "data": {
    "totalPendingReturn": 15,
    "totalLost": 3
  }
}
```

- `totalPendingReturn` - 待归还总数（所有 LoanRecord 中 `quantity - returnedQuantity - lostQuantity > 0` 的总和）
- `totalLost` - 丢失总数（所有 LostRecord 的 quantity 总和）

---

## 归还记录 `/api/return-record`

### GET 获取归还记录（支持分页）

查询参数：
- `page` - 页码（默认 1）
- `pageSize` - 每页条数（默认 20）
- `search` - 搜索员工、服装或活动名称
- `eventId` - 按活动筛选
- `employeeId` - 按员工筛选

### POST 创建归还记录（处理归还逻辑）

请求体：
```json
{
  "loanRecordId": "xxx",
  "quantity": 3,
  "remark": "已清洗归还"
}
```

功能：
- 验证归还数量不超过待归还数量
- 更新 LoanRecord 的 returnedQuantity 和 status
- 恢复库存 availableQuantity
- 创建 ReturnRecord 记录

---

## 丢失记录 `/api/lost-record`

### GET 获取丢失记录（支持分页）

查询参数：
- `page` - 页码（默认 1）
- `pageSize` - 每页条数（默认 20）
- `search` - 搜索员工、服装或活动名称
- `eventId` - 按活动筛选
- `employeeId` - 按员工筛选
- `clothingItemId` - 按服装筛选
- `startDate` - 开始日期
- `endDate` - 结束日期

### POST 创建丢失记录

请求体：
```json
{
  "loanRecordId": "xxx",
  "employeeId": "xxx",
  "clothingItemId": "xxx",
  "quantity": 1,
  "reason": "不小心遗失",
  "remark": "..."
}
```
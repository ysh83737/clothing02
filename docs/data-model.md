# 数据字典

## Entity 关系图

```
ClothingCategory (服装品类)
    │
    └── 1:N ──→ ClothingItem (服装库存)
                      │
                      ├── 1:N ──→ LoanRecord (借出明细)
                      │              │
                      │              ├── N:1 ──→ LoanEvent (出借活动)
                      │              ├── N:1 ──→ Employee (员工)
                      │              │
                      │              └── 1:N ──→ LostRecord (丢失记录)
                      │
                      └── 1:N ──→ LostRecord (丢失记录)
```

## 数据模型

### ClothingCategory (服装品类)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (cuid) | 主键 |
| name | String | 品类名称，如"裤子"、"衬衫" |
| nameEn | String? | 英文名称（可选） |
| createdAt | DateTime | 创建时间 |

关联：`ClothingCategory 1:N ClothingItem`

---

### ClothingItem (服装库存)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (cuid) | 主键 |
| name | String | 服装名称，如"M码黑色裤子" |
| categoryId | String | 所属品类ID |
| size | String? | 尺码，如"S"、"M"、"L"、"XL" |
| totalQuantity | Int | 总库存数量 |
| availableQuantity | Int | 可用数量（未被借出） |
| lostQuantity | Int | 已丢失数量 |
| unit | String | 单位，默认"件" |
| createdAt | DateTime | 创建时间 |

关联：`ClothingItem N:1 ClothingCategory`、`ClothingItem 1:N LoanRecord`、`ClothingItem 1:N LostRecord`

---

### Employee (员工)

| 字段 |类型| 说明 |
|------|------|------|
| id | String (cuid) | 主键 |
| name | String | 员工姓名 |
| department | String? | 部门（可选） |
| phone | String? | 电话（可选） |
| createdAt | DateTime | 创建时间 |

关联：`Employee 1:N LoanRecord`、`Employee 1:N LostRecord`

---

### LoanEvent (出借活动)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (cuid) | 主键 |
| name | String | 活动名称，如"2024年会" |
| description | String? | 活动描述（可选） |
| status | String | 状态：active（进行中）、closed（已结束） |
| createdAt | DateTime | 创建时间 |

关联：`LoanEvent 1:N LoanRecord`

---

### LoanRecord (借出明细)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (cuid) | 主键 |
| loanEventId | String | 关联的活动ID |
| employeeId | String | 借衣员工ID |
| clothingItemId | String | 服装ID |
| quantity | Int | 借出数量（原始数量） |
| returnedQuantity | Int | 已归还数量 |
| status | String | 状态：borrowed（借出中）、returned（已归还）、lost（已丢失） |
| borrowedAt | DateTime | 借出时间 |
| returnedAt | DateTime? | 归还时间（可选） |

关联：`LoanRecord N:1 LoanEvent`、`LoanRecord N:1 Employee`、`LoanRecord N:1 ClothingItem`、`LoanRecord 1:N LostRecord`

**状态流转**：
- `borrowed` → `returned`（全部归还）
- `borrowed` → `lost`（部分或全部丢失）

---

### LostRecord (丢失记录)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (cuid) | 主键 |
| loanRecordId | String | 关联的借出记录ID |
| employeeId | String | 丢失人（员工）ID |
| clothingItemId | String | 服装ID |
| quantity | Int | 丢失数量 |
| lostAt | DateTime | 丢失时间 |
| reason | String? | 丢失原因（可选） |
| remark | String? | 备注（可选） |

关联：`LostRecord N:1 LoanRecord`、`LostRecord N:1 Employee`、`LostRecord N:1 ClothingItem`
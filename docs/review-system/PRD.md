# 用户点评商家审核系统 - PRD

## 1. 产品概述

### 1.1 产品目标
构建完整的用户点评商家审核系统，包含点评提交、审核管理、违规处理、数据统计等功能模块。

### 1.2 用户故事

| ID | 角色 | 需求 | 优先级 |
|----|------|------|--------|
| US-R01 | 用户 | 发表对商家的点评和评分 | P0 |
| US-R02 | 用户 | 查看商家所有点评列表 | P0 |
| US-R03 | 用户 | 点赞/举报他人点评 | P1 |
| US-R04 | 商家 | 回复用户点评 | P1 |
| US-R05 | 管理员 | 审核用户点评 (通过/拒绝) | P0 |
| US-R06 | 管理员 | 批量管理点评 (删除/隐藏) | P1 |
| US-R07 | 管理员 | 查看举报记录并处理 | P1 |
| US-R08 | 管理员 | 查看点评统计数据 | P2 |

---

## 2. 系统架构

### 2.1 模块划分 (支持 4 Agent 并行)

```
┌─────────────────────────────────────────────────────────────┐
│                    用户点评商家审核系统                       │
├─────────────┬─────────────┬─────────────┬───────────────────┤
│  Agent A    │   Agent B   │   Agent C   │     Agent D       │
│  前端模块   │  后端 API   │  审核后台   │   数据模型/测试   │
│             │             │             │                   │
│ - 点评组件  │ - 点评 API  │ - 审核页面  │ - Schema 设计     │
│ - 点评列表  │ - 审核 API  │ - 举报处理  │ - 单元测试        │
│ - 表单验证  │ - 通知 API  │ - 统计面板  │ - E2E 测试        │
│ - 交互逻辑  │ - 权限控制  │ - 批量操作  │ - 集成测试        │
└─────────────┴─────────────┴─────────────┴───────────────────┘
```

### 2.2 数据库设计

```prisma
// 点评表
model Review {
  id           String    @id @default(cuid())
  userId       String    // 用户 ID
  merchantId   String    // 商家 ID
  content      String    // 点评内容
  rating       Int       // 评分 1-5
  images       String[]  // 图片 URL 数组
  status       String    // pending/approved/rejected/hidden
  isVerified   Boolean   @default(false)  // 是否实名认证后点评
  helpfulCount Int       @default(0)      // 点赞数
  reportCount  Int       @default(0)      // 举报数
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  user         User      @relation(fields: [userId], references: [id])
  merchant     Merchant  @relation(fields: [merchantId], references: [id])
  replies      ReviewReply[]
  reports      ReviewReport[]

  @@index([merchantId])
  @@index([userId])
  @@index([status])
}

// 点评回复表
model ReviewReply {
  id         String   @id @default(cuid())
  reviewId   String
  userId     String   // 回复者 ID (商家或管理员)
  content    String
  createdAt  DateTime @default(now())

  review     Review   @relation(fields: [reviewId], references: [id])

  @@index([reviewId])
}

// 点评举报表
model ReviewReport {
  id         String   @id @default(cuid())
  reviewId   String
  userId     String   // 举报者 ID
  reason     String   // 举报原因
  status     String   @default("pending") // pending/resolved/ignored
  createdAt  DateTime @default(now())

  review     Review   @relation(fields: [reviewId], references: [id])

  @@index([reviewId])
  @@index([status])
}

// 审核日志表
model ReviewAuditLog {
  id         String   @id @default(cuid())
  reviewId   String
  adminId    String
  action     String   // approve/reject/hide/delete
  reason     String?
  createdAt  DateTime @default(now())

  @@index([reviewId])
  @@index([adminId])
}
```

---

## 3. API 设计

### 3.1 点评相关 API

| 端点 | 方法 | 描述 | 权限 |
|------|------|------|------|
| `/api/reviews` | POST | 创建点评 | 认证用户 |
| `/api/reviews` | GET | 获取点评列表 (支持商家/用户筛选) | 公开 |
| `/api/reviews/[id]` | GET | 获取点评详情 | 公开 |
| `/api/reviews/[id]` | DELETE | 删除点评 | 作者/管理员 |
| `/api/reviews/[id]/helpful` | POST | 点赞点评 | 认证用户 |
| `/api/reviews/[id]/reply` | POST | 回复点评 | 商家/管理员 |

### 3.2 审核相关 API

| 端点 | 方法 | 描述 | 权限 |
|------|------|------|------|
| `/api/admin/reviews` | GET | 获取待审核点评列表 | 管理员 |
| `/api/admin/reviews/[id]/audit` | POST | 审核点评 (通过/拒绝) | 管理员 |
| `/api/admin/reviews/bulk` | POST | 批量操作点评 | 管理员 |
| `/api/admin/reports` | GET | 获取举报列表 | 管理员 |
| `/api/admin/reports/[id]` | POST | 处理举报 | 管理员 |
| `/api/admin/reviews/stats` | GET | 获取统计数据 | 管理员 |

---

## 4. 页面设计

### 4.1 用户端页面

- **商家详情页** - 显示商家信息 + 点评列表 + 点评表单
- **点评列表组件** - 支持排序 (最新/高分/低分/有帮助)
- **个人主页 - 我的点评** - 查看/编辑/删除自己的点评

### 4.2 管理后台页面

- **审核首页** - 待审核数量 + 快捷操作
- **点评审核列表** - 筛选 (待审核/已通过/已拒绝/已举报)
- **举报处理页面** - 查看举报详情 + 处理操作
- **数据统计面板** - 点评趋势 + 商家排行 + 违规统计

---

## 5. 审核规则

### 5.1 自动审核规则
- 含敏感词 → 自动标记为待审核
- 同一用户短时间内多次点评 → 限流
- 新注册账号未实名认证 → 标记待审核

### 5.2 人工审核流程
```
用户提交 → 自动过滤 → 待审核队列 → 管理员审核 → 发布/拒绝
                ↓
           敏感词检测
                ↓
           标记 pending
```

### 5.3 举报处理流程
```
用户举报 → 计数 +1 → 超过阈值 → 自动隐藏 → 管理员复审
```

---

## 6. 验收标准

### 6.1 功能验收
- [ ] 用户可成功发表点评 (文字 + 图片 + 评分)
- [ ] 点评提交后进入审核流程
- [ ] 管理员可审核通过/拒绝点评
- [ ] 商家可回复点评
- [ ] 用户可点赞/举报点评
- [ ] 举报达到阈值自动隐藏

### 6.2 性能验收
- [ ] 点评列表加载 < 500ms
- [ ] 支持分页加载 (每页 20 条)
- [ ] 图片懒加载

### 6.3 安全验收
- [ ] XSS 防护 (内容转义)
- [ ] CSRF 保护
- [ ] 速率限制 (每用户每日最多 10 条点评)
- [ ] 权限验证 (只能删除自己的点评)

---

## 7. 任务分配矩阵

| 模块 | 负责 Agent | 主要文件 | 依赖 |
|------|-----------|---------|------|
| **A: 前端组件** | Agent A | `src/components/reviews/*` | Schema 设计 |
| **B: 后端 API** | Agent B | `src/app/api/reviews/**` | Schema 设计 |
| **C: 审核后台** | Agent C | `src/app/admin/reviews/**` | API 完成 |
| **D: 测试** | Agent D | `tests/**/*review*` | 全部完成 |

---

## 8. 开发时间线

```
Day 1: Schema 设计 → API 开发 → 前端组件
Day 2: API 完成 → 前端集成 → 后台开发
Day 3: 后台完成 → 测试编写 → 联调
Day 4: Bug 修复 → 优化 → 验收
```

---

## 9. 注意事项

1. **Agent 间协调**: 每日同步进度，确保接口一致性
2. **代码审查**: 每个模块完成后需要其他 Agent 交叉 Review
3. **冲突解决**: Schema 变更需通知所有 Agent
4. **测试优先**: Agent D 需提前编写测试用例

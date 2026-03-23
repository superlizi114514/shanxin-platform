# 用户点评商家审核系统 - 任务分解

## 任务总览

本文档将系统拆分为 4 个独立子任务，支持 4 个 Agent 并行开发。

> **注意**: 每个 Agent 的完整任务说明请参考独立文档:
> - [AGENT_A_FRONTEND.md](./AGENT_A_FRONTEND.md) - Agent A 前端组件开发完整指南
> - [AGENT_B_BACKEND.md](./AGENT_B_BACKEND.md) - Agent B 后端 API 开发完整指南
> - [AGENT_C_ADMIN.md](./AGENT_C_ADMIN.md) - Agent C 审核后台开发完整指南
> - [AGENT_D_TESTING.md](./AGENT_D_TESTING.md) - Agent D 测试与质量保证完整指南

---

## Agent A - 前端组件开发

### 任务范围
- 点评表单组件
- 点评列表组件
- 点评卡片组件
- 评分星级组件

### 任务清单

| ID | 任务 | 文件路径 | 状态 |
|----|------|---------|------|
| A-01 | 创建评分星级组件 (StarRating) | `src/components/reviews/StarRating.tsx` | ⏳ |
| A-02 | 创建点评表单组件 (ReviewForm) | `src/components/reviews/ReviewForm.tsx` | ⏳ |
| A-03 | 创建点评卡片组件 (ReviewCard) | `src/components/reviews/ReviewCard.tsx` | ⏳ |
| A-04 | 创建点评列表组件 (ReviewList) | `src/components/reviews/ReviewList.tsx` | ⏳ |
| A-05 | 创建点评过滤器 (ReviewFilter) | `src/components/reviews/ReviewFilter.tsx` | ⏳ |
| A-06 | 商家详情页集成点评 | `src/app/merchants/[id]/page.tsx` | ⏳ |
| A-07 | 个人主页 - 我的点评 | `src/app/profile/reviews/page.tsx` | ⏳ |

### 组件接口定义

#### StarRating
```tsx
interface StarRatingProps {
  rating: number;           // 当前评分 (1-5)
  onRatingChange?: (r: number) => void;  // 可选，只读/可编辑
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
}
```

#### ReviewForm
```tsx
interface ReviewFormProps {
  merchantId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}
// 表单字段：评分、内容、图片上传
```

#### ReviewCard
```tsx
interface ReviewCardProps {
  review: ReviewWithUser;   // 包含用户信息的点评对象
  showActions?: boolean;    // 显示点赞/举报按钮
  onHelpful?: (id: string) => void;
  onReport?: (id: string) => void;
}
```

#### ReviewList
```tsx
interface ReviewListProps {
  merchantId?: string;      // 按商家筛选
  userId?: string;          // 按用户筛选
  sortBy?: 'newest' | 'highest' | 'lowest' | 'helpful';
  pageSize?: number;
}
```

### 验收标准
- [ ] 所有组件支持响应式
- [ ] 表单验证完善 (内容 10-1000 字，必填项)
- [ ] 图片上传支持预览和删除
- [ ] 空状态/加载状态/错误状态处理
- [ ] 无障碍支持 (ARIA 标签)

---

## Agent B - 后端 API 开发

### 任务范围
- 点评 CRUD API
- 审核 API
- 举报 API
- 权限控制

### 任务清单

| ID | 任务 | 文件路径 | 状态 |
|----|------|---------|------|
| B-01 | 创建点评 Schema 和 Model | `prisma/schema.prisma` | ⏳ |
| B-02 | 数据库迁移 | `prisma/migrations/` | ⏳ |
| B-03 | POST /api/reviews | `src/app/api/reviews/route.ts` | ⏳ |
| B-04 | GET /api/reviews | `src/app/api/reviews/route.ts` | ⏳ |
| B-05 | GET/DELETE /api/reviews/[id] | `src/app/api/reviews/[id]/route.ts` | ⏳ |
| B-06 | POST /api/reviews/[id]/helpful | `src/app/api/reviews/[id]/helpful/route.ts` | ⏳ |
| B-07 | POST /api/reviews/[id]/reply | `src/app/api/reviews/[id]/reply/route.ts` | ⏳ |
| B-08 | POST /api/reviews/[id]/report | `src/app/api/reviews/[id]/report/route.ts` | ⏳ |
| B-09 | 敏感词过滤中间件 | `src/middleware/sensitive-words.ts` | ⏳ |
| B-10 | 速率限制中间件 | `src/middleware/rate-limit.ts` | ⏳ |

### API 响应格式

#### 创建点评 (POST /api/reviews)
```json
// Request
{
  "merchantId": "xxx",
  "content": "很好吃的餐厅...",
  "rating": 5,
  "images": ["url1", "url2"]
}

// Response (201)
{
  "success": true,
  "data": {
    "id": "xxx",
    "status": "pending",
    "createdAt": "..."
  }
}
```

#### 获取点评列表 (GET /api/reviews?merchantId=xxx&page=1)
```json
{
  "success": true,
  "data": {
    "reviews": [...],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "averageRating": 4.5
  }
}
```

### 业务逻辑要求

1. **点评创建**:
   - 验证用户已登录
   - 验证商家存在
   - 敏感词检测 → 标记为 pending
   - 未实名用户 → 标记为 pending
   - 老用户/实名认证 → 自动 approved

2. **权限控制**:
   - 删除：仅作者或管理员
   - 回复：仅商家或管理员
   - 审核：仅管理员

3. **速率限制**:
   - 每用户每日最多 10 条点评
   - 每 IP 每小时最多 20 条

### 验收标准
- [ ] 所有 API 通过 Zod 验证输入
- [ ] 错误处理完善
- [ ] 权限验证正确
- [ ] 速率限制生效
- [ ] 敏感词过滤工作正常

---

## Agent C - 审核后台开发

### 任务范围
- 审核列表页面
- 审核操作功能
- 举报处理页面
- 数据统计面板

### 任务清单

| ID | 任务 | 文件路径 | 状态 |
|----|------|---------|------|
| C-01 | 审核首页 (数据概览) | `src/app/admin/reviews/page.tsx` | ⏳ |
| C-02 | 审核列表页 | `src/app/admin/reviews/list/page.tsx` | ⏳ |
| C-03 | 点评审核弹窗/页面 | `src/app/admin/reviews/[id]/audit/page.tsx` | ⏳ |
| C-04 | 批量操作功能 | `src/app/admin/reviews/bulk/route.ts` | ⏳ |
| C-05 | 举报列表页 | `src/app/admin/reports/page.tsx` | ⏳ |
| C-06 | 举报处理功能 | `src/app/admin/reports/[id]/route.ts` | ⏳ |
| C-07 | 统计面板组件 | `src/components/admin/ReviewStats.tsx` | ⏳ |
| C-08 | 审核日志功能 | `src/app/admin/reviews/logs/page.tsx` | ⏳ |

### 页面功能要求

#### 审核首页
- 今日待审核数量
- 本周审核趋势图
- 快捷操作入口

#### 审核列表
- 筛选：状态 (pending/approved/rejected/hidden)、时间范围、商家
- 排序：提交时间、评分、举报数
- 批量操作：批量通过、批量拒绝、批量删除

#### 审核操作
- 查看点评详情 (内容、图片、用户信息)
- 查看商家信息
- 审核操作：通过 / 拒绝 (需填写理由) / 隐藏 / 删除
- 审核历史记录

#### 举报处理
- 举报列表 (按举报数排序)
- 举报详情 (举报原因、举报人、被举报点评)
- 处理操作：忽略 / 隐藏点评 / 删除点评 / 封禁用户

#### 统计面板
- 点评总数、待审核数、通过率
- 商家评分排行
- 违规点评趋势
- 举报处理统计

### 验收标准
- [ ] 管理员权限验证
- [ ] 批量操作正确执行
- [ ] 筛选/排序功能正常
- [ ] 统计图表数据准确
- [ ] 操作日志记录完整

---

## Agent D - 测试与质量保证

### 任务范围
- 单元测试
- 集成测试
- E2E 测试
- 性能测试

### 任务清单

| ID | 任务 | 文件路径 | 状态 |
|----|------|---------|------|
| D-01 | 点评 Service 单元测试 | `tests/unit/review-service.test.ts` | ⏳ |
| D-02 | 审核逻辑单元测试 | `tests/unit/audit-logic.test.ts` | ⏳ |
| D-03 | API 集成测试 | `tests/integration/reviews-api.test.ts` | ⏳ |
| D-04 | 权限测试 | `tests/integration/auth.test.ts` | ⏳ |
| D-05 | E2E-用户发表点评 | `tests/e2e/create-review.spec.ts` | ⏳ |
| D-06 | E2E-审核流程 | `tests/e2e/audit-flow.spec.ts` | ⏳ |
| D-07 | E2E-举报处理 | `tests/e2e/report-flow.spec.ts` | ⏳ |
| D-08 | 性能测试 (负载) | `tests/performance/reviews-load.spec.ts` | ⏳ |
| D-09 | 安全扫描 | `scripts/security-scan.ts` | ⏳ |
| D-10 | 可访问性测试 | `tests/a11y/reviews.spec.ts` | ⏳ |

### 测试用例设计

#### 单元测试用例
```typescript
// review-service.test.ts
describe('ReviewService', () => {
  test('创建点评 - 成功', async () => {...});
  test('创建点评 - 含敏感词', async () => {...});
  test('创建点评 - 未实名用户', async () => {...});
  test('删除点评 - 非作者无权限', async () => {...});
  test('点赞 - 不能重复点赞', async () => {...});
});

// audit-logic.test.ts
describe('AuditLogic', () => {
  test('自动通过 - 老用户', async () => {...});
  test('自动待审 - 新用户', async () => {...});
  test('自动隐藏 - 举报超阈值', async () => {...});
});
```

#### E2E 测试场景
```typescript
// create-review.spec.ts
describe('E2E: 用户发表点评', () => {
  test('完整流程：登录 → 访问商家 → 填写表单 → 提交 → 查看结果', async () => {...});
  test('表单验证：空内容 → 显示错误', async () => {...});
  test('图片上传：选择 → 预览 → 提交', async () => {...});
});

// audit-flow.spec.ts
describe('E2E: 审核流程', () => {
  test('管理员登录 → 查看待审核 → 通过 → 验证前端显示', async () => {...});
  test('管理员拒绝点评 → 填写理由 → 用户收到通知', async () => {...});
});
```

### 性能测试要求

| 场景 | 目标 | 通过标准 |
|------|------|----------|
| 点评列表加载 | 95% < 500ms | P95 < 500ms |
| 点评创建 | 99% < 1s | P99 < 1000ms |
| 并发审核 | 10 并发 < 2s | 无超时 |
| 图片上传 | 单张 < 3s | 成功率 > 99% |

### 验收标准
- [ ] 单元测试覆盖率 > 80%
- [ ] 集成测试覆盖所有 API
- [ ] E2E 测试覆盖核心用户流程
- [ ] 性能测试达标
- [ ] 无高危安全漏洞
- [ ] 无障碍测试通过

---

## Agent 协作接口

### 每日同步点

| 时间 | 内容 | 参与 |
|------|------|------|
| 09:00 | 晨会 - 今日计划 | 全体 |
| 12:00 | 进度同步 | 全体 |
| 18:00 | 代码 Review | 交叉 Review |

### 接口约定

#### Agent A ↔ Agent B
- 前端组件依赖的 API 接口格式
- 错误码统一规范
- Loading/Error 状态处理

#### Agent B ↔ Agent C
- 后台 API 数据结构
- 批量操作接口
- 统计数据结构

#### Agent D ↔ 全体
- 测试环境问题反馈
- Bug 报告
- 性能优化建议

### 冲突解决机制

1. **Schema 变更**: Agent B 发起 → 全体确认 → Agent D 更新测试
2. **API 变更**: Agent B 发起 → Agent A/C 确认 → 更新文档
3. **组件复用**: Agent A 创建通用组件 → 其他 Agent 使用

---

## 开始指令

各 Agent 收到任务后，请回复：
```
Agent [A/B/C/D] 已接收任务，开始执行 [任务范围]
预计完成时间：[时间]
需要协调事项：[如有]
```

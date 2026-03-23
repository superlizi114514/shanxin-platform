# Task 1 状态检查报告

## Part A：兼职功能 - ❌ 完全缺失

**需要从零开始实现：**

### 数据模型（Prisma Schema）
- [ ] PartTimeJob - 兼职信息
- [ ] JobApplication - 申请记录
- [ ] JobReport - 举报
- [ ] PartTimeJobImage - 兼职图片

### API 路由
- [ ] GET/POST /api/part-time-jobs - 兼职列表/发布
- [ ] GET/PATCH/DELETE /api/part-time-jobs/[id] - 兼职详情/更新/删除
- [ ] POST /api/part-time-jobs/[id]/apply - 申请职位
- [ ] GET /api/admin/part-time-jobs - 管理后台列表
- [ ] POST /api/admin/part-time-jobs/audit - 批量审核

### 前端页面
- [ ] /part-time-jobs - 兼职列表页
- [ ] /part-time-jobs/[id] - 兼职详情页
- [ ] /part-time-jobs/create - 发布兼职页
- [ ] /part-time-jobs/my - 我的兼职页
- [ ] /admin/part-time-jobs - 管理后台审核页

---

## Part B：商家点评 - ⚠️ 部分实现

### 已完成 ✅
- MerchantReview 数据模型（但缺少 status 字段）
- MerchantReviewImage 图片模型
- MerchantReviewHelpful 点赞模型
- POST /api/merchants/[id]/reviews - 提交点评 API
- GET /api/merchants/[id]/reviews - 获取点评列表 API
- DELETE /api/merchant-reviews/[id] - 删除点评 API
- GET /api/admin/reviews - 管理员点评列表 API
- /api/admin/reviews/[id]/audit - 审核 API
- 商家详情页 (`/merchants/[id]`)
- 点评表单组件 (`review-form.tsx`)
- 评分组件 (`star-rating.tsx`)

### 需要补充 ❌
1. **Prisma Schema** - MerchantReview 添加 status 字段
   ```prisma
   status String @default("pending") // pending/approved/rejected
   ```

2. **API 修改** - 点评列表只返回 approved 状态
   - `/api/merchants/[id]/reviews` 需要过滤 status = 'approved'

3. **商家详情页修改** - 点评入口和列表显示
   - 确认点评列表只显示已审核通过的

---

## 下一步行动

1. 修改 Prisma Schema，添加 status 字段到 MerchantReview
2. 运行 `npx prisma migrate dev` 更新数据库
3. 修改点评 API 过滤逻辑
4. 开始实现兼职功能（完整模块）

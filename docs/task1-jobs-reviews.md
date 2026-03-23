# Task 1：兼职功能 + 商家点评

## 需求概述
兼职发布申请 + 商家点评两大业务模块。

---

## Part A：兼职功能

### 数据模型
```prisma
PartTimeJob        // 兼职信息
JobApplication     // 申请记录
JobReport          // 举报
PartTimeJobImage   // 兼职图片
```

### API 路由
| 路由 | 方法 | 功能 |
|------|------|------|
| /api/part-time-jobs | GET | 兼职列表（筛选/分页） |
| /api/part-time-jobs | POST | 发布兼职 |
| /api/part-time-jobs/[id] | GET | 兼职详情 |
| /api/part-time-jobs/[id] | PATCH | 更新兼职 |
| /api/part-time-jobs/[id] | DELETE | 删除兼职 |
| /api/part-time-jobs/[id]/apply | POST | 申请职位 |
| /api/admin/part-time-jobs | GET | 管理后台列表 |
| /api/admin/part-time-jobs/audit | POST | 批量审核 |

### 前端页面
- `/part-time-jobs` - 兼职列表页
- `/part-time-jobs/[id]` - 兼职详情页
- `/part-time-jobs/create` - 发布兼职页
- `/part-time-jobs/my` - 我的兼职页
- `/admin/part-time-jobs` - 管理后台审核页

### 审核流程
1. 提交时自动检测敏感词
2. 无敏感词 → 自动通过
3. 有敏感词 → 转人工审核

---

## Part B：商家点评

### 数据模型变更
```prisma
MerchantReview {
  status String @default("pending") // pending/approved/rejected
}
```

### API 路由
| 路由 | 方法 | 功能 |
|------|------|------|
| /api/merchant-reviews | GET | 获取点评列表（仅 approved） |
| /api/merchant-reviews | POST | 提交点评 |
| /api/admin/merchant-reviews | GET | 管理后台列表 |
| /api/admin/merchant-reviews | POST | 批量审核 |

### 前端页面
- `src/app/merchants/[id]/review/page.tsx` - 写点评页
- `src/app/admin/merchant-reviews/page.tsx` - 审核后台

### 入口位置
1. 商家详情页 - 写点评按钮 + 点评列表
2. 商家列表页 - 每个卡片点评入口
3. 订单完成页 - 订单完成后点评入口

### 点评提交要素
- 评分（1-5 星）
- 内容（10-500 字）
- 图片（可选）

---

## 验收标准
- [ ] 用户可发布/编辑/删除兼职
- [ ] 用户可申请兼职
- [ ] 列表支持筛选（类别/薪资/区域）
- [ ] 管理后台可批量审核（兼职 + 点评）
- [ ] 敏感词自动拦截
- [ ] 用户可提交点评
- [ ] 点评列表只显示已审核通过的
- [ ] 商家评分自动更新

## 预计工作量：18 小时

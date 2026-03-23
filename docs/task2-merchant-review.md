# 任务二：商家点评用户入口

## 需求概述
用户可点评商家，提交后审核显示。

## 数据模型变更
```prisma
MerchantReview {
  status String @default("pending") // pending/approved/rejected
}
```

## API 路由
| 路由 | 方法 | 功能 |
|------|------|------|
| /api/merchant-reviews | GET | 获取点评列表（仅 approved） |
| /api/merchant-reviews | POST | 提交点评 |
| /api/admin/merchant-reviews | GET | 管理后台列表 |
| /api/admin/merchant-reviews | POST | 批量审核 |

## 前端页面
- `src/app/merchants/[id]/review/page.tsx` - 写点评页
- `src/app/admin/merchant-reviews/page.tsx` - 审核后台

## 入口位置
1. 商家详情页 - 写点评按钮 + 点评列表
2. 商家列表页 - 每个卡片点评入口
3. 订单完成页 - 订单完成后点评入口

## 点评提交要素
- 评分（1-5 星）
- 内容（10-500 字）
- 图片（可选）

## 审核流程
1. 提交时检测敏感词
2. 无敏感词 → 自动 approved
3. 有敏感词 → pending 待审核

## 验收标准
- [ ] 用户可提交点评
- [ ] 点评列表只显示已审核通过的
- [ ] 管理后台可批量审核
- [ ] 商家评分自动更新

## 预计工作量：8 小时

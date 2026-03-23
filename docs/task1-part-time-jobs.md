# 任务一：兼职功能模块

## 需求概述
用户可发布/申请兼职，管理后台审核。

## 数据模型
```prisma
PartTimeJob        // 兼职信息
JobApplication     // 申请记录
JobReport          // 举报
PartTimeJobImage   // 兼职图片
```

## API 路由
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

## 前端页面
- `/part-time-jobs` - 兼职列表页
- `/part-time-jobs/[id]` - 兼职详情页
- `/part-time-jobs/create` - 发布兼职页
- `/part-time-jobs/my` - 我的兼职页
- `/admin/part-time-jobs` - 管理后台审核页

## 审核流程
1. 提交时自动检测敏感词
2. 无敏感词 → 自动通过
3. 有敏感词 → 转人工审核

## 验收标准
- [ ] 用户可发布/编辑/删除兼职
- [ ] 用户可申请兼职
- [ ] 列表支持筛选（类别/薪资/区域）
- [ ] 管理后台可批量审核
- [ ] 敏感词自动拦截

## 预计工作量：10 小时

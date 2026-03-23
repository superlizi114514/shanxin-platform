# Agent 2 - 管理后台系统

## 负责范围

**模块边界**: 管理员后台、商家管理、新闻管理、信息大全管理、用户管理

**US 任务**: US-010 ~ US-014 (共 5 个任务)

---

## 任务清单

| US ID | 任务名称 | 状态 | 文件范围 |
|-------|----------|------|----------|
| US-010 | 创建管理员后台主页 | ⏳ 待执行 | `src/pages/admin/index.tsx` |
| US-011 | 完善商家管理后台页面 | ⏳ 待执行 | `src/pages/admin/merchants.tsx` |
| US-012 | 完善新闻管理后台页面 | ⏳ 待执行 | `src/pages/admin/news.tsx` |
| US-013 | 完善信息大全管理后台页面 | ⏳ 待执行 | `src/pages/admin/guides.tsx` |
| US-014 | 创建用户管理后台页面 | ⏳ 待执行 | `src/pages/admin/users.tsx` |

---

## 执行顺序

```
阶段 1: US-010 (管理员后台主页)
阶段 2: US-011 → US-012 → US-013 → US-014 (各管理页面)
```

---

## API 边界

### 允许调用的 API
- ✅ `/api/admin/*` - 管理后台 API
- ✅ `/api/merchants/*` - 商家数据 API
- ✅ `/api/news/*` - 新闻数据 API
- ✅ `/api/guides/*` - 信息大全 API
- ✅ `/api/users/*` - 用户数据 API

### 禁止调用的 API
- ❌ `/api/schedule/*` - 课表 API
- ❌ `/api/products/*` - 二手商品 API
- ❌ `/api/profile/*` - 个人主页 API (用户管理除外)

---

## 当前任务

**US-010**: 创建管理员后台主页

### 验收标准
- [ ] 创建 `/admin` 管理主页
- [ ] 显示管理功能卡片：商家管理、新闻管理、信息大全、用户管理
- [ ] 显示系统统计：用户数、商品数、商家数
- [ ] 仅管理员可访问 (权限验证)
- [ ] Typecheck passes
- [ ] 浏览器验证

---

## 管理员权限验证

```typescript
// 所有管理页面必须添加权限验证
import { useSession } from 'next-auth/react';

// 检查用户角色是否为 admin
if (session?.user?.role !== 'admin') {
  // 重定向或显示无权限提示
}
```

---

## 构建命令

```bash
# 开发服务器
npm run dev

# 类型检查
npx tsc --noEmit

# ESLint
npm run lint

# 构建验证
npm run build
```

---

## 注意事项

1. 每次迭代只完成一个用户故事
2. 完成后更新 `.ralph/prd.json` 中对应任务的 `passes: true`
3. 更新 `.ralph/progress.txt` 进度
4. 输出 RALPH_STATUS 包含 EXIT_SIGNAL

---

**优先级**: P1 (管理后台)

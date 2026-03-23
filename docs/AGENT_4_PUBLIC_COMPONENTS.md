# Agent 4 - 公共组件与分站页面

## 负责范围

**模块边界**: 安全防护、UI 组件、商品/商家/新闻/消息/订单页面、全局组件

**US 任务**: US-021 ~ US-041 (共 20 个任务)

---

## 任务清单

### P3 - 安全加固
| US ID | 任务名称 | 状态 | 文件范围 |
|-------|----------|------|----------|
| US-021 | 对所有 API 输入进行安全验证 | ⏳ 待执行 | `src/lib/validators/*.ts` |
| US-022 | 添加 API 速率限制 | ⏳ 待执行 | `src/middleware/rate-limit.ts` |
| US-023 | 添加 CSRF 保护 | ⏳ 待执行 | `src/lib/auth.ts` |

### P4 - UI/UX 优化
| US ID | 任务名称 | 状态 | 文件范围 |
|-------|----------|------|----------|
| US-024 | 优化首页响应式布局 | ⏳ 待执行 | `src/pages/index.tsx` |
| US-025 | 优化首页卡片动画效果 | ⏳ 待执行 | `src/components/HomeCard.tsx` |
| US-026 | 添加首页-loading 骨架屏 | ⏳ 待执行 | `src/components/Skeleton.tsx` |

### P5 - 功能完善
| US ID | 任务名称 | 状态 | 文件范围 |
|-------|----------|------|----------|
| US-027 | 完善商品列表页面 | ⏳ 待执行 | `src/pages/products/index.tsx` |
| US-028 | 完善商品详情页面 | ⏳ 待执行 | `src/pages/products/[id].tsx` |
| US-029 | 完善商家列表页面 | ⏳ 待执行 | `src/pages/merchants/index.tsx` |
| US-030 | 完善商家详情页面 | ⏳ 待执行 | `src/pages/merchants/[id].tsx` |
| US-031 | 完善新闻列表页面 | ⏳ 待执行 | `src/pages/news/index.tsx` |
| US-032 | 完善新闻详情页面 | ⏳ 待执行 | `src/pages/news/[id].tsx` |
| US-033 | 完善消息页面 | ⏳ 待执行 | `src/pages/messages/index.tsx` |
| US-034 | 完善通知页面 | ⏳ 待执行 | `src/pages/notifications/index.tsx` |
| US-035 | 完善订单页面 | ⏳ 待执行 | `src/pages/orders/index.tsx` |
| US-037 | 添加登录/注册页面优化 | ⏳ 待执行 | `src/pages/login.tsx`, `src/pages/register.tsx` |
| US-038 | 添加全局导航栏 | ⏳ 待执行 | `src/components/Navbar.tsx` |
| US-039 | 添加全局 Footer | ⏳ 待执行 | `src/components/Footer.tsx` |
| US-040 | 添加全局 Toast 通知组件 | ⏳ 待执行 | `src/components/Toast.tsx` |

### P6 - 最终验证
| US ID | 任务名称 | 状态 | 文件范围 |
|-------|----------|------|----------|
| US-041 | 运行并验证所有功能 | ⏳ 待执行 | 全项目验收 |

---

## 执行顺序

```
阶段 1: US-021 → US-022 → US-023 (安全加固 - 优先级最高)
阶段 2: US-038 → US-039 → US-040 (全局组件 - 其他页面依赖)
阶段 3: US-024 → US-025 → US-026 (首页优化)
阶段 4: US-027 → US-028 (商品页面)
阶段 5: US-029 → US-030 (商家页面)
阶段 6: US-031 → US-032 (新闻页面)
阶段 7: US-033 → US-034 → US-035 (消息、通知、订单)
阶段 8: US-037 (登录注册优化)
阶段 9: US-041 (最终验证)
```

---

## API 边界

### 允许调用的 API
- ✅ `/api/products/*` - 二手商品 API
- ✅ `/api/merchants/*` - 商家 API
- ✅ `/api/news/*` - 新闻 API
- ✅ `/api/messages/*` - 消息 API
- ✅ `/api/notifications/*` - 通知 API
- ✅ `/api/orders/*` - 订单 API
- ✅ `/api/auth/*` - 认证 API
- ✅ `/api/reviews/*` - 评价 API
- ✅ `/api/collections/*` - 收藏 API

### 禁止调用的 API
- ❌ `/api/admin/*` - 管理后台 API
- ❌ `/api/schedule/*` - 课表 API (除只读获取外)

---

## 当前任务

**US-021**: 对所有 API 输入进行安全验证

### 验收标准
- [ ] 为所有 API 路由添加 Zod schema 验证
- [ ] 验证字符串长度限制
- [ ] 验证数字范围
- [ ] 验证枚举值
- [ ] 清理 HTML/XSS 内容
- [ ] Typecheck passes

---

## 安全防护实现示例

```typescript
// src/lib/validators/product.ts
import { z } from 'zod';

export const createProductSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(2000),
  price: z.number().positive().max(999999),
  category: z.enum(['electronics', 'books', 'clothing', 'other']),
});
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

**优先级**: P3-P6 (安全加固 → UI 优化 → 功能完善 → 最终验证)

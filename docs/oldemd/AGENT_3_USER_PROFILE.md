# Agent 3 - 个人主页系统

## 负责范围

**模块边界**: 个人主页、基本信息、我的发布、我的收藏、我的评价、账号安全

**US 任务**: US-015 ~ US-020 (共 6 个任务)

---

## 任务清单

| US ID | 任务名称 | 状态 | 文件范围 |
|-------|----------|------|----------|
| US-015 | 完善个人主页基本信息 | ⏳ 待执行 | `src/pages/profile/index.tsx` |
| US-016 | 添加个人主页 - 我的发布 | ⏳ 待执行 | `src/pages/profile/my-products.tsx` |
| US-017 | 添加个人主页 - 我的收藏 | ⏳ 待执行 | `src/pages/profile/collections.tsx` |
| US-018 | 添加个人主页 - 我的课表 | ⏳ 待执行 | `src/pages/profile/schedule.tsx` |
| US-019 | 添加个人主页 - 我的评价 | ⏳ 待执行 | `src/pages/profile/reviews.tsx` |
| US-020 | 添加个人主页 - 账号安全 | ⏳ 待执行 | `src/pages/profile/security.tsx` |

---

## 执行顺序

```
阶段 1: US-015 (个人主页基本信息)
阶段 2: US-016 → US-017 (我的发布、我的收藏)
阶段 3: US-018 → US-019 (我的课表、我的评价)
阶段 4: US-020 (账号安全)
```

---

## API 边界

### 允许调用的 API
- ✅ `/api/profile/*` - 个人资料 API
- ✅ `/api/auth/*` - 认证相关 API
- ✅ `/api/upload/*` - 文件上传 API
- ✅ `/api/products/*` - 获取我的商品 (只读)
- ✅ `/api/collections/*` - 收藏相关 API
- ✅ `/api/reviews/*` - 评价相关 API
- ✅ `/api/schedule/*` - 获取我的课表 (只读)

### 禁止调用的 API
- ❌ `/api/admin/*` - 管理后台 API
- ❌ 其他用户的私有数据 API

---

## 当前任务

**US-015**: 完善个人主页基本信息

### 验收标准
- [ ] 显示用户头像、昵称、邮箱
- [ ] 显示学号、学校、专业、班级
- [ ] 支持上传头像
- [ ] 支持编辑昵称
- [ ] 支持修改手机号
- [ ] Typecheck passes
- [ ] 浏览器验证

---

## 总站个人主页架构说明

根据 `PROFILE_PAGES.md`:

```
总站个人主页 (/profile)
├── 基本信息管理
├── 我的发布（来自二手平台）- 只读展示
├── 我的收藏（来自二手平台）- 只读展示
├── 我的课表（来自课表系统）- 只读展示
├── 我的评价（整合二手平台 + 商家点评）
└── 账号安全（总站）
```

**注意**: 总站个人主页主要是数据展示和导航，需要修改、删除等操作时，跳转到对应分站页面。

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

**优先级**: P2 (个人主页)

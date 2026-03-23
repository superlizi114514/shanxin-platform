# 后台 UI 改造 - 任务三：管理页面详情与编辑功能 - 实施计划

## 需求重述

为后台管理系统的 4 个核心模块（用户管理、商家管理、新闻管理、信息大全）添加：
1. **详情页** - 展示完整信息和统计数据
2. **编辑页** - 支持数据修改、表单验证、图片上传
3. **配套 API** - 获取详情、更新数据的接口

---

## 现有状态分析

### 已完成的页面和 API
| 模块 | 列表页 | API | 详情页 | 编辑页 | 详情 API | 更新 API |
|------|--------|-----|--------|--------|----------|----------|
| 用户管理 | ✅ | ✅ GET | ❌ | ❌ | ❌ | ❌ |
| 商家管理 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 新闻管理 | ✅ (读 `/api/news`) | ✅ | ❌ | ❌ | ❌ | ❌ |
| 信息大全 | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| 点评管理 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**结论**: 点评管理模块已完成，其他 3 个模块需新增详情页、编辑页和对应 API。

---

## 实现 Phase

### Phase 1: 用户管理模块（复杂度：高）

#### 1.1 API 开发
**文件**: `src/app/api/admin/users/[id]/route.ts`

- [ ] **GET** - 获取用户详情
  - 返回用户基本信息、学生信息
  - 包含统计数据（商品数、订单数、收藏数）
  - 包含最近登录时间、操作日志

- [ ] **PUT** - 更新用户信息
  - 支持修改基本信息（昵称、手机号）
  - 支持修改角色（user/admin）
  - 支持修改账号状态（正常/禁用）
  - Zod 验证

- [ ] **DELETE** - 删除用户
  - 软删除或检查关联数据

**文件**: `src/app/api/admin/users/[id]/reset-password/route.ts`
- [ ] **POST** - 重置密码

#### 1.2 详情页 UI
**文件**: `src/app/admin/users/[id]/page.tsx`

- [ ] 基本信息卡片（头像、昵称、邮箱、手机号、角色）
- [ ] 学生信息卡片（学号、校区、系、班级）
- [ ] 统计数据卡片（商品数、订单数、收藏数）
- [ ] 操作记录表格（登录时间、IP 地址）
- [ ] 操作按钮（编辑、重置密码、禁用/启用）

#### 1.3 编辑页 UI
**文件**: `src/app/admin/users/[id]/edit/page.tsx`

- [ ] 表单字段：昵称、手机号、角色选择、状态切换
- [ ] 表单验证使用 Zod
- [ ] 保存/取消按钮
- [ ] 返回导航

---

### Phase 2: 商家管理模块（复杂度：中）

#### 2.1 API 开发
**文件**: `src/app/api/admin/merchants/[id]/route.ts`

- [ ] **GET** - 获取商家详情
  - 包含评分数据、评价数
  - 包含商家图片
  - 包含认领状态

- [ ] **PUT** - 更新商家信息
  - 名称、描述、地址、电话
  - 认证商家、上下架

**文件**: `src/app/api/admin/merchants/route.ts`
- [ ] **GET** - 商家列表（已有则跳过）

#### 2.2 详情页 UI
**文件**: `src/app/admin/merchants/[id]/page.tsx`

- [ ] 商家信息卡片（logo、名称、描述、地址）
- [ ] 评分数据展示（平均分、评价数）
- [ ] 图片画廊（环境图展示）
- [ ] 认领状态标识
- [ ] 操作按钮（编辑、认证、上下架）

#### 2.3 编辑页 UI
**文件**: `src/app/admin/merchants/[id]/edit/page.tsx`

- [ ] 表单字段：名称、描述、地址、电话、学校选择
- [ ] 图片上传组件（支持预览）
- [ ] 分类选择
- [ ] 认证商家、认领审核
- [ ] Zod 验证

---

### Phase 3: 新闻管理模块（复杂度：中）

#### 3.1 API 开发
**文件**: `src/app/api/admin/news/[id]/route.ts`

- [ ] **GET** - 获取新闻详情
  - 包含完整内容、作者信息
  - 包含浏览量、评论数

- [ ] **PUT** - 更新新闻
  - 标题、内容、封面图、分类
  - 发布状态切换

- [ ] **DELETE** - 删除新闻

#### 3.2 详情页 UI
**文件**: `src/app/admin/news/[id]/page.tsx`

- [ ] 新闻内容展示（标题、正文、封面图）
- [ ] 发布信息（作者、发布时间）
- [ ] 统计数据（浏览量、评论数）
- [ ] 操作按钮（编辑、下架/发布、删除）

#### 3.3 编辑页 UI
**文件**: `src/app/admin/news/[id]/edit/page.tsx`

- [ ] Markdown 编辑器（可使用 react-markdown 或类似库）
- [ ] 图片上传（封面图）
- [ ] 分类选择（下拉框）
- [ ] 发布状态切换
- [ ] Zod 验证

---

### Phase 4: 信息大全模块（复杂度：低）

#### 4.1 API 开发
**文件**: `src/app/api/admin/guide/[id]/route.ts`

- [ ] **GET** - 获取文章详情
- [ ] **PUT** - 更新文章
- [ ] **DELETE** - 删除文章

#### 4.2 详情页 UI
**文件**: `src/app/admin/guide/[id]/page.tsx`

- [ ] 文章信息（标题、分类、标签）
- [ ] 内容预览
- [ ] 浏览统计
- [ ] 操作按钮

#### 4.3 编辑页 UI
**文件**: `src/app/admin/guide/[id]/edit/page.tsx`

- [ ] 分类选择
- [ ] 标签管理（多选或输入创建）
- [ ] 内容编辑
- [ ] 发布状态切换

---

## 技术栈和依赖

### UI 组件
- **shadcn/ui**: 表单、卡片、对话框等基础组件
- **lucide-react**: 图标
- **react-markdown**: Markdown 编辑器（新闻模块）

### 验证
- **zod**: 表单验证 schema

### 工具
- **react-hook-form**: 表单处理（可选）
- **sonner** 或 **react-hot-toast**: Toast 提示

---

## 依赖关系

```
Phase 1 (用户管理)
└─ 无外部依赖

Phase 2 (商家管理)
└─ 依赖 Phase 1 的 UI 模式

Phase 3 (新闻管理)
└─ 依赖 Phase 1 的 UI 模式
└─ 需额外集成 Markdown 编辑器

Phase 4 (信息大全)
└─ 依赖 Phase 1 的 UI 模式
```

---

## 风险识别

### 高风险
1. **图片上传**: 需要配置存储（现有 `/api/upload` 需确认是否可用）
2. **权限控制**: 确保只有 admin 可访问

### 中风险
1. **Markdown 编辑器**: 选择合适的轻量级方案
2. **表单验证**: 需要为每个模块编写 Zod schema

### 低风险
1. **UI 一致性**: 复用现有设计模式
2. **API 错误处理**: 统一错误响应格式

---

## 验收标准 Checklist

### 通用标准（所有模块）
- [ ] 详情页展示完整信息
- [ ] 编辑表单验证完善（zod）
- [ ] 图片上传支持预览
- [ ] 操作反馈及时（toast）
- [ ] 返回导航正确

### 模块特定标准

**用户管理**:
- [ ] 显示统计数据
- [ ] 角色权限可调整
- [ ] 重置密码功能可用

**商家管理**:
- [ ] 评分数据展示
- [ ] 认证商家功能
- [ ] 认领审核流程

**新闻管理**:
- [ ] Markdown 编辑可用
- [ ] 封面图上传
- [ ] 发布状态切换

**信息大全**:
- [ ] 分类/标签管理
- [ ] 内容编辑
- [ ] 发布状态切换

---

## 预计工作量

| Phase | 复杂度 | 预估时间 |
|-------|--------|----------|
| Phase 1: 用户管理 | 高 | 4-6 小时 |
| Phase 2: 商家管理 | 中 | 3-4 小时 |
| Phase 3: 新闻管理 | 中 | 3-5 小时 |
| Phase 4: 信息大全 | 低 | 2-3 小时 |
| **总计** | - | **12-18 小时** |

---

## 文件清单

### 新建文件（12 个）
```
src/app/admin/users/[id]/page.tsx
src/app/admin/users/[id]/edit/page.tsx
src/app/api/admin/users/[id]/route.ts
src/app/api/admin/users/[id]/reset-password/route.ts

src/app/admin/merchants/[id]/page.tsx
src/app/admin/merchants/[id]/edit/page.tsx
src/app/api/admin/merchants/[id]/route.ts

src/app/admin/news/[id]/page.tsx
src/app/admin/news/[id]/edit/page.tsx
src/app/api/admin/news/[id]/route.ts

src/app/admin/guide/[id]/page.tsx
src/app/admin/guide/[id]/edit/page.tsx
src/app/api/admin/guide/[id]/route.ts
```

### 更新文件（可选）
```
src/app/api/admin/merchants/route.ts (如不存在)
src/lib/validators/ (添加 zod schema)
```

---

## 下一步

**等待确认**: 是否按此计划执行？
- 回复 "yes" 或 "proceed" 开始 Phase 1
- 回复 "modify: [修改内容]" 调整计划
- 回复 "skip phase X" 跳过特定阶段

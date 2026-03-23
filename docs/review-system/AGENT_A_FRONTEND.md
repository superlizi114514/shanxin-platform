# Agent A - 前端组件开发

## 任务范围

负责用户点评商家系统的所有前端组件开发，包括点评表单、点评列表、评分组件等核心 UI 组件。

---

## 任务清单

| ID | 任务 | 文件路径 | 状态 | 优先级 |
|----|------|---------|------|--------|
| A-01 | 创建评分星级组件 (StarRating) | `src/components/reviews/StarRating.tsx` | ⏳ | P0 |
| A-02 | 创建点评表单组件 (ReviewForm) | `src/components/reviews/ReviewForm.tsx` | ⏳ | P0 |
| A-03 | 创建点评卡片组件 (ReviewCard) | `src/components/reviews/ReviewCard.tsx` | ⏳ | P0 |
| A-04 | 创建点评列表组件 (ReviewList) | `src/components/reviews/ReviewList.tsx` | ⏳ | P0 |
| A-05 | 创建点评过滤器 (ReviewFilter) | `src/components/reviews/ReviewFilter.tsx` | ⏳ | P1 |
| A-06 | 商家详情页集成点评 | `src/app/merchants/[id]/page.tsx` | ⏳ | P0 |
| A-07 | 个人主页 - 我的点评 | `src/app/profile/reviews/page.tsx` | ⏳ | P1 |

---

## 组件接口定义

### StarRating - 评分星级组件

```tsx
interface StarRatingProps {
  rating: number;           // 当前评分 (1-5)
  onRatingChange?: (r: number) => void;  // 回调函数，未提供则为只读
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
}
```

**设计要求:**
- 使用 SVG 星星图标 (Lucide 或 Heroicons)
- 支持键盘导航 (ArrowLeft/ArrowRight 选择评分)
- Hover 效果：未选中的星星半透明，hover 时高亮
- 选中状态：实心星星 + 主题色填充
- 无障碍：ARIA label 描述当前评分

**视觉规范:**
```
sm: 16px (评论卡片内嵌)
md: 24px (表单默认)
lg: 32px (商家详情页头部)

颜色:
- 选中：#F59E0B (amber-500)
- 未选中：#D1D5DB (gray-300)
- Hover: #FBBF24 (amber-400)
```

---

### ReviewForm - 点评表单组件

```tsx
interface ReviewFormProps {
  merchantId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}
```

**表单字段:**
| 字段 | 类型 | 验证规则 | 提示 |
|------|------|----------|------|
| rating | number | 必填，1-5 | "请评分" |
| content | string | 必填，10-1000 字 | "分享您的消费体验..." |
| images | File[] | 可选，最多 5 张 | 支持 jpg/png，单张<5MB |

**功能要求:**
1. **图片上传:**
   - 拖拽上传支持
   - 上传中显示进度条
   - 预览支持删除
   - 失败重试

2. **表单验证:**
   - 实时验证 (onChange)
   - 提交前全量验证
   - 错误提示靠近问题字段

3. **状态处理:**
   - 加载中：按钮禁用 + 转圈动画
   - 成功：Toast 提示 + 跳转/关闭
   - 失败：显示错误原因

**UI 设计:**
```tsx
// 表单布局
┌────────────────────────────────┐
│  ⭐⭐⭐⭐⭐  (评分)              │
│                                │
│  ┌──────────────────────────┐  │
│  │ 分享您的消费体验...      │  │
│  │                          │  │
│  │                  0/1000  │  │
│  └──────────────────────────┘  │
│                                │
│  📷 添加图片 (最多 5 张)         │
│  ┌────┐ ┌────┐ ┌────┐         │
│  │ +  │ │img1│ │img2│         │
│  └────┘ └────┘ └────┘         │
│                                │
│     [取消]      [提交点评]      │
└────────────────────────────────┘
```

---

### ReviewCard - 点评卡片组件

```tsx
interface ReviewCardProps {
  review: ReviewWithUser;   // 点评对象 (含用户信息)
  showActions?: boolean;    // 显示点赞/举报按钮
  onHelpful?: (id: string) => void;
  onReport?: (id: string) => void;
}

interface ReviewWithUser {
  id: string;
  content: string;
  rating: number;
  images: string[];
  helpfulCount: number;
  reportCount: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    isVerified?: boolean;  // 实名认证标识
  };
  status?: 'pending' | 'approved' | 'rejected' | 'hidden'; // 仅管理员可见
}
```

**卡片内容:**
```
┌─────────────────────────────────────────┐
│  👤 用户名          ⭐⭐⭐⭐⭐  5.0      │
│     实名认证 ✓                          │
│  📅 2026-03-20                          │
├─────────────────────────────────────────┤
│  很好吃的餐厅，环境不错，服务态度好...   │
│                                         │
│  ┌─────┐ ┌─────┐ ┌─────┐               │
│  │ img │ │ img │ │ img │  (图片预览)   │
│  └─────┘ └─────┘ └─────┘               │
├─────────────────────────────────────────┤
│  👍 12   🚩 举报                         │
└─────────────────────────────────────────┘
```

**交互:**
- 点赞：切换状态，不能重复点赞
- 举报：弹窗选择原因 (虚假广告/恶意诋毁/其他)
- 图片：点击放大预览

---

### ReviewList - 点评列表组件

```tsx
interface ReviewListProps {
  merchantId?: string;      // 按商家筛选
  userId?: string;          // 按用户筛选
  sortBy?: 'newest' | 'highest' | 'lowest' | 'helpful';
  pageSize?: number;        // 默认 20
}
```

**功能:**
1. **分页加载:**
   - 滚动到底部自动加载下一页
   - 显示加载状态
   - 无更多数据提示

2. **排序:**
   ```tsx
   type SortOption = {
     value: 'newest' | 'highest' | 'lowest' | 'helpful';
     label: string;
   }[];
   // [
   //   { value: 'newest', label: '最新发布' },
   //   { value: 'highest', label: '评分最高' },
   //   { value: 'lowest', label: '评分最低' },
   //   { value: 'helpful', label: '最有帮助' }
   // ]
   ```

3. **空状态:**
   ```tsx
   // 无点评时
   <div className="text-center py-12">
     <div className="text-6xl mb-4">📝</div>
     <p className="text-gray-500">暂无点评</p>
     <p className="text-gray-400 text-sm">成为第一个发表评论的人!</p>
   </div>
   ```

---

### ReviewFilter - 点评过滤器组件

```tsx
interface ReviewFilterProps {
  currentFilter: RatingFilter;
  onFilterChange: (filter: RatingFilter) => void;
}

type RatingFilter = 'all' | 5 | 4 | 3 | 2 | 1;
```

**UI 设计:**
```
筛选：[全部] [⭐⭐⭐⭐⭐] [⭐⭐⭐⭐] [⭐⭐⭐] [⭐⭐] [⭐]
```

**使用场景:**
- 商家详情页点评列表顶部
- 快速筛选特定评分的点评

---

## 页面集成

### A-06: 商家详情页集成

**文件:** `src/app/merchants/[id]/page.tsx`

**页面结构:**
```tsx
┌──────────────────────────────────────┐
│  商家基本信息 (已有)                  │
│  🏪 店名  ⭐4.5  📍地址  📞电话      │
├──────────────────────────────────────┤
│  📊 评分概览                          │
│  ⭐⭐⭐⭐⭐  4.5 (128 条评价)           │
│  5⭐ ████████░░ 65%                  │
│  4⭐ ████░░░░░░ 20%                  │
│  3⭐ ██░░░░░░░░ 10%                  │
│  2⭐ ░░░░░░░░░░ 3%                   │
│  1⭐ ░░░░░░░░░░ 2%                   │
├──────────────────────────────────────┤
│  ✍️ 发表点评 (ReviewForm)            │
├──────────────────────────────────────┤
│  📝 用户点评 (ReviewList)            │
│  筛选：[ReviewFilter]                │
│  排序：[最新发布 ▼]                  │
│  ┌────────────────────────────────┐  │
│  │ [ReviewCard]                   │  │
│  │ [ReviewCard]                   │  │
│  │ ...                            │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

---

### A-07: 个人主页 - 我的点评

**文件:** `src/app/profile/reviews/page.tsx`

**页面功能:**
- 显示用户发布的所有点评
- 支持编辑/删除自己的点评
- 显示点评状态 (待审核/已通过/已拒绝)

**页面结构:**
```tsx
┌──────────────────────────────────────┐
│  我的点评 (12)                        │
├──────────────────────────────────────┤
│  [Tab: 全部 | 待审核 | 已通过 | 已拒绝] │
├──────────────────────────────────────┤
│  ┌────────────────────────────────┐  │
│  │ 🏪 商家名称                     │  │
│  │ ⭐⭐⭐⭐⭐  5.0                   │  │
│  │ 状态：✅ 已通过                 │  │
│  │ 内容：很好吃的餐厅...           │  │
│  │            [编辑] [删除]        │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

---

## 验收标准

### 功能验收
- [ ] 所有组件支持响应式 (Mobile First)
- [ ] 表单验证完整 (字数限制、必填项)
- [ ] 图片上传支持预览和删除
- [ ] 空状态/加载状态/错误状态处理完善
- [ ] 分页加载正常工作

### 无障碍验收
- [ ] 所有图标按钮有 aria-label
- [ ] 评分组件支持键盘操作
- [ ] 表单字段有对应 label
- [ ] 错误提示与字段关联
- [ ] 焦点状态可见

### 性能验收
- [ ] 图片懒加载
- [ ] 列表虚拟滚动 (超过 50 条)
- [ ] 组件按需渲染
- [ ] 无内存泄漏

### UI/UX 验收
- [ ] 遵循 UI/UX Pro Max 设计规范
- [ ] 使用 SVG 图标 (无 emoji)
- [ ] 渐变背景和阴影效果
- [ ] 平滑过渡动画 (150-300ms)
- [ ] 触摸目标 ≥ 44x44px

---

## 依赖关系

### 需要 Agent B 提供
- API 接口文档 (请求/响应格式)
- 错误码定义
- 图片上传接口

### 需要 Agent C 协调
- 管理员视图的组件复用
- 批量操作的 UI 交互

### 需要 Agent D 配合
- 提供测试用例
- 可访问性测试反馈

---

## 开发提示

1. **组件复用:** 优先使用 shadcn/ui 组件库
2. **图标:** 统一使用 Lucide React
3. **样式:** Tailwind CSS，遵循现有设计系统
4. **状态管理:** 使用 React Query 处理服务端状态
5. **表单:** 使用 react-hook-form + zod 验证

---

## 开始指令

Agent A 收到任务后，请执行:

```bash
# 1. 创建组件目录
mkdir -p src/components/reviews
mkdir -p src/app/merchants/[id]
mkdir -p src/app/profile/reviews

# 2. 按优先级顺序开发组件
# P0: StarRating → ReviewForm → ReviewCard → ReviewList
# P1: ReviewFilter → 页面集成
```

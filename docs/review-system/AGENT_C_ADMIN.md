# Agent C - 审核后台开发

## 任务范围

负责管理员审核后台的所有页面和功能开发，包括审核列表、举报处理、数据统计、批量操作等。

---

## 任务清单

| ID | 任务 | 文件路径 | 状态 | 优先级 |
|----|------|---------|------|--------|
| C-01 | 审核首页 (数据概览) | `src/app/admin/reviews/page.tsx` | ⏳ | P0 |
| C-02 | 审核列表页 | `src/app/admin/reviews/list/page.tsx` | ⏳ | P0 |
| C-03 | 点评审核弹窗/页面 | `src/app/admin/reviews/[id]/audit/page.tsx` | ⏳ | P0 |
| C-04 | 批量操作 API | `src/app/api/admin/reviews/bulk/route.ts` | ⏳ | P1 |
| C-05 | 举报列表页 | `src/app/admin/reports/page.tsx` | ⏳ | P1 |
| C-06 | 举报处理 API | `src/app/api/admin/reports/[id]/route.ts` | ⏳ | P1 |
| C-07 | 统计面板组件 | `src/components/admin/ReviewStats.tsx` | ⏳ | P0 |
| C-08 | 审核日志页面 | `src/app/admin/reviews/logs/page.tsx` | ⏳ | P2 |

---

## 权限要求

**所有管理后台页面需要:**
1. 用户已登录
2. 用户角色为 `admin`

**权限验证 HOC:**
```typescript
// src/lib/admin-auth.ts
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (session.user.role !== 'admin') {
    redirect('/');
  }

  return session;
}
```

---

## 页面实现

### C-01: 审核首页 (数据概览)

**文件:** `src/app/admin/reviews/page.tsx`

**页面结构:**
```tsx
┌─────────────────────────────────────────────────────┐
│  点评审核管理系统                     [返回列表]     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ 待审核  │ │ 已通过  │ │ 已拒绝  │ │ 已举报  │   │
│  │   24    │ │  1,234  │ │   56    │ │   12    │   │
│  │ ↑12%    │ │ ↑5%     │ │ ↓3%     │ │ ↓8%     │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  本周审核趋势图                              │   │
│  │  ███  ██  █████  ████  ██  █████  ███       │   │
│  │  一   二   三    四   五   六    日          │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────┐ ┌──────────────────┐         │
│  │  待处理举报       │ │  商家评分排行     │         │
│  │  🚩 12           │ │  1. 餐厅 A ⭐4.9 │         │
│  │  ⚠️ 3 紧急        │ │  2. 咖啡厅 B ⭐4.8│         │
│  │  [处理]          │ │  3. 书店 C ⭐4.7  │         │
│  └──────────────────┘ └──────────────────┘         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**核心组件:**
```typescript
// 数据卡片
interface StatCardProps {
  title: string;
  value: number;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  icon: React.ReactNode;
  href?: string;
}

// 趋势图表 (使用 Recharts)
interface TrendChartProps {
  data: Array<{
    date: string;
    approved: number;
    rejected: number;
    pending: number;
  }>;
}
```

**API 调用:**
```typescript
// 获取统计数据
async function getReviewStats() {
  const response = await fetch('/api/admin/reviews/stats', {
    cache: 'no-store',
  });
  const data = await response.json();
  return data;
}
```

---

### C-02: 审核列表页

**文件:** `src/app/admin/reviews/list/page.tsx`

**页面结构:**
```tsx
┌─────────────────────────────────────────────────────┐
│  审核列表                              [批量操作 ▼] │
├─────────────────────────────────────────────────────┤
│  筛选：                                             │
│  状态：[全部 ▼]  时间：[最近 7 天 ▼]  商家：[搜索...]  │
│  排序：[提交时间 ▼]                                 │
├─────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────┐  │
│  │ ☐ │ 用户 │ 商家 │ 评分 │ 内容摘要 │ 状态 │ 操作 │  │
│  │───┼──────┼──────┼──────┼──────────┼──────┼──────│  │
│  │ ☐ │ 张三 │ 餐厅 A│⭐⭐⭐⭐⭐│ 很好吃... │ 待审 │ [审] │  │
│  │ ☐ │ 李四 │ 咖啡厅│⭐⭐⭐⭐  │ 环境不错...│ 待审 │ [审] │  │
│  │ ☐ │ 王五 │ 书店 │⭐⭐⭐   │ 一般般... │ 已举 │ [审] │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  显示 1-20 条，共 124 条  [<] [1] [2] [3] [...] [>]   │
└─────────────────────────────────────────────────────┘
```

**筛选条件:**
```typescript
interface ReviewFilter {
  status?: ('pending' | 'approved' | 'rejected' | 'hidden')[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  merchantId?: string;
  minRating?: number;
  maxRating?: number;
  hasReports?: boolean;
  sortBy?: 'createdAt' | 'rating' | 'reportCount';
  sortOrder?: 'asc' | 'desc';
}
```

**批量操作:**
```typescript
interface BulkAction {
  action: 'approve' | 'reject' | 'hide' | 'delete';
  reviewIds: string[];
  reason?: string; // 拒绝时需要
}
```

**组件实现:**
```typescript
'use client';

export default function ReviewListPage() {
  const [filters, setFilters] = useState<ReviewFilter>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  // 加载点评列表
  useEffect(() => {
    fetchReviews(filters);
  }, [filters]);

  // 批量操作
  const handleBulkAction = async (action: BulkAction['action']) => {
    if (selectedIds.length === 0) return;

    const response = await fetch('/api/admin/reviews/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        reviewIds: selectedIds,
      }),
    });

    if (response.ok) {
      toast.success(`批量${getActionName(action)}成功`);
      setSelectedIds([]);
      fetchReviews(filters);
    }
  };

  return (
    <div className="p-6">
      {/* 筛选器 */}
      <ReviewFilterBar filters={filters} onFilterChange={setFilters} />

      {/* 批量操作工具栏 */}
      {selectedIds.length > 0 && (
        <BulkActionBar
          count={selectedIds.length}
          onAction={handleBulkAction}
          onCancel={() => setSelectedIds([])}
        />
      )}

      {/* 点评表格 */}
      <ReviewTable
        reviews={reviews}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onAudit={(id) => router.push(`/admin/reviews/${id}/audit`)}
      />

      {/* 分页 */}
      <Pagination ... />
    </div>
  );
}
```

---

### C-03: 点评审核页面

**文件:** `src/app/admin/reviews/[id]/audit/page.tsx`

**页面结构:**
```tsx
┌─────────────────────────────────────────────────────┐
│  审核点评                           [关闭 ✕]        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  点评信息                                      │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │  👤 张三 (实名认证 ✓)                    │  │  │
│  │  │  📅 2026-03-20 14:30                    │  │  │
│  │  │  ⭐⭐⭐⭐⭐  5.0                           │  │  │
│  │  │  🏪 餐厅 A (查看商家)                    │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  │                                               │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │  点评内容:                               │  │  │
│  │  │  很好吃的餐厅，环境不错，服务态度好...    │  │  │
│  │  │                                         │  │  │
│  │  │  📷 [图片 1] [图片 2] [图片 3]          │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  │                                               │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │  举报信息 (2 次)                          │  │  │
│  │  │  🚩 举报原因：虚假广告                   │  │  │
│  │  │  🚩 举报原因：其他                       │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  │                                               │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │  审核历史                                │  │  │
│  │  │  2026-03-20 管理员 A 标记为待审核         │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  审核操作                                      │  │
│  │                                               │  │
│  │  ○ 通过  ○ 拒绝  ○ 隐藏  ○ 删除              │  │
│  │                                               │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │  理由 (拒绝时必填):                      │  │  │
│  │  │  ┌───────────────────────────────────┐  │  │  │
│  │  │  │                                   │  │  │  │
│  │  │  └───────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  │                                               │  │
│  │              [取消]    [提交审核]              │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**审核操作 API:**
```typescript
// src/app/api/admin/reviews/[id]/audit/route.ts

interface AuditAction {
  action: 'approve' | 'reject' | 'hide' | 'delete';
  reason?: string;
}

async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  const { id } = await params;
  const { action, reason } = await request.json();

  // 验证
  if (action === 'reject' && !reason) {
    return json({ success: false, error: '拒绝需要填写理由' }, { status: 400 });
  }

  // 执行审核操作
  const review = await db.review.update({
    where: { id },
    data: {
      status: getActionStatus(action), // approve -> 'approved', etc.
    },
  });

  // 记录审核日志
  await db.reviewAuditLog.create({
    data: {
      reviewId: id,
      adminId: session.user.id,
      action,
      reason,
    },
  });

  // TODO: 如果是拒绝，发送通知给用户

  return json({ success: true, data: review });
}
```

---

### C-04: 批量操作 API

**文件:** `src/app/api/admin/reviews/bulk/route.ts`

```typescript
import { requireAdmin } from '@/lib/admin-auth';

interface BulkActionRequest {
  action: 'approve' | 'reject' | 'hide' | 'delete';
  reviewIds: string[];
  reason?: string;
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  const { action, reviewIds, reason } = await request.json();

  // 验证
  if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
    return json({ success: false, error: '请选择点评' }, { status: 400 });
  }

  if (action === 'reject' && !reason) {
    return json({ success: false, error: '拒绝需要填写理由' }, { status: 400 });
  }

  try {
    await db.$transaction(async (tx) => {
      const statusMap = {
        approve: 'approved',
        reject: 'rejected',
        hide: 'hidden',
        delete: null, // 特殊处理
      };

      for (const id of reviewIds) {
        if (action === 'delete') {
          await tx.review.delete({ where: { id } });
        } else {
          await tx.review.update({
            where: { id },
            data: { status: statusMap[action as keyof typeof statusMap] },
          });

          // 记录审核日志
          await tx.reviewAuditLog.create({
            data: {
              reviewId: id,
              adminId: session.user.id,
              action,
              reason,
            },
          });
        }
      }
    });

    return json({
      success: true,
      data: { processed: reviewIds.length },
    });

  } catch (error) {
    console.error('批量操作失败:', error);
    return json({
      success: false,
      error: '批量操作失败'
    }, { status: 500 });
  }
}
```

---

### C-05: 举报列表页

**文件:** `src/app/admin/reports/page.tsx`

**页面结构:**
```tsx
┌─────────────────────────────────────────────────────┐
│  举报处理                                            │
├─────────────────────────────────────────────────────┤
│  筛选：                                             │
│  状态：[全部 ▼]  类型：[全部 ▼]  时间：[最近 7 天 ▼]  │
├─────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────┐  │
│  │ 举报 ID │ 被举报点评 │ 举报原因 │ 举报数 │ 状态 │ 操作 │  │
│  │────────┼────────────┼──────────┼────────┼──────┼──────│  │
│  │ #1234  │ 餐厅 A 评价  │ 虚假广告  │   5    │ 待处理│[处理]│  │
│  │ #1233  │ 咖啡厅评价  │ 恶意诋毁  │   3    │ 已解决│[查看]│  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**API:** `GET /api/admin/reports`

---

### C-06: 举报处理 API

**文件:** `src/app/api/admin/reports/[id]/route.ts`

```typescript
interface ReportAction {
  action: 'ignore' | 'hide_review' | 'delete_review' | 'ban_user';
  reason?: string;
}

async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  const { id } = await params;
  const { action, reason } = await request.json();

  const report = await db.reviewReport.findUnique({
    where: { id },
    include: { review: true },
  });

  if (!report) {
    return json({ success: false, error: '举报不存在' }, { status: 404 });
  }

  await db.$transaction(async (tx) => {
    // 更新举报状态
    await tx.reviewReport.update({
      where: { id },
      data: { status: 'resolved' },
    });

    // 执行处理操作
    if (action === 'hide_review') {
      await tx.review.update({
        where: { id: report.reviewId },
        data: { status: 'hidden' },
      });
    } else if (action === 'delete_review') {
      await tx.review.delete({ where: { id: report.reviewId } });
    } else if (action === 'ban_user') {
      await tx.user.update({
        where: { id: report.userId },
        data: { status: 'banned' },
      });
    }
  });

  return json({ success: true });
}
```

---

### C-07: 统计面板组件

**文件:** `src/components/admin/ReviewStats.tsx`

```typescript
'use client';

import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface ReviewStatsProps {
  stats: {
    totalReviews: number;
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    hiddenCount: number;
    averageRating: number;
    approvalRate: number;
  };
  trendData: Array<{
    date: string;
    approved: number;
    rejected: number;
    pending: number;
  }>;
  merchantRanking: Array<{
    merchantId: string;
    merchantName: string;
    averageRating: number;
    reviewCount: number;
  }>;
}

export function ReviewStats({ stats, trendData, merchantRanking }: ReviewStatsProps) {
  return (
    <div className="grid gap-6">
      {/* 概览卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="待审核"
          value={stats.pendingCount}
          trend="+12%"
          icon={<IconPending />}
          href="/admin/reviews/list?status=pending"
        />
        <StatCard
          title="已通过"
          value={stats.approvedCount}
          trend="+5%"
          icon={<IconApproved />}
        />
        <StatCard
          title="已拒绝"
          value={stats.rejectedCount}
          trend="-3%"
          icon={<IconRejected />}
        />
        <StatCard
          title="举报处理"
          value={stats.hiddenCount}
          trend="-8%"
          icon={<IconReports />}
          href="/admin/reports"
        />
      </div>

      {/* 趋势图 */}
      <Card>
        <CardHeader>
          <CardTitle>本周审核趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart data={trendData} width={800} height={300}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="approved" stroke="#22c55e" name="通过" />
            <Line type="monotone" dataKey="rejected" stroke="#ef4444" name="拒绝" />
            <Line type="monotone" dataKey="pending" stroke="#f59e0b" name="待审核" />
          </LineChart>
        </CardContent>
      </Card>

      {/* 商家排行 */}
      <Card>
        <CardHeader>
          <CardTitle>商家评分排行</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {merchantRanking.slice(0, 10).map((merchant, i) => (
              <div key={merchant.merchantId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center font-bold text-gray-400">{i + 1}</span>
                  <span>{merchant.merchantName}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-yellow-500">
                    {'⭐'.repeat(Math.round(merchant.averageRating))}
                  </span>
                  <span className="text-gray-500">{merchant.averageRating.toFixed(1)}</span>
                  <span className="text-gray-400 text-sm">({merchant.reviewCount}条)</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### C-08: 审核日志页面

**文件:** `src/app/admin/reviews/logs/page.tsx`

**页面结构:**
```tsx
┌─────────────────────────────────────────────────────┐
│  审核日志                                            │
├─────────────────────────────────────────────────────┤
│  筛选：                                             │
│  管理员：[全部 ▼]  操作：[全部 ▼]  时间：[最近 30 天 ▼] │
├─────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────┐  │
│  │ 时间 │ 管理员 │ 操作 │ 点评 │ 理由 │ IP       │  │
│  │──────┼────────┼──────┼──────┼──────┼─────────│  │
│  │ 03-20│ 管理员 A│ 通过 │#1234 │ -    │192.168.1│  │
│  │ 03-20│ 管理员 B│ 拒绝 │#1233 │ 违规 │192.168.2│  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 统计数据 API

**文件:** `src/app/api/admin/reviews/stats/route.ts`

```typescript
import { requireAdmin } from '@/lib/admin-auth';

export async function GET() {
  await requireAdmin();

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 并行查询所有统计数据
  const [
    totalReviews,
    pendingCount,
    approvedCount,
    rejectedCount,
    hiddenCount,
    reportCount,
    trendData,
    merchantRanking,
  ] = await Promise.all([
    db.review.count(),
    db.review.count({ where: { status: 'pending' } }),
    db.review.count({ where: { status: 'approved' } }),
    db.review.count({ where: { status: 'rejected' } }),
    db.review.count({ where: { status: 'hidden' } }),
    db.reviewReport.count({ where: { status: 'pending' } }),

    // 趋势数据
    db.review.groupBy({
      by: ['status', 'createdAt'],
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
    }),

    // 商家排行
    db.review.groupBy({
      by: ['merchantId'],
      _avg: { rating: true },
      _count: true,
      where: { status: 'approved' },
      orderBy: { _avg: { rating: 'desc' } },
      take: 10,
    }),
  ]);

  // 计算通过率
  const approvalRate = totalReviews > 0
    ? (approvedCount / totalReviews) * 100
    : 0;

  // 计算平均评分
  const avgRatingResult = await db.review.aggregate({
    _avg: { rating: true },
    where: { status: 'approved' },
  });

  return json({
    success: true,
    data: {
      totalReviews,
      pendingCount,
      approvedCount,
      rejectedCount,
      hiddenCount,
      reportCount,
      averageRating: avgRatingResult._avg.rating || 0,
      approvalRate,
      trendData: processTrendData(trendData),
      merchantRanking: await enrichMerchantRanking(merchantRanking),
    },
  });
}
```

---

## 验收标准

### 功能验收
- [ ] 所有管理页面需要管理员权限
- [ ] 筛选/排序功能正常工作
- [ ] 批量操作正确执行
- [ ] 审核操作记录完整日志
- [ ] 举报处理流程完整

### 性能验收
- [ ] 统计数据加载 < 500ms
- [ ] 列表分页加载流畅
- [ ] 图表渲染性能良好

### 安全验收
- [ ] 管理员权限验证正确
- [ ] 操作日志记录完整
- [ ] 批量操作有数量限制 (最多 100 条)

---

## 依赖关系

### 需要 Agent B 提供
- 统计 API 数据结构
- 批量操作接口
- 审核日志 API

### 需要 Agent A 协调
- 组件复用 (ReviewCard, ReviewList)
- UI 样式一致性

---

## 开发提示

1. **图表库:** 使用 Recharts (项目已安装)
2. **UI 组件:** 优先使用 shadcn/ui
3. **权限:** 所有页面使用 `requireAdmin()` 验证
4. **日志:** 所有审核操作必须记录日志

---

## 开始指令

Agent C 收到任务后，请执行:

```bash
# 1. 创建管理后台目录结构
mkdir -p src/app/admin/reviews
mkdir -p src/app/admin/reports
mkdir -p src/components/admin

# 2. 按优先级开发
# P0: 权限验证 → 统计 API → 审核首页 → 审核列表
# P1: 举报处理 → 批量操作
# P2: 审核日志
```

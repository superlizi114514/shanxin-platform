import { Suspense } from 'react';
import { ReviewStats } from '@/components/admin/ReviewStats';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * 点评审核管理系统 - 首页
 * 显示数据概览、审核趋势、商家排行等
 */
export default async function AdminReviewsHome() {
  // 验证管理员权限
  await requireAdmin();

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">点评审核管理系统</h1>
          <p className="text-gray-500 mt-1">管理用户点评、处理举报、查看统计数据</p>
        </div>
      </div>

      {/* 统计面板 */}
      <Suspense fallback={<StatsSkeleton />}>
        <StatsPanel />
      </Suspense>

      {/* 快捷操作入口 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickActionCard
          title="审核列表"
          description="查看所有待审核、已通过的点评"
          icon="📋"
          href="/admin/reviews/list"
          color="from-blue-500 to-blue-600"
        />
        <QuickActionCard
          title="举报处理"
          description="处理用户举报的违规点评"
          icon="🚩"
          href="/admin/reports"
          color="from-red-500 to-red-600"
        />
        <QuickActionCard
          title="审核日志"
          description="查看管理员审核操作记录"
          icon="📝"
          href="/admin/reviews/logs"
          color="from-green-500 to-green-600"
        />
      </div>
    </div>
  );
}

async function StatsPanel() {
  try {
    await requireAdmin();

    // 直接调用数据库获取统计数据
    const stats = await getReviewStats();

    return (
      <ReviewStats
        stats={stats}
        onNavigate={(path) => {
          // 客户端导航由父组件处理
        }}
      />
    );
  } catch (error) {
    console.error('加载统计数据失败:', error);
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-700">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-medium">加载统计数据失败</p>
              <p className="text-sm text-red-600 mt-1">
                {error instanceof Error ? error.message : '请稍后重试'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
}

async function getReviewStats() {
  const { prisma } = await import('@/lib/prisma');

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalReviews,
    pendingCount,
    approvedCount,
    rejectedCount,
    hiddenCount,
    averageRatingResult,
  ] = await Promise.all([
    prisma.review.count(),
    prisma.review.count({ where: { status: 'pending' } }),
    prisma.review.count({ where: { status: 'approved' } }),
    prisma.review.count({ where: { status: 'rejected' } }),
    prisma.review.count({ where: { status: 'hidden' } }),
    prisma.review.aggregate({
      _avg: { rating: true },
      where: { status: 'approved' },
    }),
  ]);

  const approvalRate = totalReviews > 0
    ? (approvedCount / totalReviews) * 100
    : 0;

  // 获取趋势数据
  const trendDataRaw = await prisma.review.groupBy({
    by: ['status', 'createdAt'],
    where: {
      createdAt: { gte: sevenDaysAgo },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  const trendDataMap = new Map<string, { approved: number; rejected: number; pending: number }>();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = date.toISOString().split('T')[0];
    trendDataMap.set(dateKey, { approved: 0, rejected: 0, pending: 0 });
  }

  trendDataRaw.forEach((item) => {
    const dateKey = item.createdAt.toISOString().split('T')[0];
    const existing = trendDataMap.get(dateKey) || { approved: 0, rejected: 0, pending: 0 };
    if (item.status === 'approved') existing.approved++;
    else if (item.status === 'rejected') existing.rejected++;
    else if (item.status === 'pending') existing.pending++;
    trendDataMap.set(dateKey, existing);
  });

  const trendData = Array.from(trendDataMap.entries()).map(([date, counts]) => ({
    date,
    ...counts,
  }));

  // 获取商家排行
  const merchantRankingRaw = await prisma.merchantReview.groupBy({
    by: ['merchantId'],
    _avg: { rating: true },
    _count: true,
    orderBy: {
      _avg: { rating: 'desc' },
    },
    take: 10,
  });

  const merchantRanking = await Promise.all(
    merchantRankingRaw.map(async (item) => {
      const merchant = await prisma.merchant.findUnique({
        where: { id: item.merchantId },
        select: { name: true },
      });
      return {
        merchantId: item.merchantId,
        merchantName: merchant?.name || '未知商家',
        averageRating: item._avg.rating || 0,
        reviewCount: item._count,
      };
    })
  );

  // 获取待处理举报
  const pendingReports = await prisma.reviewReport.findMany({
    where: { status: 'pending' },
    include: {
      review: {
        select: {
          id: true,
          content: true,
          rating: true,
        },
      },
    },
    take: 10,
    orderBy: { createdAt: 'desc' },
  });

  return {
    totalReviews,
    pendingCount,
    approvedCount,
    rejectedCount,
    hiddenCount,
    reportCount: pendingReports.length,
    averageRating: averageRatingResult._avg.rating || 0,
    approvalRate: Math.round(approvalRate * 100) / 100,
    trendData,
    merchantRanking,
    pendingReports: pendingReports.map((report) => ({
      id: report.id,
      reviewId: report.reviewId,
      reason: report.reason,
      reviewContent: report.review.content,
      reviewRating: report.review.rating,
      createdAt: report.createdAt.toISOString(),
    })),
  };
}

function StatsSkeleton() {
  return (
    <div className="grid gap-6">
      {/* 卡片骨架屏 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-16 bg-gray-200 rounded mt-2 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 图表骨架屏 */}
      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full bg-gray-100 rounded animate-pulse" />
        </CardContent>
      </Card>

      {/* 排行榜骨架屏 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="h-12 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
}

function QuickActionCard({ title, description, icon, href, color }: QuickActionCardProps) {
  return (
    <a href={href} className="block">
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform duration-200`}>
              {icon}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {title}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            </div>
            <span className="text-gray-400 group-hover:translate-x-1 transition-transform">
              →
            </span>
          </div>
        </CardContent>
      </Card>
    </a>
  );
}

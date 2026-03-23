import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

/**
 * 获取点评审核统计数据
 * GET /api/admin/reviews/stats
 */
export async function GET() {
  try {
    await requireAdmin();

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 并行查询所有统计数据
    const [
      totalReviews,
      pendingCount,
      approvedCount,
      rejectedCount,
      hiddenCount,
      reportCount,
      averageRatingResult,
    ] = await Promise.all([
      prisma.review.count(),
      prisma.review.count({ where: { status: 'pending' } }),
      prisma.review.count({ where: { status: 'approved' } }),
      prisma.review.count({ where: { status: 'rejected' } }),
      prisma.review.count({ where: { status: 'hidden' } }),
      prisma.reviewReport.count({ where: { status: 'pending' } }),
      prisma.review.aggregate({
        _avg: { rating: true },
        where: { status: 'approved' },
      }),
    ]);

    // 计算通过率
    const approvalRate = totalReviews > 0
      ? (approvedCount / totalReviews) * 100
      : 0;

    // 获取趋势数据（近 7 日）
    const trendDataRaw = await prisma.review.groupBy({
      by: ['status', 'createdAt'],
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // 处理趋势数据
    const trendDataMap = new Map<string, { approved: number; rejected: number; pending: number }>();

    // 初始化 7 天数据
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      trendDataMap.set(dateKey, { approved: 0, rejected: 0, pending: 0 });
    }

    // 填充实际数据
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

    // 获取商家评分排行
    const merchantRankingRaw = await prisma.merchantReview.groupBy({
      by: ['merchantId'],
      _avg: { rating: true },
      _count: true,
      orderBy: {
        _avg: { rating: 'desc' },
      },
      take: 10,
    });

    // 丰富商家信息
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

    return NextResponse.json({
      success: true,
      data: {
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
          createdAt: report.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取统计数据失败',
      },
      { status: 500 }
    );
  }
}

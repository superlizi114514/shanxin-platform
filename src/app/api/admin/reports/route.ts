import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

/**
 * 获取举报列表（管理员）
 * GET /api/admin/reports
 */
export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const reason = searchParams.get('reason');

    const where: Record<string, unknown> = {};

    if (status !== 'all') {
      where.status = status;
    }

    // 获取举报列表
    const reports = await prisma.reviewReport.findMany({
      where,
      include: {
        review: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 格式化数据
    const formattedReports = reports.map((report) => ({
      ...report,
      reviewerName: report.user?.name,
      reviewerEmail: report.user?.email,
      review: report.review
        ? {
            ...report.review,
            images: undefined, // 不返回图片以减小数据量
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        reports: formattedReports,
        total: reports.length,
      },
    });
  } catch (error) {
    console.error('获取举报列表失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取举报列表失败',
      },
      { status: 500 }
    );
  }
}

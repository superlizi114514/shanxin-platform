import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

/**
 * 获取点评列表（管理员）
 * GET /api/admin/reviews
 */
export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const merchant = searchParams.get('merchant');

    const skip = (page - 1) * pageSize;

    // 构建查询条件
    const where: Record<string, unknown> = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (merchant) {
      where.merchant = {
        name: {
          contains: merchant,
        },
      };
    }

    // 构建排序
    const orderBy: Record<string, unknown> = {};
    if (sortBy === 'rating') {
      orderBy.rating = sortOrder;
    } else if (sortBy === 'reportCount') {
      orderBy.reportCount = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // 并行查询数据和总数
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          merchant: {
            select: {
              id: true,
              name: true,
            },
          },
          imagesRel: {
            select: {
              url: true,
            },
          },
        },
      }),
      prisma.review.count({ where }),
    ]);

    // 格式化数据
    const formattedReviews = reviews.map((review) => ({
      ...review,
      images: review.imagesRel.map((img) => img.url),
      imagesRel: undefined,
    }));

    return NextResponse.json({
      success: true,
      data: {
        reviews: formattedReviews,
        total,
        page,
        pageSize,
      },
    });
  } catch (error) {
    console.error('获取点评列表失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取点评列表失败',
      },
      { status: 500 }
    );
  }
}

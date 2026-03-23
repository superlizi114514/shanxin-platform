import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

/**
 * 获取点评详情（管理员）
 * GET /api/admin/reviews/[id]
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        merchant: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
        imagesRel: {
          select: {
            url: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        reports: {
          where: { status: 'pending' },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        auditLogs: {
          include: {
            admin: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: '点评不存在' },
        { status: 404 }
      );
    }

    // 格式化数据
    const formattedReview = {
      ...review,
      images: review.imagesRel.map((img) => img.url),
      pendingReports: review.reports.map((report) => ({
        id: report.id,
        reason: report.reason,
        reporterName: report.user?.name,
        createdAt: report.createdAt,
      })),
      replies: review.replies.map((reply) => ({
        id: reply.id,
        content: reply.content,
        userName: reply.user?.name,
        createdAt: reply.createdAt,
      })),
      auditLogsList: review.auditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        reason: log.reason,
        adminName: log.admin?.name,
        createdAt: log.createdAt,
      })),
      imagesRel: undefined,
      reports: undefined,
      auditLogs: undefined,
    };

    return NextResponse.json({
      success: true,
      data: formattedReview,
    });
  } catch (error) {
    console.error('获取点评详情失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '获取点评详情失败',
      },
      { status: 500 }
    );
  }
}

/**
 * 删除点评（管理员）
 * DELETE /api/admin/reviews/[id]
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    await prisma.review.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error('删除点评失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '删除点评失败',
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

/**
 * 处理举报
 * POST /api/admin/reports/[id]
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { action, reason } = await request.json();

    // 验证操作类型
    const validActions = ['ignore', 'hide_review', 'delete_review', 'ban_user'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: '无效的操作类型' },
        { status: 400 }
      );
    }

    // 获取举报信息
    const report = await prisma.reviewReport.findUnique({
      where: { id },
      include: {
        review: true,
      },
    });

    if (!report) {
      return NextResponse.json(
        { success: false, error: '举报不存在' },
        { status: 404 }
      );
    }

    // 获取管理员会话
    const session = await requireAdmin();

    // 执行处理操作
    await prisma.$transaction(async (tx) => {
      // 更新举报状态
      await tx.reviewReport.update({
        where: { id },
        data: { status: 'resolved' },
      });

      // 根据操作类型执行相应处理
      if (action === 'hide_review' && report.review) {
        // 隐藏点评
        await tx.review.update({
          where: { id: report.reviewId },
          data: { status: 'hidden' },
        });
      } else if (action === 'delete_review') {
        // 删除点评
        await tx.review.delete({
          where: { id: report.reviewId },
        });
      } else if (action === 'ban_user' && report.review) {
        // 封禁用户
        await tx.user.update({
          where: { id: report.review.userId },
          data: { role: 'banned' },
        });
      }

      // 记录处理日志（复用审核日志表）
      await tx.reviewAuditLog.create({
        data: {
          reviewId: report.reviewId,
          adminId: session.user.id,
          action: `report_${action}`,
          reason: reason || `举报处理：${report.reason}`,
        },
      });
    });

    return NextResponse.json({
      success: true,
      data: { id, action },
    });
  } catch (error) {
    console.error('处理举报失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '处理举报失败',
      },
      { status: 500 }
    );
  }
}

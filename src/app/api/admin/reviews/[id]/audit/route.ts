import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

/**
 * 审核点评操作
 * POST /api/admin/reviews/[id]/audit
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
    const validActions = ['approve', 'reject', 'hide', 'delete'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: '无效的操作类型' },
        { status: 400 }
      );
    }

    // 验证拒绝时需要理由
    if (action === 'reject' && !reason?.trim()) {
      return NextResponse.json(
        { success: false, error: '拒绝点评需要填写理由' },
        { status: 400 }
      );
    }

    // 检查点评是否存在
    const existingReview = await prisma.review.findUnique({
      where: { id },
    });

    if (!existingReview) {
      return NextResponse.json(
        { success: false, error: '点评不存在' },
        { status: 404 }
      );
    }

    // 状态映射
    const statusMap: Record<string, string> = {
      approve: 'approved',
      reject: 'rejected',
      hide: 'hidden',
    };

    // 执行审核操作
    await prisma.$transaction(async (tx) => {
      if (action === 'delete') {
        // 删除点评
        await tx.review.delete({ where: { id } });
      } else {
        const newStatus = statusMap[action];
        if (newStatus) {
          // 更新点评状态
          await tx.review.update({
            where: { id },
            data: { status: newStatus },
          });
        }
      }

      // 记录审核日志
      const session = await requireAdmin();
      await tx.reviewAuditLog.create({
        data: {
          reviewId: id,
          adminId: session.user.id,
          action,
          reason: reason || undefined,
        },
      });
    });

    return NextResponse.json({
      success: true,
      data: { id, action },
    });
  } catch (error) {
    console.error('审核点评失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '审核点评失败',
      },
      { status: 500 }
    );
  }
}

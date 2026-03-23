import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

/**
 * 批量操作点评
 * POST /api/admin/reviews/bulk
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();

    const { action, reviewIds, reason } = await request.json();

    // 验证输入
    if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '请选择要操作的点评' },
        { status: 400 }
      );
    }

    // 限制批量操作数量
    if (reviewIds.length > 100) {
      return NextResponse.json(
        { success: false, error: '单次最多操作 100 条点评' },
        { status: 400 }
      );
    }

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

    // 获取管理员会话（用于记录日志）
    const session = await requireAdmin();

    // 状态映射
    const statusMap: Record<string, string> = {
      approve: 'approved',
      reject: 'rejected',
      hide: 'hidden',
      delete: 'deleted', // 这个值不会被使用，仅用于类型完整性
    };

    // 执行批量操作
    await prisma.$transaction(async (tx) => {
      for (const id of reviewIds) {
        if (action === 'delete') {
          // 删除点评
          await tx.review.delete({ where: { id } });
        } else {
          // 更新点评状态
          await tx.review.update({
            where: { id },
            data: { status: statusMap[action]! }, // 非空断言，因为 delete 已单独处理
          });

          // 记录审核日志
          await tx.reviewAuditLog.create({
            data: {
              reviewId: id,
              adminId: session.user.id,
              action,
              reason: reason || null,
            },
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        processed: reviewIds.length,
        action,
      },
    });
  } catch (error) {
    console.error('批量操作失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '批量操作失败',
      },
      { status: 500 }
    );
  }
}

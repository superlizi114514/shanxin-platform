import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/part-time-jobs
 * 获取兼职列表（管理员）
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const jobType = searchParams.get("jobType");

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (jobType) {
      where.jobType = jobType;
    }

    const [jobs, total] = await Promise.all([
      prisma.partTimeJob.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              studentId: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          applications: {
            select: {
              id: true,
              status: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
            },
          },
          _count: {
            select: {
              applications: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.partTimeJob.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        jobs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("获取兼职列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取兼职列表失败" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/part-time-jobs/audit
 * 批量审核兼职
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { jobIds, status, rejectReason } = body;

    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      return NextResponse.json(
        { error: "请选择要审核的兼职" },
        { status: 400 }
      );
    }

    if (!status || !["approved", "rejected", "closed"].includes(status)) {
      return NextResponse.json(
        { error: "审核状态不合法" },
        { status: 400 }
      );
    }

    // 批量更新
    await prisma.partTimeJob.updateMany({
      where: {
        id: { in: jobIds },
      },
      data: {
        status,
      },
    });

    // 如果是拒绝，记录拒绝原因（可以添加到日志）
    if (status === "rejected" && rejectReason) {
      // 这里可以添加审核日志功能
      console.log("拒绝原因:", rejectReason);
    }

    return NextResponse.json({
      success: true,
      message: `已${status === "approved" ? "通过" : status === "rejected" ? "拒绝" : "关闭"} ${jobIds.length} 个兼职`,
    });
  } catch (error) {
    console.error("批量审核失败:", error);
    return NextResponse.json(
      { success: false, error: "批量审核失败" },
      { status: 500 }
    );
  }
}

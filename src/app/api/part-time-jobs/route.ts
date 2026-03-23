import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/part-time-jobs
 * 获取兼职列表（支持筛选和分页）
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const jobType = searchParams.get("jobType");
    const status = searchParams.get("status");
    const companyId = searchParams.get("companyId");
    const myJobs = searchParams.get("myJobs") === "true";

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    // 查看自己的兼职需要登录
    if (myJobs) {
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: "请先登录" },
          { status: 401 }
        );
      }
      where.userId = session.user.id;
    } else {
      // 默认只显示已审核的（非管理员）
      where.status = status || "approved";
    }

    // 状态过滤（管理员可以看到所有状态）
    if (status && status !== "all") {
      where.status = status;
    }

    // 类型过滤
    if (jobType) {
      where.jobType = jobType;
    }

    // 公司过滤
    if (companyId) {
      where.companyId = companyId;
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
              avatar: true,
              phone: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
              logo: true,
              address: true,
            },
          },
          images: {
            select: {
              id: true,
              url: true,
              position: true,
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
 * POST /api/part-time-jobs
 * 发布兼职
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      companyId,
      jobType,
      salary,
      location,
      contactInfo,
      images,
      expiresAt,
    } = body;

    // 验证必填字段
    if (!title || !description || !jobType || !salary || !location || !contactInfo) {
      return NextResponse.json(
        { error: "请填写完整信息" },
        { status: 400 }
      );
    }

    // 验证兼职类型
    const validJobTypes = ["长期", "短期", "实习"];
    if (!validJobTypes.includes(jobType)) {
      return NextResponse.json(
        { error: "兼职类型不合法" },
        { status: 400 }
      );
    }

    // 如果提供了 companyId，检查商家是否存在
    if (companyId) {
      const company = await prisma.merchant.findUnique({
        where: { id: companyId },
      });
      if (!company) {
        return NextResponse.json(
          { error: "商家不存在" },
          { status: 400 }
        );
      }
    }

    // 检查标题是否包含敏感词（简单实现）
    const sensitiveWords = ["赌博", "诈骗", "传销", "刷单"];
    for (const word of sensitiveWords) {
      if (title.includes(word) || description.includes(word)) {
        // 包含敏感词，需要人工审核
        const job = await prisma.partTimeJob.create({
          data: {
            title,
            description,
            companyId,
            userId: session.user.id,
            jobType,
            salary,
            location,
            contactInfo,
            status: "pending", // 转人工审核
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            images: images
              ? {
                  create: images.map((url: string, index: number) => ({
                    url,
                    position: index,
                  })),
                }
              : undefined,
          },
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
            company: {
              select: { id: true, name: true },
            },
            images: true,
          },
        });
        return NextResponse.json(job, { status: 201 });
      }
    }

    // 无敏感词，自动通过
    const job = await prisma.partTimeJob.create({
      data: {
        title,
        description,
        companyId,
        userId: session.user.id,
        jobType,
        salary,
        location,
        contactInfo,
        status: "approved", // 自动通过
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        images: images
          ? {
              create: images.map((url: string, index: number) => ({
                url,
                position: index,
              })),
            }
          : undefined,
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
        company: {
          select: { id: true, name: true },
        },
        images: true,
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("发布兼职失败:", error);
    return NextResponse.json(
      { error: "发布兼职失败" },
      { status: 500 }
    );
  }
}

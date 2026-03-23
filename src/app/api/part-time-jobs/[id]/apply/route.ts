import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/part-time-jobs/[id]/apply
 * 申请兼职
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    const { id: jobId } = await params;
    const body = await request.json();
    const { message, resumeUrl } = body;

    // 检查兼职是否存在
    const job = await prisma.partTimeJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json(
        { error: "兼职不存在" },
        { status: 404 }
      );
    }

    // 检查兼职状态
    if (job.status !== "approved") {
      return NextResponse.json(
        { error: "该兼职已关闭或正在审核中" },
        { status: 400 }
      );
    }

    // 检查是否已申请过
    const existingApplication = await prisma.jobApplication.findUnique({
      where: {
        jobId_userId: {
          jobId,
          userId: session.user.id,
        },
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: "您已申请过该职位" },
        { status: 400 }
      );
    }

    // 创建申请
    const application = await prisma.jobApplication.create({
      data: {
        jobId,
        userId: session.user.id,
        message: message || "",
        resumeUrl: resumeUrl || null,
        status: "pending",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            studentId: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            companyId: true,
          },
        },
      },
    });

    // 更新申请计数
    await prisma.partTimeJob.update({
      where: { id: jobId },
      data: { applicationCount: job.applicationCount + 1 },
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error("申请兼职失败:", error);
    return NextResponse.json(
      { error: "申请兼职失败" },
      { status: 500 }
    );
  }
}

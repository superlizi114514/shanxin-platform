import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/part-time-jobs/[id]
 * 获取兼职详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const job = await prisma.partTimeJob.findUnique({
      where: { id },
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
            phone: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
            position: true,
          },
        },
        applications: {
          where: { userId: (await auth())?.user?.id },
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "兼职不存在" },
        { status: 404 }
      );
    }

    // 增加浏览量
    await prisma.partTimeJob.update({
      where: { id },
      data: { views: job.views + 1 },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error("获取兼职详情失败:", error);
    return NextResponse.json(
      { error: "获取兼职详情失败" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/part-time-jobs/[id]
 * 更新兼职
 */
export async function PATCH(
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

    const { id } = await params;
    const body = await request.json();

    // 检查兼职是否存在且属于当前用户
    const existingJob = await prisma.partTimeJob.findUnique({
      where: { id },
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: "兼职不存在" },
        { status: 404 }
      );
    }

    if (existingJob.userId !== session.user.id) {
      return NextResponse.json(
        { error: "无权修改该兼职" },
        { status: 403 }
      );
    }

    // 更新兼职
    const updatedJob = await prisma.partTimeJob.update({
      where: { id },
      data: {
        ...body,
        // 如果修改了关键信息，需要重新审核
        ...(body.title || body.description ? { status: "pending" } : {}),
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

    return NextResponse.json(updatedJob);
  } catch (error) {
    console.error("更新兼职失败:", error);
    return NextResponse.json(
      { error: "更新兼职失败" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/part-time-jobs/[id]
 * 删除兼职
 */
export async function DELETE(
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

    const { id } = await params;

    // 检查兼职是否存在且属于当前用户
    const existingJob = await prisma.partTimeJob.findUnique({
      where: { id },
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: "兼职不存在" },
        { status: 404 }
      );
    }

    if (existingJob.userId !== session.user.id) {
      return NextResponse.json(
        { error: "无权删除该兼职" },
        { status: 403 }
      );
    }

    await prisma.partTimeJob.delete({
      where: { id },
    });

    return NextResponse.json({ message: "兼职已删除" });
  } catch (error) {
    console.error("删除兼职失败:", error);
    return NextResponse.json(
      { error: "删除兼职失败" },
      { status: 500 }
    );
  }
}

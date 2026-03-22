import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";

const prisma = new PrismaClient();

// GET - 获取认领申请详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ claimId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    // 检查是否是管理员
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.role !== "admin") {
      return NextResponse.json(
        { error: "权限不足" },
        { status: 403 }
      );
    }

    const { claimId } = await params;
    const claim = await prisma.merchantClaim.findUnique({
      where: { id: claimId },
      include: {
        merchant: {
          include: {
            school: { select: { id: true, name: true } },
            categories: true,
          },
        },
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    if (!claim) {
      return NextResponse.json(
        { error: "认领申请不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json(claim);
  } catch (error) {
    console.error("Error fetching claim:", error);
    return NextResponse.json(
      { error: "获取认领申请详情失败" },
      { status: 500 }
    );
  }
}

// PATCH - 审核认领申请（批准或拒绝）
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ claimId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    // 检查是否是管理员
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.role !== "admin") {
      return NextResponse.json(
        { error: "权限不足" },
        { status: 403 }
      );
    }

    const { claimId } = await params;
    const body = await request.json();
    const { status, rejectReason } = body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "状态必须是 approved 或 rejected" },
        { status: 400 }
      );
    }

    if (status === "rejected" && !rejectReason) {
      return NextResponse.json(
        { error: "拒绝认领申请需要填写拒绝原因" },
        { status: 400 }
      );
    }

    // 检查认领申请是否存在
    const claim = await prisma.merchantClaim.findUnique({
      where: { id: claimId },
      include: { merchant: true },
    });

    if (!claim) {
      return NextResponse.json(
        { error: "认领申请不存在" },
        { status: 404 }
      );
    }

    if (claim.status !== "pending") {
      return NextResponse.json(
        { error: "该认领申请已处理" },
        { status: 400 }
      );
    }

    // 更新认领申请状态
    const updatedClaim = await prisma.merchantClaim.update({
      where: { id: claimId },
      data: {
        status,
        rejectReason: status === "rejected" ? rejectReason : null,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
      include: {
        merchant: {
          include: {
            school: { select: { id: true, name: true } },
            categories: true,
          },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // 如果批准，更新商家的 claimedBy 和 claimStatus
    if (status === "approved") {
      await prisma.merchant.update({
        where: { id: claim.merchantId },
        data: {
          claimedBy: claim.userId,
          claimStatus: "approved",
        },
      });
    }

    return NextResponse.json(updatedClaim);
  } catch (error) {
    console.error("Error reviewing claim:", error);
    return NextResponse.json(
      { error: "审核认领申请失败" },
      { status: 500 }
    );
  }
}

// DELETE - 删除认领申请
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ claimId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    // 检查是否是管理员
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.role !== "admin") {
      return NextResponse.json(
        { error: "权限不足" },
        { status: 403 }
      );
    }

    const { claimId } = await params;

    await prisma.merchantClaim.delete({
      where: { id: claimId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting claim:", error);
    return NextResponse.json(
      { error: "删除认领申请失败" },
      { status: 500 }
    );
  }
}

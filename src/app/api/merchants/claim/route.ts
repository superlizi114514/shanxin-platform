import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";

const prisma = new PrismaClient();

// POST - 申请认领商家
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
    const { merchantId, reason, proof } = body;

    if (!merchantId || !reason) {
      return NextResponse.json(
        { error: "商家 ID 和申请理由是必填项" },
        { status: 400 }
      );
    }

    // 检查商家是否存在
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: "商家不存在" },
        { status: 404 }
      );
    }

    // 检查是否已经被认领
    if (merchant.claimedBy) {
      return NextResponse.json(
        { error: "该商家已被其他用户认领" },
        { status: 400 }
      );
    }

    // 检查是否已经有待处理的认领申请
    const existingClaim = await prisma.merchantClaim.findFirst({
      where: {
        merchantId,
        userId: session.user.id,
        status: "pending",
      },
    });

    if (existingClaim) {
      return NextResponse.json(
        { error: "您已有待处理的认领申请" },
        { status: 400 }
      );
    }

    // 创建认领申请
    const claim = await prisma.merchantClaim.create({
      data: {
        merchantId,
        userId: session.user.id,
        reason,
        proof: proof || null,
        status: "pending",
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

    return NextResponse.json(claim, { status: 201 });
  } catch (error) {
    console.error("Error creating merchant claim:", error);
    return NextResponse.json(
      { error: "创建认领申请失败" },
      { status: 500 }
    );
  }
}

// GET - 获取用户的认领申请列表
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const merchantId = searchParams.get("merchantId");
    const status = searchParams.get("status");

    const where: {
      userId?: string;
      status?: string;
      merchantId?: string;
    } = {
      userId: session.user.id,
    };

    if (merchantId) {
      where.merchantId = merchantId;
    }
    if (status) {
      where.status = status;
    }

    const claims = await prisma.merchantClaim.findMany({
      where,
      include: {
        merchant: {
          include: {
            school: { select: { id: true, name: true } },
            categories: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ claims });
  } catch (error) {
    console.error("Error fetching merchant claims:", error);
    return NextResponse.json(
      { error: "获取认领申请列表失败" },
      { status: 500 }
    );
  }
}

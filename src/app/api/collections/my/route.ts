import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";

const prisma = new PrismaClient();

// GET /api/collections/my - 获取当前用户的收藏列表
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "请先登录后再查看收藏" },
        { status: 401 }
      );
    }

    const collections = await prisma.collection.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          include: {
            owner: {
              select: { id: true, name: true, email: true, avatar: true },
            },
            images: {
              select: { id: true, url: true },
            },
            seller: {
              select: { id: true, name: true, logo: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      collections: collections.map((c) => ({
        ...c,
        product: c.product,
      })),
    });
  } catch (error) {
    console.error("Error fetching user collections:", error);
    return NextResponse.json(
      { error: "获取收藏失败" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

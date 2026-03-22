import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";

const prisma = new PrismaClient();

// GET - 获取收藏详情（检查是否已收藏）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "请先登录", isCollected: false },
        { status: 401 }
      );
    }

    const { id: productId } = await params;

    const collection = await prisma.collection.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
    });

    return NextResponse.json({
      isCollected: !!collection,
      collection,
    });
  } catch (error) {
    console.error("Error checking collection:", error);
    return NextResponse.json(
      { error: "查询收藏状态失败", isCollected: false },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - 切换收藏状态（如果已收藏则取消，未收藏则添加）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "请先登录", isCollected: false },
        { status: 401 }
      );
    }

    const { id: productId } = await params;
    const body = await request.json();
    const { note } = body || {};

    // 检查商品是否存在
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: "商品不存在", isCollected: false },
        { status: 404 }
      );
    }

    // 检查是否已经收藏
    const existingCollection = await prisma.collection.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
    });

    if (existingCollection) {
      // 已收藏 - 支持更新备注
      if (note !== undefined) {
        const updatedCollection = await prisma.collection.update({
          where: { id: existingCollection.id },
          data: { note },
        });

        return NextResponse.json({
          message: "已更新备注",
          isCollected: true,
          collection: updatedCollection,
        });
      }

      return NextResponse.json({
        message: "已收藏",
        isCollected: true,
        collection: existingCollection,
      });
    } else {
      // 未收藏 - 添加收藏并增加收藏数量
      const [collection] = await prisma.$transaction([
        prisma.collection.create({
          data: {
            userId: session.user.id,
            productId,
            note: note || null,
          },
        }),
        prisma.product.update({
          where: { id: productId },
          data: {
            collectionCount: { increment: 1 },
          },
        }),
      ]);

      return NextResponse.json({
        message: "已添加收藏",
        isCollected: true,
        collection,
      });
    }
  } catch (error) {
    console.error("Error toggling collection:", error);
    return NextResponse.json(
      { error: "操作失败", isCollected: false },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - 删除收藏
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

    const { id: productId } = await params;

    const collection = await prisma.collection.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
    });

    if (!collection) {
      return NextResponse.json(
        { error: "未找到该收藏" },
        { status: 404 }
      );
    }

    // 删除收藏并减少收藏数量
    await prisma.$transaction([
      prisma.collection.delete({
        where: { id: collection.id },
      }),
      prisma.product.update({
        where: { id: productId },
        data: {
          collectionCount: { decrement: 1 },
        },
      }),
    ]);

    return NextResponse.json({
      message: "已取消收藏",
    });
  } catch (error) {
    console.error("Error deleting collection:", error);
    return NextResponse.json(
      { error: "取消收藏失败" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

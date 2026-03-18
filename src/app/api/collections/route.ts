import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";

const prisma = new PrismaClient();

// GET - 获取用户的收藏列表
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "请先登录后再查看收藏" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const skip = (page - 1) * limit;

    const collections = await prisma.collection.findMany({
      where: { userId: session.user.id },
      skip,
      take: limit,
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

    const total = await prisma.collection.count({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      collections: collections.map((c) => ({
        ...c,
        product: c.product,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching collections:", error);
    return NextResponse.json(
      { error: "获取收藏失败" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - 添加收藏
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "请先登录后再收藏" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "商品 ID 不能为空" },
        { status: 400 }
      );
    }

    // 检查商品是否存在
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: "商品不存在" },
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
      return NextResponse.json(
        { error: "已经收藏过该商品" },
        { status: 400 }
      );
    }

    // 创建收藏
    const collection = await prisma.collection.create({
      data: {
        userId: session.user.id,
        productId,
      },
      include: {
        product: {
          include: {
            owner: {
              select: { id: true, name: true, email: true, avatar: true },
            },
            images: {
              select: { id: true, url: true },
            },
          },
        },
      },
    });

    return NextResponse.json(collection, { status: 201 });
  } catch (error) {
    console.error("Error adding collection:", error);
    return NextResponse.json(
      { error: "添加收藏失败" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

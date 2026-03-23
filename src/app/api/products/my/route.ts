import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";

const prisma = new PrismaClient();

// GET /api/products/my - 获取当前用户的商品列表
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    const where: {
      sellerId: string;
      status?: string;
    } = {
      sellerId: session.user.id,
    };

    if (status) {
      where.status = status;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        images: {
          select: { id: true, url: true },
        },
        _count: {
          select: {
            collections: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      products: products.map((p) => ({
        ...p,
        collections: p._count.collections,
        _count: undefined,
      })),
    });
  } catch (error) {
    console.error("Error fetching user products:", error);
    return NextResponse.json(
      { error: "Failed to fetch your products" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

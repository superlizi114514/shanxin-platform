import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";

const prisma = new PrismaClient();

// GET - 获取订单列表
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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const role = searchParams.get("role"); // buyer | seller
    const status = searchParams.get("status");

    const skip = (page - 1) * limit;

    const where: {
      buyerId?: string;
      sellerId?: string;
      status?: string;
      OR?: Array<{ buyerId: string } | { sellerId: string }>;
    } = {};

    // 根据角色筛选订单
    if (role === "buyer") {
      where.buyerId = session.user.id;
    } else if (role === "seller") {
      where.sellerId = session.user.id;
    } else {
      // 默认获取买家和卖家的所有订单
      where.OR = [
        { buyerId: session.user.id },
        { sellerId: session.user.id },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          buyer: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          seller: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          items: {
            include: {
              product: {
                include: {
                  images: {
                    select: { id: true, url: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - 创建订单
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sellerId, items, remark } = body;

    if (!sellerId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Seller ID and items are required" },
        { status: 400 }
      );
    }

    // 验证商品并计算总价
    interface OrderItem {
      productId: string;
      quantity?: number;
    }

    const productIds = items.map((item: OrderItem) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      include: {
        images: {
          select: { id: true, url: true },
        },
      },
    });

    if (products.length !== items.length) {
      return NextResponse.json(
        { error: "Some products not found" },
        { status: 400 }
      );
    }

    // 检查商品状态和所有权
    for (const product of products) {
      if (product.status !== "available") {
        return NextResponse.json(
          { error: `Product "${product.title}" is no longer available` },
          { status: 400 }
        );
      }
      if (product.sellerId !== sellerId) {
        return NextResponse.json(
          { error: `Product "${product.title}" does not belong to the specified seller` },
          { status: 400 }
        );
      }
    }

    // 计算总价
    const totalAmount = items.reduce((sum: number, item: OrderItem) => {
      const product = products.find((p) => p.id === item.productId);
      return sum + product!.price * (item.quantity || 1);
    }, 0);

    // 生成订单号
    const orderNo = `ORD${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // 创建订单
    const order = await prisma.order.create({
      data: {
        orderNo,
        buyerId: session.user.id,
        sellerId,
        totalAmount,
        remark: remark || null,
        items: {
          create: items.map((item: OrderItem) => {
            const product = products.find((p) => p.id === item.productId);
            return {
              productId: item.productId,
              quantity: item.quantity || 1,
              price: product!.price,
            };
          }),
        },
      },
      include: {
        buyer: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        seller: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        items: {
          include: {
            product: {
              include: {
                images: {
                  select: { id: true, url: true },
                },
              },
            },
          },
        },
      },
    });

    // 将商品状态更新为已预留
    await prisma.product.updateMany({
      where: {
        id: { in: productIds },
      },
      data: {
        status: "reserved",
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

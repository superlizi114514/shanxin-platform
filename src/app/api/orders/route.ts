import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { orderQuerySchema, createOrderSchema } from "@/lib/validators/order";
import { z } from "zod";
import { validateCsrfToken } from "@/middleware/csrf";

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

    // 验证查询参数
    const queryParams = orderQuerySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      role: searchParams.get("role"),
      status: searchParams.get("status"),
    });

    const { page, limit, role, status } = queryParams;
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
    if (error instanceof z.ZodError) {
      const messages = (error as z.ZodError).issues.map(e => e.message).join(', ');
      return NextResponse.json(
        { error: messages || "Validation failed" },
        { status: 400 }
      );
    }
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

    // 验证 CSRF Token
    if (!validateCsrfToken(request)) {
      return NextResponse.json(
        { error: "CSRF token missing or invalid" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // 验证请求体
    const validatedData = createOrderSchema.parse(body);
    const { sellerId, items, note } = validatedData;

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
        remark: note || null,
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
    if (error instanceof z.ZodError) {
      const messages = (error as z.ZodError).issues.map(e => e.message).join(', ');
      return NextResponse.json(
        { error: messages || "Validation failed" },
        { status: 400 }
      );
    }
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

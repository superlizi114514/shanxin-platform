import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";

const prisma = new PrismaClient();

// GET - 获取订单详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
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

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // 检查权限：只有买家或卖家可以查看订单
    if (order.buyerId !== session.user.id && order.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to view this order" },
        { status: 403 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PATCH - 更新订单状态
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // 检查权限：只有买家或卖家可以更新订单
    if (order.buyerId !== session.user.id && order.sellerId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to update this order" },
        { status: 403 }
      );
    }

    // 验证状态转换
    const validStatuses = ["pending", "paid", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    // 状态转换规则
    if (order.status === "completed" || order.status === "cancelled") {
      return NextResponse.json(
        { error: "Cannot update completed or cancelled orders" },
        { status: 400 }
      );
    }

    // 买家只能取消订单
    if (session.user.id === order.buyerId && status !== "cancelled") {
      return NextResponse.json(
        { error: "Buyer can only cancel orders" },
        { status: 403 }
      );
    }

    // 卖家只能确认收款（标记为 paid 或 completed）
    if (session.user.id === order.sellerId && status === "cancelled") {
      return NextResponse.json(
        { error: "Seller cannot cancel orders" },
        { status: 403 }
      );
    }

    // 更新订单状态
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
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

    // 如果订单被取消，将商品状态恢复为 available
    if (status === "cancelled") {
      const orderItems = await prisma.orderItem.findMany({
        where: { orderId: id },
        select: { productId: true },
      });

      const productIds = orderItems.map((item) => item.productId);
      await prisma.product.updateMany({
        where: {
          id: { in: productIds },
        },
        data: {
          status: "available",
        },
      });
    }

    // 如果订单完成，将商品状态更新为 sold
    if (status === "completed") {
      const orderItems = await prisma.orderItem.findMany({
        where: { orderId: id },
        select: { productId: true },
      });

      const productIds = orderItems.map((item) => item.productId);
      await prisma.product.updateMany({
        where: {
          id: { in: productIds },
        },
        data: {
          status: "sold",
        },
      });
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - 删除订单（仅管理员或订单双方）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // 检查权限：只有管理员、买家或卖家可以删除订单
    if (
      session.user.role !== "admin" &&
      order.buyerId !== session.user.id &&
      order.sellerId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to delete this order" },
        { status: 403 }
      );
    }

    // 只能删除已取消或已完成的订单
    if (order.status !== "cancelled" && order.status !== "completed") {
      return NextResponse.json(
        { error: "Can only delete completed or cancelled orders" },
        { status: 400 }
      );
    }

    await prisma.order.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

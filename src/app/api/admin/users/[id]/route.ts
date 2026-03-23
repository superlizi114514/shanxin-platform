import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { adminUpdateUserSchema, adminResetPasswordSchema } from "@/lib/validators/admin-user";
import { z } from "zod";
import bcrypt from "bcryptjs";

/**
 * GET /api/admin/users/[id] - 获取用户详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证管理员权限
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "需要管理员权限" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // 获取用户详情
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        studentId: true,
        school: true,
        major: true,
        class: true,
        phone: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            products: true,
            buyerOrders: true,
            collections: true,
            reviews: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("获取用户详情失败:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/users/[id] - 更新用户信息
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证管理员权限
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "需要管理员权限" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // 验证请求体
    const validatedData = adminUpdateUserSchema.parse(body);

    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      );
    }

    // 构建更新数据
    const updateData: Record<string, unknown> = {};

    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }
    if (validatedData.phone !== undefined) {
      updateData.phone = validatedData.phone;
    }
    if (validatedData.role !== undefined) {
      updateData.role = validatedData.role;
    }
    if (validatedData.status !== undefined) {
      // 使用 disabled 字段
      updateData.disabled = validatedData.status === "banned";
    }

    // 更新用户
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: "用户信息已更新",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e) => e.message).join(", ");
      return NextResponse.json(
        { error: messages },
        { status: 400 }
      );
    }
    console.error("更新用户失败:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id] - 删除用户
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 验证管理员权限
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "需要管理员权限" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      );
    }

    // 检查是否有依赖数据
    const counts = await Promise.all([
      prisma.product.count({ where: { sellerId: id } }),
      prisma.order.count({ where: { buyerId: id } }),
      prisma.review.count({ where: { userId: id } }),
    ]);

    const [productCount, orderCount, reviewCount] = counts;
    if (productCount > 0 || orderCount > 0 || reviewCount > 0) {
      return NextResponse.json(
        {
          error: "用户有关联数据，无法删除",
          details: {
            products: productCount,
            orders: orderCount,
            reviews: reviewCount,
          },
        },
        { status: 400 }
      );
    }

    // 删除用户
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "用户已删除",
    });
  } catch (error) {
    console.error("删除用户失败:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}

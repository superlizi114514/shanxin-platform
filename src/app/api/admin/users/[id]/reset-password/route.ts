import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { adminResetPasswordSchema } from "@/lib/validators/admin-user";
import { z } from "zod";
import bcrypt from "bcryptjs";

/**
 * POST /api/admin/users/[id]/reset-password - 重置用户密码
 */
export async function POST(
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
    const validatedData = adminResetPasswordSchema.parse(body);

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

    // 哈希新密码
    const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10);

    // 更新密码
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: "密码已重置",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e) => e.message).join(", ");
      return NextResponse.json(
        { error: messages },
        { status: 400 }
      );
    }
    console.error("重置密码失败:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}

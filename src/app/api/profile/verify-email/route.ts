import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 验证请求体
const verifyEmailSchema = z.object({
  code: z.string().length(6, "验证码为 6 位数字"),
  email: z.string().email("邮箱格式不正确"),
});

/**
 * POST /api/profile/verify-email
 * 验证绑定邮箱
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "未授权" },
        { status: 401 }
      );
    }

    const userId = session.user.id as string;
    if (!userId) {
      return NextResponse.json(
        { error: "用户 ID 不存在" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { code, email } = verifyEmailSchema.parse(body);

    // 验证邮箱是否已被其他用户绑定
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.id !== userId) {
      return NextResponse.json(
        { error: "该邮箱已被其他账号绑定" },
        { status: 400 }
      );
    }

    // 查找验证码记录
    const verificationRecord = await prisma.verificationToken.findFirst({
      where: {
        identifier: email,
        expires: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!verificationRecord) {
      return NextResponse.json(
        { error: "验证码已过期或不存在" },
        { status: 400 }
      );
    }

    // 删除验证码记录
    await prisma.verificationToken.delete({
      where: { id: verificationRecord.id },
    });

    // 更新用户邮箱和验证状态
    await prisma.user.update({
      where: { id: userId },
      data: {
        email,
        emailVerified: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "邮箱验证成功",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Verify email error:", error);
    return NextResponse.json(
      { error: "验证失败，请稍后重试" },
      { status: 500 }
    );
  }
}

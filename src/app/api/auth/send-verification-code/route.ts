import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import crypto from "crypto";
import { sendEmailVerificationCode } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/middleware/rate-limit";

// 验证请求体
const sendCodeSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
});

// 验证码配置
const CODE_EXPIRY = 10 * 60 * 1000; // 10 分钟

/**
 * POST /api/auth/send-verification-code
 * 发送邮箱验证码
 */
export async function POST(request: NextRequest) {
  try {
    // 速率限制：同一 IP 每 60 秒最多 3 次
    const rateLimitResult = await checkRateLimit(request, "/api/auth/send-verification-code");
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "发送过于频繁，请稍后再试" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email } = sendCodeSchema.parse(body);

    // 检查邮箱是否已被注册
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 400 }
      );
    }

    // 生成 6 位数字验证码
    const code = crypto.randomInt(100000, 999999).toString();
    const token = crypto.randomBytes(32).toString("hex");

    // 删除过期的验证码
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: email,
        expires: {
          lt: new Date(),
        },
      },
    });

    // 检查该邮箱今天已发送的次数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sentToday = await prisma.verificationToken.count({
      where: {
        identifier: email,
        createdAt: {
          gte: today,
        },
      },
    });

    if (sentToday >= 3) {
      return NextResponse.json(
        { error: "今日发送次数已达上限，请明天再试" },
        { status: 400 }
      );
    }

    // 存储验证码到数据库
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token, // 存储随机 token，验证码单独存
        expires: new Date(Date.now() + CODE_EXPIRY),
      },
    });

    // 发送验证码邮件
    const result = await sendEmailVerificationCode(email, code);

    if (!result.success) {
      return NextResponse.json(
        { error: "发送失败，请稍后重试" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "验证码已发送，请检查邮箱",
      token, // 返回 token 用于验证
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.issues.map(e => e.message).join(', ');
      return NextResponse.json(
        { error: messages || "Validation failed" },
        { status: 400 }
      );
    }
    console.error("Send verification code error:", error);
    return NextResponse.json(
      { error: "发送失败，请稍后重试" },
      { status: 500 }
    );
  }
}

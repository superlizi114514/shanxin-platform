import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

/**
 * 简化版注册测试 - 逐步排查问题
 */
export async function POST(request: NextRequest) {
  const errors: string[] = [];
  const steps: string[] = [];

  try {
    // Step 1: 解析 JSON
    steps.push("1_parsing");
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    // Step 2: 测试 bcrypt
    steps.push("2_bcrypt_start");
    const hashedPassword = await bcrypt.hash(password, 12);
    steps.push("2_bcrypt_done");

    // Step 3: 测试 crypto
    steps.push("3_crypto_start");
    const token = crypto.randomBytes(32).toString("hex");
    steps.push("3_crypto_done");

    // Step 4: 测试 Prisma 查询
    steps.push("4_prisma_start");
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "User exists" }, { status: 400 });
    }
    steps.push("4_prisma_done");

    // Step 5: 测试创建用户
    steps.push("5_create_start");
    const testEmail = `test_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`;
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        password: hashedPassword,
        name: "Test User",
        isTeacher: false,
      },
    });
    steps.push("5_create_done");

    return NextResponse.json({
      success: true,
      userId: user.id,
      tokenLength: token.length,
      steps,
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Test failed",
        message: error?.message || String(error),
        stack: error?.stack,
        lastStep: steps[steps.length - 1],
        allSteps: steps,
      },
      { status: 500 }
    );
  }
}

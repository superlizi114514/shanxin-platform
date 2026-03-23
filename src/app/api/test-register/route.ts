import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    // 1. 测试基础解析
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    // 2. 测试 bcrypt
    console.log("[test-register] Starting bcrypt hash...");
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log("[test-register] Bcrypt hash completed");

    // 3. 测试 crypto
    console.log("[test-register] Generating random token...");
    const token = crypto.randomBytes(32).toString("hex");
    console.log("[test-register] Token generated:", token.substring(0, 16) + "...");

    // 4. 测试简单的 Prisma 查询
    console.log("[test-register] Testing Prisma connection...");
    const userCount = await prisma.user.count();
    console.log("[test-register] User count:", userCount);

    // 5. 测试创建用户
    console.log("[test-register] Creating test user...");
    const testEmail = `test_${Date.now()}@test.com`;
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        password: hashedPassword,
        name: "Test User",
        isTeacher: false,
      },
    });
    console.log("[test-register] User created:", user.id);

    return NextResponse.json({
      success: true,
      message: "All steps passed",
      userId: user.id,
      tokenLength: token.length,
    });
  } catch (error: any) {
    console.error("[test-register] ERROR at step:", error);
    return NextResponse.json(
      {
        error: "Test failed",
        message: error?.message || String(error),
        stack: error?.stack
      },
      { status: 500 }
    );
  }
}

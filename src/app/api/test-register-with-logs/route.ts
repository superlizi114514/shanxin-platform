import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { registerSchema } from "@/lib/validators/auth";
import { z } from "zod";
import { checkRateLimit } from "@/middleware/rate-limit";

/**
 * 精确复制原始注册 API，但添加详细日志
 */
export async function POST(request: NextRequest) {
  const logs: string[] = [];

  try {
    logs.push("1:rate_limit_start");
    const rateLimitResult = await checkRateLimit(request, "/api/auth/register");
    logs.push(`1:rate_limit_done:success=${rateLimitResult.success}`);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests", logs },
        { status: 429 }
      );
    }

    logs.push("2:parse_json_start");
    const body = await request.json();
    logs.push("2:parse_json_done");

    logs.push("3:zod_validate_start");
    const validatedData = registerSchema.parse(body);
    logs.push("3:zod_validate_done");

    const { email, password, name, studentId, phone, school, major, class: classValue, isTeacher, title } = validatedData;
    logs.push(`4:extracted:isTeacher=${isTeacher}`);

    logs.push("5:check_user_start");
    const existingUser = await prisma.user.findUnique({ where: { email } });
    logs.push(`5:check_user_done:exists=${!!existingUser}`);

    if (existingUser) {
      return NextResponse.json({ error: "User exists", logs }, { status: 400 });
    }

    logs.push("6:bcrypt_start");
    const hashedPassword = await bcrypt.hash(password, 12);
    logs.push("6:bcrypt_done");

    logs.push("7:crypto_start");
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    logs.push("7:crypto_done");

    logs.push("8:school_start");
    let schoolRecord = await prisma.school.findFirst({ where: { code: "sdxx" } });
    logs.push(`8:school_found=${!!schoolRecord}`);

    if (!schoolRecord) {
      logs.push("8:school_create_start");
      schoolRecord = await prisma.school.create({
        data: { name: "山东信息职业技术学院", code: "sdxx", address: school || "奎文" },
      });
      logs.push(`8:school_create_done`);
    }

    logs.push("9:user_create_start");
    const userData = {
      email,
      password: hashedPassword,
      name: name || null,
      studentId: isTeacher ? null : studentId,
      phone,
      school: isTeacher ? null : (school || "奎文"),
      major: isTeacher ? null : major,
      class: isTeacher ? null : classValue,
      title: isTeacher ? (title || "老师") : null,
      isTeacher: isTeacher || false,
      schoolId: !isTeacher ? schoolRecord.id : null,
      emailVerified: null,
    };
    const user = await prisma.user.create({ data: userData });
    logs.push(`9:user_create_done:userId=${user.id}`);

    if (!isTeacher && studentId) {
      logs.push("10:student_verification_start");
      await prisma.studentVerification.create({
        data: {
          studentId: studentId,
          schoolId: schoolRecord.id,
          major: major || "",
          class: classValue || "",
          verified: true,
          userId: user.id,
        },
      });
      logs.push("10:student_verification_done");
    }

    logs.push("11:verification_token_start");
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationToken,
        expires: verificationTokenExpires,
      },
    });
    logs.push("11:verification_token_done");

    logs.push("12:email_check_start");
    logs.push(`RESEND_API_KEY=${process.env.RESEND_API_KEY ? "set" : "not_set"}`);
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "re_your-resend-api-key") {
      logs.push("12:email_send_attempt");
      // 不实际调用 sendVerificationEmail，因为会导致 Resend 错误
      // 这里只模拟测试
      logs.push("12:email_send_skipped_for_test");
    } else {
      logs.push("12:email_send_skipped:not_configured");
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      logs,
      message: "Registration successful (test with logs)",
    });

  } catch (error: any) {
    logs.push(`ERROR:${error?.message || String(error)}`);
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e: any) => `${e.path?.join('.')}: ${e.message}`).join(', ');
      logs.push(`ZodError:${messages}`);
    }
    return NextResponse.json(
      { error: "Test failed", logs, lastLog: logs[logs.length - 1] },
      { status: 500 }
    );
  }
}

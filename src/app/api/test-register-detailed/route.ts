import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { registerSchema } from "@/lib/validators/auth";

/**
 * 详细测试注册 API 的每一步
 */
export async function POST(request: NextRequest) {
  const logs: string[] = [];

  try {
    // Step 1: 解析 JSON
    logs.push("step1:parse_json:start");
    const body = await request.json();
    logs.push("step1:parse_json:done");

    // Step 2: Zod 验证
    logs.push("step2:zod_validate:start");
    const validatedData = registerSchema.parse(body);
    logs.push("step2:zod_validate:done");

    const { email, password, name, studentId, phone, school, major, class: classValue, isTeacher, title } = validatedData;
    logs.push(`validated: email=${email}, isTeacher=${isTeacher}`);

    // Step 3: 检查用户是否存在
    logs.push("step3:check_user:start");
    const existingUser = await prisma.user.findUnique({ where: { email } });
    logs.push(`step3:check_user:done, exists=${!!existingUser}`);

    if (existingUser) {
      return NextResponse.json({ error: "User exists", logs }, { status: 400 });
    }

    // Step 4: 哈希密码
    logs.push("step4:bcrypt:start");
    const hashedPassword = await bcrypt.hash(password, 12);
    logs.push("step4:bcrypt:done");

    // Step 5: 生成 token
    logs.push("step5:crypto:start");
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    logs.push("step5:crypto:done");

    // Step 6: 获取或创建学校
    logs.push("step6:school:start");
    let schoolRecord = await prisma.school.findFirst({ where: { code: "sdxx" } });
    logs.push(`step6:school:found=${!!schoolRecord}`);

    if (!schoolRecord) {
      logs.push("step6:school:create:start");
      schoolRecord = await prisma.school.create({
        data: { name: "山东信息职业技术学院", code: "sdxx", address: school || "奎文" },
      });
      logs.push(`step6:school:create:done, id=${schoolRecord.id}`);
    }

    // Step 7: 创建用户
    logs.push("step7:create_user:start");
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
    logs.push(`userData: ${JSON.stringify(userData, null, 2)}`);

    const user = await prisma.user.create({ data: userData });
    logs.push(`step7:create_user:done, userId=${user.id}`);

    // Step 8: 创建学生验证记录（仅非教师且有学号时）
    if (!isTeacher && studentId) {
      logs.push("step8:student_verification:start");
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
      logs.push("step8:student_verification:done");
    } else {
      logs.push(`step8:student_verification:skipped, isTeacher=${isTeacher}, studentId=${studentId}`);
    }

    // Step 9: 创建验证 token
    logs.push("step9:verification_token:start");
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationToken,
        expires: verificationTokenExpires,
      },
    });
    logs.push("step9:verification_token:done");

    return NextResponse.json({
      success: true,
      userId: user.id,
      logs,
    });

  } catch (error: any) {
    logs.push(`ERROR: ${error?.message || String(error)}`);
    logs.push(`Stack: ${error?.stack}`);
    return NextResponse.json(
      { error: "Test failed", logs, lastLog: logs[logs.length - 1] },
      { status: 500 }
    );
  }
}

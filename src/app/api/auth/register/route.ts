import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";
import { registerSchema } from "@/lib/validators/auth";
import { z } from "zod";
import { checkRateLimit } from "@/middleware/rate-limit";

// Force Node.js runtime for Prisma and bcrypt compatibility
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // 检查速率限制
    const rateLimitResult = await checkRateLimit(request, "/api/auth/register");
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Too many requests",
          message: `Please try again in ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)} seconds.`,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "3",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
          },
        }
      );
    }

    const body = await request.json();

    // 使用 Zod 验证请求体
    const validatedData = registerSchema.parse(body);
    const { email, password, name, studentId, phone, school, major, class: classValue, isTeacher, title } = validatedData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Check if student ID is already registered (only for non-teacher)
    if (studentId && !isTeacher) {
      const existingStudentIdUser = await prisma.user.findUnique({
        where: { studentId },
      });

      if (existingStudentIdUser) {
        return NextResponse.json(
          { error: "该学号已被注册" },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Get or create school record (default to 山东信息职业技术学院)
    let schoolRecord = await prisma.school.findFirst({
      where: { code: "sdxx" },
    });

    if (!schoolRecord) {
      schoolRecord = await prisma.school.create({
        data: {
          name: "山东信息职业技术学院",
          code: "sdxx",
          address: school || "奎文",
        },
      });
    }

    // Create user with student information
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

    // Create student verification record (only for non-teacher)
    if (!isTeacher) {
      await prisma.studentVerification.create({
        data: {
          studentId: studentId || "",
          schoolId: schoolRecord.id,
          major: major || "",
          class: classValue || "",
          verified: true, // Auto-verified since we validated the format
          userId: user.id,
        },
      });
    }

    // Create verification token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationToken,
        expires: verificationTokenExpires,
      },
    });

    // Send verification email (non-blocking, don't fail registration if email fails)
    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Continue with registration even if email fails
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          studentId: user.studentId,
        },
        message: "Registration successful. Please check your email to verify your account.",
      },
      {
        status: 201,
        headers: {
          "X-RateLimit-Limit": "3",
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
        },
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = (error as z.ZodError).issues.map(e => e.message).join(', ');
      return NextResponse.json(
        { error: messages || "Validation failed" },
        { status: 400 }
      );
    }
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

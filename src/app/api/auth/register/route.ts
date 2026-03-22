import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/email";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, studentId, phone, school, major, class: classValue } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (!studentId) {
      return NextResponse.json(
        { error: "学号不能为空" },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { error: "手机号不能为空" },
        { status: 400 }
      );
    }

    // Validate student ID format (alphanumeric only)
    if (!/^[a-zA-Z0-9]+$/.test(studentId)) {
      return NextResponse.json(
        { error: "学号格式不正确，只能包含字母和数字" },
        { status: 400 }
      );
    }

    // Validate phone format (11 digit Chinese phone number)
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: "手机号格式不正确" },
        { status: 400 }
      );
    }

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

    // Check if student ID is already registered
    const existingStudentIdUser = await prisma.user.findUnique({
      where: { studentId },
    });

    if (existingStudentIdUser) {
      return NextResponse.json(
        { error: "该学号已被注册" },
        { status: 400 }
      );
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
        },
      });
    }

    // Create user with student information
    const userData = {
      email,
      password: hashedPassword,
      name: name || null,
      studentId,
      phone,
      school: school || "山东信息职业技术学院",
      major: major || null,
      class: classValue || null,
      schoolId: schoolRecord.id,
      emailVerified: null,
    };
    const user = await prisma.user.create({ data: userData });

    // Create student verification record
    await prisma.studentVerification.create({
      data: {
        studentId,
        schoolId: schoolRecord.id,
        major: major || "",
        class: classValue || "",
        verified: true, // Auto-verified since we validated the format
        userId: user.id,
      },
    });

    // Create verification token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationToken,
        expires: verificationTokenExpires,
      },
    });

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

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
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

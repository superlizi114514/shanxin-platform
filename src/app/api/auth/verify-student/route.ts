import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Student ID Verification API
 *
 * This endpoint validates student ID format and checks against the database.
 * For 山东信息职业技术学院，student IDs follow specific patterns:
 * - Format: YYYYXXXXXX (10 digits)
 *   - YYYY: Enrollment year (e.g., 2023, 2024, 2025)
 *   - XX: Department/School code (01-99)
 *   - XXXX: Student number within the department
 *
 * Alternatively accepts alphanumeric format for continuing education students.
 */

// Valid enrollment years for current students (adjust as needed)
const VALID_ENROLLMENT_YEARS = [2022, 2023, 2024, 2025];

// School/Department codes for 山东信息职业技术学院
const VALID_SCHOOL_CODES: Record<string, string> = {
  "01": "软件学院",
  "02": "信息工程学院",
  "03": "人工智能学院",
  "04": "大数据学院",
  "05": "物联网学院",
  "06": " cyberspace 学院",
  "07": "继续教育学院",
  "08": "基础教学部",
  "09": "马克思主义学院",
  "10": "经济管理学院",
};

/**
 * Validate student ID format and return school information
 */
function validateStudentIdFormat(studentId: string): {
  valid: boolean;
  error?: string;
  enrollmentYear?: number;
  schoolCode?: string;
  schoolName?: string;
} {
  if (!studentId || studentId.trim().length === 0) {
    return { valid: false, error: "学号不能为空" };
  }

  const trimmedId = studentId.trim();

  // Check for 10-digit numeric format (standard student ID)
  const standardFormat = /^(\d{4})(\d{2})(\d{4})$/.exec(trimmedId);
  if (standardFormat) {
    const enrollmentYear = parseInt(standardFormat[1], 10);
    const schoolCode = standardFormat[2];

    // Validate enrollment year
    if (!VALID_ENROLLMENT_YEARS.includes(enrollmentYear)) {
      return {
        valid: false,
        error: `入学年份不在有效范围内 (${VALID_ENROLLMENT_YEARS.join(", ")})`
      };
    }

    // Validate school code
    const schoolName = VALID_SCHOOL_CODES[schoolCode];
    if (!schoolName) {
      return {
        valid: false,
        error: "无效的学院代码"
      };
    }

    return {
      valid: true,
      enrollmentYear,
      schoolCode,
      schoolName,
    };
  }

  // Check for alphanumeric format (continuing education or special programs)
  const altFormat = /^[a-zA-Z0-9]{6,12}$/.test(trimmedId);
  if (altFormat) {
    return {
      valid: true,
      schoolName: "山东信息职业技术学院",
    };
  }

  return {
    valid: false,
    error: "学号格式不正确，应为 10 位数字或 6-12 位字母数字组合",
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: "学号不能为空", valid: false },
        { status: 400 }
      );
    }

    // Validate format
    const formatValidation = validateStudentIdFormat(studentId);

    if (!formatValidation.valid) {
      return NextResponse.json(
        { error: formatValidation.error, valid: false },
        { status: 400 }
      );
    }

    // Check if student ID is already registered
    const existingUser = await prisma.user.findUnique({
      where: { studentId },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: "该学号已被注册",
          valid: false,
          schoolName: formatValidation.schoolName,
        },
        { status: 400 }
      );
    }

    // Check if student ID is already in verification queue
    const existingVerification = await prisma.studentVerification.findUnique({
      where: { studentId },
    });

    if (existingVerification && existingVerification.verified) {
      return NextResponse.json(
        {
          error: "该学号已完成验证",
          valid: false,
          schoolName: formatValidation.schoolName,
        },
        { status: 400 }
      );
    }

    // Return success with school information
    return NextResponse.json({
      valid: true,
      message: "学号验证通过",
      schoolName: formatValidation.schoolName,
      schoolCode: formatValidation.schoolCode,
      enrollmentYear: formatValidation.enrollmentYear,
    });

  } catch (error) {
    console.error("Student ID verification error:", error);
    return NextResponse.json(
      { error: "验证失败，请稍后重试", valid: false },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  // Return list of valid schools for frontend dropdown
  const schools = Object.entries(VALID_SCHOOL_CODES).map(([code, name]) => ({
    code,
    name,
  }));

  return NextResponse.json({
    schools,
    enrollmentYears: VALID_ENROLLMENT_YEARS,
  });
}

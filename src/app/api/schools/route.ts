import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - 获取所有学校
export async function GET() {
  try {
    const schools = await prisma.school.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ schools });
  } catch (error) {
    console.error("Error fetching schools:", error);
    return NextResponse.json(
      { error: "Failed to fetch schools" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - 创建新学校（仅管理员）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, logo, address } = body;

    if (!name || !code) {
      return NextResponse.json(
        { error: "Name and code are required" },
        { status: 400 }
      );
    }

    const school = await prisma.school.create({
      data: {
        name,
        code,
        logo: logo || null,
        address: address || null,
      },
    });

    return NextResponse.json(school, { status: 201 });
  } catch (error) {
    console.error("Error creating school:", error);
    return NextResponse.json(
      { error: "Failed to create school" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

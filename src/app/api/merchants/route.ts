import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";

const prisma = new PrismaClient();

// GET - 获取商家列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const schoolId = searchParams.get("schoolId");
    const category = searchParams.get("category");

    const skip = (page - 1) * limit;

    const where: any = {};

    if (schoolId) {
      where.schoolId = schoolId;
    }

    if (category) {
      where.categories = {
        some: {
          id: category,
        },
      };
    }

    const [merchants, total] = await Promise.all([
      prisma.merchant.findMany({
        where,
        skip,
        take: limit,
        include: {
          school: {
            select: { id: true, name: true, logo: true },
          },
          categories: {
            select: { id: true, name: true, icon: true },
          },
          images: {
            select: { id: true, url: true },
          },
          reviews: {
            select: { id: true, rating: true },
          },
        },
        orderBy: { rating: "desc" },
      }),
      prisma.merchant.count({ where }),
    ]);

    return NextResponse.json({
      merchants,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching merchants:", error);
    return NextResponse.json(
      { error: "Failed to fetch merchants" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - 创建商家
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    // 检查是否为管理员
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (user?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, logo, schoolId, address, phone, categories, images } = body;

    if (!name || !schoolId) {
      return NextResponse.json(
        { error: "Name and school are required" },
        { status: 400 }
      );
    }

    const merchant = await prisma.merchant.create({
      data: {
        name,
        description: description || null,
        logo: logo || null,
        schoolId,
        address: address || null,
        phone: phone || null,
        categories: categories
          ? {
              connect: categories.map((id: string) => ({ id })),
            }
          : undefined,
        images: images
          ? {
              create: images.map((url: string) => ({ url })),
            }
          : undefined,
      },
      include: {
        school: {
          select: { id: true, name: true, logo: true },
        },
        categories: {
          select: { id: true, name: true, icon: true },
        },
        images: {
          select: { id: true, url: true },
        },
      },
    });

    return NextResponse.json(merchant, { status: 201 });
  } catch (error) {
    console.error("Error creating merchant:", error);
    return NextResponse.json(
      { error: "Failed to create merchant" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

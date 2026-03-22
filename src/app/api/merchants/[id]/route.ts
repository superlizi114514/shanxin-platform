import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";

const prisma = new PrismaClient();

// GET - 获取单个商家详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const merchant = await prisma.merchant.findUnique({
      where: { id },
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
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
            images: {
              select: { id: true, url: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(merchant);
  } catch (error) {
    console.error("Error fetching merchant:", error);
    return NextResponse.json(
      { error: "Failed to fetch merchant" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - 更新商家
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();

    const merchant = await prisma.merchant.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        logo: body.logo,
        address: body.address,
        phone: body.phone,
        verified: body.verified,
        categories: body.categoryIds
          ? {
              set: [],
              connect: body.categoryIds.map((categoryId: string) => ({ id: categoryId })),
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

    return NextResponse.json(merchant);
  } catch (error) {
    console.error("Error updating merchant:", error);
    return NextResponse.json(
      { error: "Failed to update merchant" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - 删除商家
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    await prisma.merchant.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Merchant deleted successfully" });
  } catch (error) {
    console.error("Error deleting merchant:", error);
    return NextResponse.json(
      { error: "Failed to delete merchant" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

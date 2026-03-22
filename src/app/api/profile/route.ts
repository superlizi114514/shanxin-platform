import { auth } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

// GET /api/profile - 获取当前用户资料
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        schoolRel: true,
        products: {
          orderBy: { createdAt: "desc" },
          include: {
            images: true,
          },
        },
        buyerOrders: {
          orderBy: { createdAt: "desc" },
          include: {
            items: {
              include: {
                product: {
                  include: {
                    images: true,
                  },
                },
              },
            },
            seller: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        sellerOrders: {
          orderBy: { createdAt: "desc" },
          include: {
            items: {
              include: {
                product: {
                  include: {
                    images: true,
                  },
                },
              },
            },
            buyer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
          include: {
            product: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        visits: {
          orderBy: { createdAt: "desc" },
          take: 20, // 最近 20 条浏览记录
        },
        _count: {
          select: {
            products: true,
            buyerOrders: true,
            sellerOrders: true,
            reviews: true,
            collections: true,
            visits: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        emailVerified: user.emailVerified,
        school: user.school,
        studentId: user.studentId,
        major: user.major,
        class: user.class,
        phone: user.phone,
        stats: user._count,
        products: user.products,
        buyerOrders: user.buyerOrders,
        sellerOrders: user.sellerOrders,
        reviews: user.reviews,
        visits: user.visits,
      },
    });
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PATCH /api/profile - 更新用户资料
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, avatar, schoolId } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (schoolId !== undefined) updateData.schoolId = schoolId;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

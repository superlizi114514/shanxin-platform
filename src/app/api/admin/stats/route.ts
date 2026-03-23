import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get counts from different models
    const [userCount, productCount, merchantCount, newsCount, orderCount] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.merchant.count(),
      prisma.news.count(),
      prisma.order.count(),
    ]);

    return NextResponse.json({
      stats: {
        userCount,
        productCount,
        merchantCount,
        newsCount,
        orderCount,
      },
    });
  } catch (error) {
    console.error("Failed to fetch admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}

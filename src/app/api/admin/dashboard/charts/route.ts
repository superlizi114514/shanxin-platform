import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 获取分类分布数据（饼状图）
    const categoryData = await prisma.merchantCategory.findMany({
      include: {
        merchants: true,
      },
    });

    const categoryChartData = categoryData.map((cat) => ({
      name: cat.name,
      value: cat.merchants.length,
    }));

    // 如果没有分类数据，使用默认数据
    if (categoryChartData.length === 0) {
      const defaultCategories = [
        { name: "餐饮美食", value: 25 },
        { name: "购物消费", value: 18 },
        { name: "生活服务", value: 15 },
        { name: "教育培训", value: 12 },
        { name: "娱乐休闲", value: 10 },
        { name: "其他", value: 5 },
      ];
      categoryChartData.push(...defaultCategories);
    }

    // 获取趋势数据（线形图）- 近 7 日
    const today = new Date();
    const trendData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      // 模拟数据（实际应该从数据库获取）
      const userGrowth = Math.floor(Math.random() * 20) + 10;
      const orderGrowth = Math.floor(Math.random() * 30) + 15;

      trendData.push({
        name: dateStr.slice(5), // MM-DD 格式
        "用户增长": userGrowth,
        "订单增长": orderGrowth,
      });
    }

    // 获取雷达图数据（平台健康度）
    const [userCount, productCount, merchantCount, orderCount, reviewCount] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.merchant.count(),
      prisma.order.count(),
      prisma.merchantReview.count(),
    ]);

    // 计算各项指标得分（0-100）
    const userScore = Math.min(100, Math.floor((userCount / 100) * 100));
    const productScore = Math.min(100, Math.floor((productCount / 500) * 100));
    const merchantScore = Math.min(100, Math.floor((merchantCount / 50) * 100));
    const orderScore = Math.min(100, Math.floor((orderCount / 200) * 100));
    const reviewScore = Math.min(100, Math.floor((reviewCount / 100) * 100));
    const activityScore = Math.floor(Math.random() * 30) + 60; // 活跃度

    const radarChartData = [
      { subject: "用户规模", value: userScore, fullMark: 100 },
      { subject: "商品丰富度", value: productScore, fullMark: 100 },
      { subject: "商家数量", value: merchantScore, fullMark: 100 },
      { subject: "订单转化", value: orderScore, fullMark: 100 },
      { subject: "用户评价", value: reviewScore, fullMark: 100 },
      { subject: "平台活跃度", value: activityScore, fullMark: 100 },
    ];

    return NextResponse.json({
      success: true,
      data: {
        categoryData: categoryChartData,
        trendData,
        radarData: radarChartData,
      },
    });
  } catch (error) {
    console.error("Failed to fetch chart data:", error);
    return NextResponse.json(
      { error: "Failed to fetch chart data" },
      { status: 500 }
    );
  }
}

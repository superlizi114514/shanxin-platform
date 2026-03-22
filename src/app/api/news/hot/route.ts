import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/../prisma/index";

/**
 * GET /api/news/hot - 获取热门新闻推荐
 *
 * 热门新闻算法：
 * - 基础分数 = 浏览量 / 10
 * - 时间系数 = 1 / (天数 + 1)^0.5 (越近的新闻系数越高)
 * - 评论加分 = 评论数量 * 2
 * - 最终分数 = (基础分数 + 评论加分) * 时间系数
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");
    const days = parseInt(searchParams.get("days") || "7"); // 默认统计最近 7 天

    // 计算日期阈值
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);

    // 获取已发布的新闻
    const newsList = await prisma.news.findMany({
      where: {
        published: true,
        publishedAt: {
          gte: dateThreshold,
        },
      },
      select: {
        id: true,
        title: true,
        summary: true,
        coverImage: true,
        category: true,
        views: true,
        publishedAt: true,
        createdAt: true,
        comments: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        publishedAt: "desc",
      },
    });

    // 计算每篇新闻的热门分数
    const now = new Date();
    const newsWithScores = newsList.map((news) => {
      const publishDate = news.publishedAt || news.createdAt;
      const daysSincePublish = (now.getTime() - new Date(publishDate).getTime()) / (1000 * 60 * 60 * 24);

      // 基础分数 (浏览量)
      const baseScore = news.views / 10;

      // 时间系数 (越近越高)
      const timeCoefficient = 1 / Math.pow(daysSincePublish + 1, 0.5);

      // 评论加分
      const commentBonus = news.comments.length * 2;

      // 最终分数
      const hotScore = (baseScore + commentBonus) * timeCoefficient;

      return {
        ...news,
        hotScore,
        commentCount: news.comments.length,
      };
    });

    // 按热门分数排序
    newsWithScores.sort((a, b) => b.hotScore - a.hotScore);

    // 返回指定数量的热门新闻
    const hotNews = newsWithScores.slice(0, limit).map((news) => ({
      id: news.id,
      title: news.title,
      summary: news.summary,
      coverImage: news.coverImage,
      category: news.category,
      views: news.views,
      commentCount: news.commentCount,
      publishedAt: news.publishedAt,
      hotScore: Math.round(news.hotScore * 100) / 100, // 保留两位小数
    }));

    return NextResponse.json({
      hotNews,
      metadata: {
        limit,
        days,
        total: hotNews.length,
      },
    });
  } catch (error) {
    console.error("Error fetching hot news:", error);
    return NextResponse.json(
      { error: "Failed to fetch hot news" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

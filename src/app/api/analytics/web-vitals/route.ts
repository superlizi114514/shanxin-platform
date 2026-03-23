import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/analytics/web-vitals - 接收 Web Vitals 指标数据
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 生产环境可以发送到第三方分析服务
    // 这里只记录日志
    console.log("[Web Vitals]", body.event);

    return NextResponse.json({
      success: true,
      message: "Web Vitals metrics received",
    });
  } catch (error) {
    console.error("Failed to process Web Vitals:", error);
    return NextResponse.json(
      { error: "Failed to process metrics" },
      { status: 500 }
    );
  }
}

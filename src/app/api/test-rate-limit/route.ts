import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/middleware/rate-limit";

/**
 * 测试速率限制中间件
 */
export async function POST(request: NextRequest) {
  const logs: string[] = [];

  try {
    logs.push("rate_limit_check:start");

    // 尝试获取客户端标识
    logs.push("getting_client_id:start");
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    logs.push(`forwardedFor=${forwardedFor}, realIp=${realIp}`);
    logs.push("getting_client_id:done");

    logs.push("checkRateLimit:start");
    const result = await checkRateLimit(request, "/api/auth/register");
    logs.push(`checkRateLimit:done, success=${result.success}, remaining=${result.remaining}`);

    return NextResponse.json({
      success: true,
      logs,
      rateLimitResult: result,
    });

  } catch (error: any) {
    logs.push(`ERROR: ${error?.message || String(error)}`);
    logs.push(`Stack: ${error?.stack}`);
    return NextResponse.json(
      { error: "Rate limit test failed", logs, lastLog: logs[logs.length - 1] },
      { status: 500 }
    );
  }
}

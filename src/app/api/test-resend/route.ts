import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

/**
 * 测试 Resend SDK 初始化问题
 */
export async function POST(request: NextRequest) {
  const logs: string[] = [];

  try {
    logs.push(`RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '***' + process.env.RESEND_API_KEY.substring(0,4) : 'undefined/empty'}`);
    logs.push(`RESEND_API_KEY length: ${process.env.RESEND_API_KEY?.length || 0}`);
    logs.push(`RESEND_API_KEY is empty string: ${process.env.RESEND_API_KEY === ''}`);

    // 尝试初始化 Resend
    logs.push("creating_resend:start");
    const resend = new Resend(process.env.RESEND_API_KEY);
    logs.push("creating_resend:done");

    // 尝试发送邮件（会失败，但看错误是什么）
    logs.push("sending_email:start");
    try {
      const { data, error } = await resend.emails.send({
        from: "test <onboarding@resend.dev>",
        to: ["test@example.com"],
        subject: "Test",
        html: "Test",
      });

      if (error) {
        logs.push(`sending_email:error:${error.message}`);
      } else {
        logs.push(`sending_email:done`);
      }
    } catch (emailError: any) {
      logs.push(`sending_email:exception:${emailError?.message || String(emailError)}`);
    }

    return NextResponse.json({ logs, success: true });

  } catch (error: any) {
    logs.push(`FATAL: ${error?.message || String(error)}`);
    return NextResponse.json({ logs, error: "Test failed" }, { status: 500 });
  }
}

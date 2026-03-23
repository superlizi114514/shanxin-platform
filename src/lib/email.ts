import { Resend } from "resend";

// 仅在 RESEND_API_KEY 存在时初始化 Resend 客户端
const resend = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "re_your-resend-api-key"
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

// 发件人配置 - 从环境变量读取，默认使用 Resend 提供的默认发件人
const FROM_EMAIL = process.env.FROM_EMAIL || "山信二手平台 <onboarding@resend.dev>";

export async function sendVerificationEmail(email: string, verificationToken: string) {
  // 如果 Resend 客户端未初始化，直接返回
  if (!resend) {
    console.warn("Resend not configured, skipping email verification");
    return { success: false, error: "Resend not configured" };
  }

  const verificationUrl = `${APP_URL}/verify-email?token=${verificationToken}`;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: "验证您的邮箱 - 山信二手平台",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">欢迎加入山信二手平台!</h1>
          <p>感谢您注册山信二手平台。请点击下方按钮验证您的邮箱地址：</p>
          <a href="${verificationUrl}"
             style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
            验证邮箱
          </a>
          <p>或者复制以下链接到浏览器：</p>
          <p style="color: #6b7280; word-break: break-all;">${verificationUrl}</p>
          <p style="color: #6b7280; font-size: 14px;">此链接将在 24 小时后过期。</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">如果不是您本人注册，请忽略此邮件。</p>
        </div>
      `,
    });

    if (error) {
      console.error("Failed to send verification email:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Error sending email:", err);
    return { success: false, error: "Failed to send email" };
  }
}

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  // 如果 Resend 客户端未初始化，直接返回
  if (!resend) {
    console.warn("Resend not configured, skipping password reset email");
    return { success: false, error: "Resend not configured" };
  }

  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: "重置密码 - 山信二手平台",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">重置您的密码</h1>
          <p>您请求重置密码。请点击下方按钮设置新密码：</p>
          <a href="${resetUrl}"
             style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
            重置密码
          </a>
          <p>或者复制以下链接到浏览器：</p>
          <p style="color: #6b7280; word-break: break-all;">${resetUrl}</p>
          <p style="color: #6b7280; font-size: 14px;">此链接将在 1 小时后过期。</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">如果您没有请求重置密码，请忽略此邮件。</p>
        </div>
      `,
    });

    if (error) {
      console.error("Failed to send reset email:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Error sending email:", err);
    return { success: false, error: "Failed to send email" };
  }
}

/**
 * 发送邮箱验证码
 */
export async function sendEmailVerificationCode(email: string, code: string) {
  // 如果 Resend 客户端未初始化，直接返回
  if (!resend) {
    console.warn("Resend not configured, skipping verification code email");
    return { success: false, error: "Resend not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: "邮箱验证码 - 山信二手平台",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">邮箱验证码</h1>
          <p>您请求的邮箱验证码如下：</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <span style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 8px;">${code}</span>
          </div>
          <p style="color: #6b7280; font-size: 14px;">此验证码将在 10 分钟后过期。</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">如果不是您本人操作，请忽略此邮件。</p>
        </div>
      `,
    });

    if (error) {
      console.error("Failed to send verification code email:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error("Error sending email:", err);
    return { success: false, error: "Failed to send email" };
  }
}

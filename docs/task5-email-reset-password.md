# 任务五：邮箱重置密码 + 个人主页邮箱认证

## 任务概述
完善邮箱重置密码功能和个人主页邮箱认证操作，确保邮箱服务在 Vercel 上正确部署。

## 功能范围
- ✅ 忘记密码 - 发送重置邮件
- ✅ 重置密码 - 验证 token 并更新密码
- ✅ 个人主页 - 绑定/验证邮箱
- ✅ Vercel 环境配置

---

## 第一步：现有功能检查

### 已有文件清单

**API 路由：**
- `src/app/api/auth/forgot-password/route.ts` - 发送重置密码邮件 ✅
- `src/app/api/auth/reset-password/route.ts` - 重置密码 ✅
- `src/app/api/auth/verify-email/route.ts` - 验证邮箱 ✅

**前端页面：**
- `src/app/forgot-password/page.tsx` - 忘记密码页面 ✅
- `src/app/reset-password/page.tsx` - 重置密码页面 ✅

**工具函数：**
- `src/lib/email.ts` - 邮件发送服务 (使用 Resend) ✅

**数据模型：**
- `PasswordResetToken` - 密码重置令牌 ✅
- `VerificationToken` - 邮箱验证令牌 ✅

---

## 第二步：个人主页邮箱认证

### 文件：`src/app/profile/account-security/page.tsx`

**添加邮箱验证功能**

在现有代码基础上添加：

```tsx
// 绑定邮箱表单
const [showEmailModal, setShowEmailModal] = useState(false);
const [email, setEmail] = useState("");
const [emailCode, setEmailCode] = useState("");
const [sendingEmailCode, setSendingEmailCode] = useState(false);
const [bindingEmail, setBindingEmail] = useState(false);

// 发送邮箱验证码
const handleSendEmailCode = async () => {
  if (!email) {
    alert("请输入邮箱地址");
    return;
  }

  // 邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert("请输入正确的邮箱地址");
    return;
  }

  setSendingEmailCode(true);
  try {
    const response = await fetch("/api/auth/send-verification-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (response.ok) {
      alert("验证码已发送到邮箱");
      setCountdown(60);
    } else {
      alert(data.error || "发送失败");
    }
  } catch (error) {
    console.error("Send email code error:", error);
    alert("网络错误，请稍后重试");
  } finally {
    setSendingEmailCode(false);
  }
};

// 绑定邮箱
const handleBindEmail = async () => {
  if (!emailCode) {
    alert("请输入验证码");
    return;
  }

  setBindingEmail(true);
  try {
    const response = await fetch("/api/profile/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: emailCode }),
    });

    const data = await response.json();
    if (response.ok) {
      alert("邮箱绑定成功");
      setShowEmailModal(false);
      fetchSecurityInfo();
      await updateSession();
    } else {
      alert(data.error || "绑定失败");
    }
  } catch (error) {
    console.error("Bind email error:", error);
    alert("网络错误，请稍后重试");
  } finally {
    setBindingEmail(false);
  }
};
```

---

## 第三步：新增 API 路由

### 文件：`src/app/api/auth/send-verification-code/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "邮箱不能为空" }, { status: 400 });
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
    }

    // 检查邮箱是否已被注册
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "该邮箱已被注册" }, { status: 400 });
    }

    // 生成 6 位数字验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 分钟

    // 保存验证码到数据库
    await prisma.verificationToken.upsert({
      where: { identifier: email },
      update: {
        token: code,
        expires,
      },
      create: {
        identifier: email,
        token: code,
        expires,
      },
    });

    // 发送验证码邮件
    await resend.emails.send({
      from: "山信二手平台 <noreply@yourdomain.com>",
      to: [email],
      subject: "邮箱验证码 - 山信二手平台",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">邮箱验证码</h1>
          <p>您的验证码是：</p>
          <p style="font-size: 32px; font-weight: bold; color: #2563eb; text-align: center; margin: 24px 0;">
            ${code}
          </p>
          <p style="color: #6b7280; font-size: 14px;">此验证码将在 10 分钟后过期。</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">如果不是您本人操作，请忽略此邮件。</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send verification code error:", error);
    return NextResponse.json({ error: "发送失败" }, { status: 500 });
  }
}
```

---

### 文件：`src/app/api/profile/verify-email/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    }

    // 查找验证码
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { identifier: email },
    });

    if (!verificationToken) {
      return NextResponse.json({ error: "验证码不存在" }, { status: 400 });
    }

    if (verificationToken.token !== code) {
      return NextResponse.json({ error: "验证码错误" }, { status: 400 });
    }

    if (new Date(verificationToken.expires) < new Date()) {
      return NextResponse.json({ error: "验证码已过期" }, { status: 400 });
    }

    // 检查邮箱是否已被其他用户使用
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json({ error: "该邮箱已被绑定" }, { status: 400 });
    }

    // 更新用户邮箱
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        email,
        emailVerified: new Date(),
      },
    });

    // 删除验证码
    await prisma.verificationToken.delete({
      where: { identifier: email },
    });

    return NextResponse.json({ success: true, message: "邮箱绑定成功" });
  } catch (error) {
    console.error("Verify email error:", error);
    return NextResponse.json({ error: "验证失败" }, { status: 500 });
  }
}
```

---

## 第四步：Vercel 部署配置

### 环境变量配置

在 Vercel 项目设置中添加以下环境变量：

**必需环境变量：**
```bash
# 数据库连接
DATABASE_URL=postgresql://username:password@host:port/database

# NextAuth 配置
NEXTAUTH_URL=https://your-project.vercel.app
NEXTAUTH_SECRET=your-secret-key-here

# Resend 邮件服务
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx

# 应用配置
NEXT_PUBLIC_APP_NAME=山信二手平台
```

### 获取 RESEND_API_KEY 步骤

1. 访问 https://resend.com/api-keys
2. 登录/注册账号
3. 点击 "Create API Key"
4. 选择 "Full Access" 权限
5. 复制 API Key 到 Vercel 环境变量

### 配置发件域名

1. 访问 Resend 控制台 https://resend.com/domains
2. 添加域名（或使用默认的 resend.dev 域名进行测试）
3. 按指引配置 DNS 记录（MX, SPF, DKIM）
4. 等待 DNS 生效（通常几分钟到几小时）

---

## 第五步：本地测试

### 1. 配置本地环境变量

文件：`.env.local`

```bash
# 本地开发使用 Resend 测试域名
RESEND_API_KEY=re_test_xxxxxxxxxxxxxxxxxxxxxxxx

# 本地调试
NEXTAUTH_URL=http://localhost:3017
NEXTAUTH_SECRET=your-local-secret-key
```

### 2. 测试流程

**忘记密码流程：**
1. 访问 `/forgot-password`
2. 输入注册邮箱
3. 点击 "发送重置邮件"
4. 检查邮箱是否收到重置链接
5. 点击链接访问 `/reset-password`
6. 输入新密码并提交
7. 验证是否能用新密码登录

**邮箱验证流程：**
1. 访问 `/profile/account-security`
2. 点击 "绑定邮箱"
3. 输入邮箱地址
4. 点击 "发送验证码"
5. 检查邮箱是否收到验证码
6. 输入验证码
7. 点击 "确认绑定"
8. 验证邮箱是否显示为"已验证"状态

---

## 第六步：常见问题排查

### 问题 1：邮件发送失败

**错误信息：** `Failed to send email`

**排查步骤：**
1. 检查 `RESEND_API_KEY` 是否正确配置
2. 确认域名已通过 Resend 验证
3. 查看 Vercel 函数日志：Vercel Dashboard > Functions > Logs
4. 本地开发时使用测试 API Key

### 问题 2：重置链接打不开

**可能原因：**
- `NEXTAUTH_URL` 配置错误
- Token 已过期（1 小时有效期）
- Token 已被使用

**解决方案：**
1. 确认 `NEXTAUTH_URL` 与访问域名一致
2. 重新发送重置邮件
3. 检查 `PasswordResetToken` 表数据

### 问题 3：验证码收不到

**排查步骤：**
1. 检查垃圾邮件箱
2. 确认 Resend 域名配置正确
3. 查看 Resend 控制台邮件发送日志
4. 检查邮箱地址拼写

---

## 验收标准

### 功能验收
- [ ] 忘记密码可发送重置邮件
- [ ] 重置邮件链接有效
- [ ] 重置密码成功
- [ ] 个人主页可绑定邮箱
- [ ] 邮箱验证码可发送
- [ ] 邮箱验证成功

### 部署验收
- [ ] Vercel 环境变量配置正确
- [ ] Resend API Key 有效
- [ ] 生产环境邮件可发送
- [ ] 重置链接域名正确

---

## 预计工作量
- API 开发：1 小时
- 前端页面：1 小时
- Vercel 配置：0.5 小时
- 测试验证：0.5 小时
- **总计：3 小时**

## 依赖项
- Resend 邮件服务账号
- Vercel 项目部署权限

## 优先级
🔥 高优先级 - 基础功能

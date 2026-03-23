# 任务五：邮箱重置密码 + 邮箱认证

## 需求概述
邮箱重置密码和个人主页邮箱绑定。

## 已有功能
- `src/app/api/auth/forgot-password/route.ts` ✅
- `src/app/api/auth/reset-password/route.ts` ✅
- `src/lib/email.ts` (Resend) ✅

## 待开发 API
| 路由 | 方法 | 功能 |
|------|------|------|
| /api/auth/send-verification-code | POST | 发送验证码 |
| /api/profile/verify-email | POST | 验证绑定邮箱 |

## 前端变更
- `src/app/profile/account-security/page.tsx` - 添加邮箱绑定功能
- `src/app/register/page.tsx` - 注册页添加限时免认证提醒

## 注册页提醒横幅
位置：注册表单顶部
```tsx
<div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
  <div className="flex items-start gap-3">
    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <div>
      <h4 className="font-medium text-green-900">限时免认证注册</h4>
      <p className="text-sm text-green-700 mt-1">
        当前暂无安全风险，可跳过邮箱验证快速注册。建议尽快完成认证以保障账号安全。
      </p>
    </div>
  </div>
</div>
```

## Vercel 环境变量
```bash
RESEND_API_KEY=re_xxxx
NEXTAUTH_URL=https://www.sxhh.online
DATABASE_URL=postgresql://...
```

## 验收标准
- [ ] 忘记密码可发送邮件
- [ ] 重置密码成功
- [ ] 个人主页可绑定邮箱
- [ ] 验证码可发送验证

## 预计工作量：3 小时

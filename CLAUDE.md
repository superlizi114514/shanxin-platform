# 山信二手平台 - 开发文档

## 项目信息

- **GitHub**: https://github.com/superlizi114514/shanxin-platform
- **生产环境**: https://www.sxhh.online
- **技术栈**: Next.js 16, Prisma, PostgreSQL, NextAuth, TailwindCSS

## 开发流程

1. 本地开发完成后推送到 GitHub
2. Vercel 自动部署到生产环境

## 数据库

- **提供商**: Neon PostgreSQL
- **Prisma Schema**: `prisma/schema.prisma`

## 常见问题

### 手机号格式

注册时手机号支持空格格式：`138 8888 8888`

### 登录验证码

连续失败 3 次后自动显示验证码

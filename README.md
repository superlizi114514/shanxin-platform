# 山信二手平台

山东信息职业技术学院二手交易平台与校园工具集成。

## 功能特性

- 🛒 二手商品交易
- 📚 信息大全（学习资源、生活服务、就业信息）
- 🗺️ 校园地图与教室导航
- 📅 课表导入与管理
- 💬 商家点评系统
- 📰 校园新闻与公告
- 👤 个人中心与订单管理

## 环境配置

### 必需的环境变量

复制 `.env.example` 为 `.env.local` 并配置以下变量：

```bash
# 数据库 (本地开发使用 SQLite)
DATABASE_URL="file:./dev.db"

# NextAuth 认证
AUTH_SECRET="生成方法：openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"

# 高德地图 API（校园地图功能）
# 获取：https://lbs.amap.com/dev/key/app
NEXT_PUBLIC_AMAP_KEY="你的 API Key"
NEXT_PUBLIC_AMAP_SECURITY_CODE="你的安全密钥"
```

详细的高德地图配置指南请参考：[docs/AMAP_SETUP.md](docs/AMAP_SETUP.md)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

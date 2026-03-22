import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import MonitoringProvider from "@/components/MonitoringProvider";

// 使用系统字体栈替代 Google Fonts，优化国内访问速度
// 系统字体栈无需网络请求，加载更快，避免 Google Fonts 被墙问题
const systemFonts = `
  :root {
    --font-geist-sans: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
    --font-geist-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
  }
`;

export const metadata: Metadata = {
  title: {
    default: "山信二手平台 - 山东信息职业技术学院",
    template: "%s | 山信二手平台",
  },
  description: "山东信息职业技术学院学生专属的二手物品交易平台，提供二手交易、商家点评、订单管理、即时聊天等服务",
  keywords: ["二手平台", "山东信息职业技术学院", "校园二手", "学生交易", "山信", "二手交易", "校园文化"],
  authors: [{ name: "山信二手平台团队" }],
  creator: "山信二手平台",
  publisher: "山东信息职业技术学院",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: "/",
    title: "山信二手平台 - 山东信息职业技术学院",
    description: "山东信息职业技术学院学生专属的二手物品交易平台",
    siteName: "山信二手平台",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "山信二手平台",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "山信二手平台",
    description: "山东信息职业技术学院学生专属的二手物品交易平台",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  verification: {
    // Add verification codes here when needed
    // google: '',
    // yandex: '',
    // yahoo: '',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <style dangerouslySetInnerHTML={{ __html: systemFonts }} />
      </head>
      <body
        className="antialiased"
      >
        <MonitoringProvider>
          <AuthProvider>{children}</AuthProvider>
        </MonitoringProvider>
      </body>
    </html>
  );
}

"use client";

import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import Link from "next/link";

// Station data for the four main features
const stations = [
  {
    id: "secondhand",
    name: "二手平台",
    description: "校内学生专属的二手物品交易平台",
    icon: "🛒",
    href: "/products",
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "schedule",
    name: "个人课表",
    description: "查看课程安排，教室位置一键导航",
    icon: "📅",
    href: "/schedule",
    color: "from-green-500 to-green-600",
  },
  {
    id: "merchants",
    name: "商家点评",
    description: "学校周边商家评价与排行榜",
    icon: "🍽️",
    href: "/merchants",
    color: "from-orange-500 to-orange-600",
  },
  {
    id: "news",
    name: "学校新闻",
    description: "获取校园最新动态与通知公告",
    icon: "📰",
    href: "/news",
    color: "from-purple-500 to-purple-600",
  },
];

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">山信</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  山东信息职业技术学院总站
                </h1>
                <p className="text-sm text-gray-500">校园数字化服务统一门户</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {status === "loading" ? (
                <div className="text-gray-500">加载中...</div>
              ) : session ? (
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {session.user?.name || "用户"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {session.user?.email}
                    </div>
                  </div>
                  {session.user?.avatar && (
                    <img
                      src={session.user.avatar}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full border-2 border-blue-600"
                    />
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-gray-700 hover:text-red-600 text-sm font-medium"
                  >
                    退出登录
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/login"
                    className="text-gray-700 hover:text-blue-600 font-medium"
                  >
                    登录
                  </Link>
                  <Link
                    href="/register"
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 font-medium"
                  >
                    注册
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            欢迎来到校园门户平台
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            一站式校园服务入口，集成二手交易、课程管理、商家点评、新闻资讯四大核心功能
          </p>
        </div>

        {/* Station Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stations.map((station) => (
            <Link
              key={station.id}
              href={station.href}
              className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${station.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

              {/* Content */}
              <div className="relative p-6 text-center">
                {/* Icon */}
                <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {station.icon}
                </div>

                {/* Name */}
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-white transition-colors duration-300">
                  {station.name}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 group-hover:text-white/90 transition-colors duration-300">
                  {station.description}
                </p>

                {/* Arrow Icon */}
                <div className="mt-4 flex justify-center">
                  <svg
                    className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <h3 className="text-xl font-bold text-gray-900 text-center mb-8">
            平台特色
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-7 h-7 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">校内专属</h4>
              <p className="text-sm text-gray-600">
                仅限山东信息职业技术学院师生使用，实名认证更可靠
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-7 h-7 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                  />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">数据互通</h4>
              <p className="text-sm text-gray-600">
                一次登录访问所有服务，用户数据各分站共享
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-7 h-7 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">便捷高效</h4>
              <p className="text-sm text-gray-600">
                简洁易用的界面设计，快速找到所需服务
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-400">
            <p className="font-medium">© 2026 山东信息职业技术学院总站门户平台</p>
            <p className="text-sm mt-2">
              地址：山东省潍坊市高新区樱前街 2222 号
            </p>
            <p className="text-xs mt-4 text-gray-600">
              技术支持 | 联系我们 | 使用帮助
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

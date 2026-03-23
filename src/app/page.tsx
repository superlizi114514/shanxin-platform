"use client";

import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import NotificationBell from "@/components/NotificationBell";
import MobileNavbar from "@/components/MobileNavbar";

// Station data for the features
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
    id: "map",
    name: "校园地图",
    description: "校园建筑位置、距离计算、步行导航",
    icon: "🗺️",
    href: "/map",
    color: "from-teal-500 to-teal-600",
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
  {
    id: "guide",
    name: "信息大全",
    description: "学习资源、生活服务、就业信息、社团组织",
    icon: "📚",
    href: "/guide",
    color: "from-cyan-500 to-cyan-600",
  },
];

export default function Home() {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === "admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />

      {/* Desktop Header - Hidden on mobile */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300 group-hover:scale-105">
                <span className="text-white font-bold text-xl">山信</span>
              </div>
              <div className="hidden lg:block">
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  山东信息职业技术学院
                </h1>
                <p className="text-xs text-gray-500 font-medium">校园数字化服务统一门户</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {status === "loading" ? (
                <div className="text-gray-500">加载中...</div>
              ) : session ? (
                <div className="flex items-center space-x-4">
                  <NotificationBell />
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      管理后台
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {session.user?.avatar ? (
                      <img
                        src={session.user.avatar}
                        alt="Avatar"
                        className="w-8 h-8 rounded-full border border-gray-200"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-medium">
                        {session.user?.name?.[0]?.toUpperCase() || session.user?.email?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-700 hidden lg:block">
                      {session.user?.name || session.user?.email}
                    </span>
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-gray-700 hover:text-red-600 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    退出
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/login"
                    className="text-gray-700 hover:text-blue-600 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-all"
                  >
                    登录
                  </Link>
                  <Link
                    href="/register"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium shadow-md hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
                  >
                    注册
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <MobileNavbar isAdmin={isAdmin} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 pt-6 md:py-12">
        {/* Welcome Section */}
        <div className="text-center mb-8 md:mb-16 relative">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full opacity-10 blur-3xl animate-pulse" />
          </div>
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3 md:mb-4">
              欢迎来到校园门户平台
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed px-2">
              一站式校园服务入口，集成<span className="font-semibold text-blue-600">二手交易</span>、<span className="font-semibold text-green-600">课程管理</span>、<span className="font-semibold text-teal-600">校园地图</span>、<span className="font-semibold text-purple-600">商家点评</span>、<span className="font-semibold text-pink-600">新闻资讯</span>、<span className="font-semibold text-cyan-600">信息大全</span>六大核心功能
            </p>
          </div>
        </div>

        {/* Station Cards - Mobile optimized grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-8 md:mb-12">
          {stations.map((station) => (
            <Link
              key={station.id}
              href={station.href}
              className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 sm:hover:translate-y-2 hover:scale-[1.02] border border-white/20 active:scale-95 touch-manipulation"
            >
              {/* Animated Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${station.color} opacity-0 group-hover:opacity-100 transition-all duration-500`} />

              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

              {/* Content */}
              <div className="relative p-3 sm:p-4 md:p-6 lg:p-8 text-center">
                {/* Icon with glow effect - smaller on mobile */}
                <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-3 sm:mb-4 md:mb-5 transform group-hover:scale-125 group-hover:rotate-6 transition-all duration-500 drop-shadow-lg">
                  {station.icon}
                </div>

                {/* Name - responsive font sizes */}
                <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 mb-2 md:mb-3 group-hover:text-white transition-colors duration-300">
                  {station.name}
                </h3>

                {/* Description - hidden on smallest screens, smaller text on mobile */}
                <p className="hidden xs:block text-xs sm:text-sm text-gray-600 group-hover:text-white/95 transition-colors duration-300 leading-relaxed">
                  {station.description}
                </p>

                {/* Arrow Icon - smaller on mobile */}
                <div className="mt-3 sm:mt-4 md:mt-5 flex justify-center">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-gray-100 group-hover:bg-white/30 flex items-center justify-center transform group-hover:translate-x-1 transition-all duration-300">
                    <svg
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-400 group-hover:text-white transition-colors duration-300"
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
              </div>

              {/* Corner decoration */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-white/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </Link>
          ))}
        </div>

        {/* Quick Stats - Mobile optimized */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 border border-white/30">
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent text-center mb-6 sm:mb-8 md:mb-10">
            平台特色
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <div className="text-center group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-5 shadow-lg group-hover:shadow-xl group-hover:shadow-blue-500/30 transform group-hover:scale-110 transition-all duration-300">
                <svg
                  className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white"
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
              <h4 className="font-bold text-base sm:text-lg text-gray-900 mb-2 sm:mb-3">校内专属</h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                仅限山东信息职业技术学院师生使用，实名认证更可靠
              </p>
            </div>
            <div className="text-center group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-5 shadow-lg group-hover:shadow-xl group-hover:shadow-green-500/30 transform group-hover:scale-110 transition-all duration-300">
                <svg
                  className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white"
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
              <h4 className="font-bold text-base sm:text-lg text-gray-900 mb-2 sm:mb-3">数据互通</h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                一次登录访问所有服务，用户数据各分站共享
              </p>
            </div>
            <div className="text-center group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-5 shadow-lg group-hover:shadow-xl group-hover:shadow-purple-500/30 transform group-hover:scale-110 transition-all duration-300">
                <svg
                  className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white"
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
              <h4 className="font-bold text-base sm:text-lg text-gray-900 mb-2 sm:mb-3">便捷高效</h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                简洁易用的界面设计，快速找到所需服务
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 via-slate-900 to-gray-900 mt-12 md:mt-20 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4 md:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-base sm:text-lg">山信</span>
              </div>
              <p className="text-base md:text-lg font-bold text-white">山东信息职业技术学院总站</p>
            </div>
            <p className="text-sm md:text-base text-gray-400 font-medium">© 2026 山东信息职业技术学院总站门户平台</p>
            <p className="text-xs md:text-sm text-gray-500 mt-2 md:mt-3 px-4">
              地址：山东省潍坊市高新区樱前街 2222 号
            </p>
            <div className="flex justify-center flex-wrap gap-x-4 md:gap-x-6 gap-y-2 mt-4 md:mt-6">
              <a href="#" className="text-xs sm:text-sm text-gray-500 hover:text-gray-300 transition-colors">技术支持</a>
              <span className="text-gray-700 hidden sm:inline">|</span>
              <a href="#" className="text-xs sm:text-sm text-gray-500 hover:text-gray-300 transition-colors">联系我们</a>
              <span className="text-gray-700 hidden sm:inline">|</span>
              <a href="#" className="text-xs sm:text-sm text-gray-500 hover:text-gray-300 transition-colors">使用帮助</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

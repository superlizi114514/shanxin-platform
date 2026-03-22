"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

interface MobileNavbarProps {
  isAdmin?: boolean;
}

export default function MobileNavbar({ isAdmin }: MobileNavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isBottomNavVisible, setIsBottomNavVisible] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // 检测移动端的媒体查询
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsBottomNavVisible(e.matches);
      if (!e.matches) {
        setIsOpen(false);
      }
    };

    // 初始化
    setIsBottomNavVisible(mediaQuery.matches);

    mediaQuery.addEventListener("change", handleMediaChange);
    return () => mediaQuery.removeEventListener("change", handleMediaChange);
  }, []);

  // 阻止背景滚动当菜单打开时
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const navItems = [
    { href: "/", label: "首页", icon: HomeIcon },
    { href: "/products", label: "二手市场", icon: ShoppingCartIcon },
    { href: "/schedule", label: "课表", icon: CalendarIcon },
    { href: "/map", label: "地图", icon: MapIcon },
    { href: "/merchants", label: "商家", icon: RestaurantIcon },
    { href: "/news", label: "新闻", icon: NewpaperIcon },
    { href: "/guide", label: "信息", icon: BookIcon },
  ];

  const bottomNavItems = [
    { href: "/products", label: "市场", icon: ShoppingCartIcon },
    { href: "/schedule", label: "课表", icon: CalendarIcon },
    { href: "/map", label: "地图", icon: MapIcon },
    { href: "/merchants", label: "商家", icon: RestaurantIcon },
    { href: "/guide", label: "信息", icon: BookIcon },
  ];

  return (
    <>
      {/* Mobile Header - Only visible on mobile */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-gray-200/50 shadow-sm md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-base">山信</span>
            </div>
            <span className="text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              校园门户
            </span>
          </Link>

          <div className="flex items-center space-x-2">
            {session && (
              <Link
                href="/notifications"
                className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <BellIcon className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </Link>
            )}

            <button
              onClick={() => setIsOpen(true)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="打开菜单"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-over Menu */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Slide-over Panel */}
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white shadow-2xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">山信</span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">菜单</h2>
                    <p className="text-xs text-gray-500">校园服务门户</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="关闭菜单"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>

              {/* User Info */}
              {session ? (
                <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <div className="flex items-center space-x-3">
                    {session.user?.avatar ? (
                      <img
                        src={session.user.avatar}
                        alt="Avatar"
                        className="w-12 h-12 rounded-full border-2 border-white shadow-md"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-lg font-bold">
                        {session.user?.name?.[0]?.toUpperCase() || session.user?.email?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {session.user?.name || "用户"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Link
                      href="/profile"
                      className="flex-1 text-center text-sm font-medium text-blue-600 bg-white px-3 py-2 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
                    >
                      个人中心
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="flex-1 text-center text-sm font-medium text-red-600 bg-white px-3 py-2 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                      >
                        管理后台
                      </Link>
                    )}
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex-1 text-center text-sm font-medium text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      退出
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <div className="flex gap-2">
                    <Link
                      href="/login"
                      className="flex-1 text-center text-sm font-medium text-gray-700 bg-white px-4 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      登录
                    </Link>
                    <Link
                      href="/register"
                      className="flex-1 text-center text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
                    >
                      注册
                    </Link>
                  </div>
                </div>
              )}

              {/* Navigation Items */}
              <nav className="flex-1 overflow-y-auto px-4 py-4">
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                          isActive
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-500"}`} />
                        <span className="text-sm font-medium">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {session && (
                  <>
                    <div className="border-t border-gray-100 my-4" />
                    <div className="space-y-1">
                      <Link
                        href="/collections"
                        className="flex items-center space-x-3 px-4 py-3.5 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <BookmarkIcon className="w-5 h-5 text-gray-500" />
                        <span className="text-sm font-medium">我的收藏</span>
                      </Link>
                      <Link
                        href="/orders"
                        className="flex items-center space-x-3 px-4 py-3.5 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <PackageIcon className="w-5 h-5 text-gray-500" />
                        <span className="text-sm font-medium">订单管理</span>
                      </Link>
                      <Link
                        href="/messages"
                        className="flex items-center space-x-3 px-4 py-3.5 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <ChatIcon className="w-5 h-5 text-gray-500" />
                        <span className="text-sm font-medium">消息</span>
                      </Link>
                    </div>
                  </>
                )}
              </nav>

              {/* Footer */}
              <div className="px-4 py-4 border-t border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-500 text-center">
                  © 2026 山东信息职业技术学院
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      {isBottomNavVisible && session && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-200 shadow-lg md:hidden safe-area-pb">
          <div className="flex items-center justify-around py-2">
            {bottomNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 min-w-[64px] ${
                    isActive
                      ? "text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <div className={`relative ${isActive ? "transform scale-110" : ""} transition-transform`}>
                    <item.icon className="w-6 h-6" />
                    {isActive && (
                      <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
                    )}
                  </div>
                  <span className={`text-[10px] mt-1 font-medium ${isActive ? "text-blue-600" : "text-gray-500"}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      {/* Bottom padding for mobile when bottom nav is visible */}
      {isBottomNavVisible && session && <div className="h-20 md:hidden" />}
    </>
  );
}

// Icons
function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function ShoppingCartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function MapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  );
}

function RestaurantIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function NewpaperIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

function PackageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Store,
  Newspaper,
  BookOpen,
  Star,
  BarChart3,
  Settings,
} from 'lucide-react'

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const menuItems = [
  { name: '仪表板', href: '/admin', icon: LayoutDashboard },
  { name: '用户管理', href: '/admin/users', icon: Users },
  { name: '商家管理', href: '/admin/merchants', icon: Store },
  { name: '新闻管理', href: '/admin/news', icon: Newspaper },
  { name: '信息大全', href: '/admin/guide', icon: BookOpen },
  { name: '点评管理', href: '/admin/reviews', icon: Star },
  { name: '数据统计', href: '/admin/reports', icon: BarChart3 },
  { name: '系统设置', href: '/admin/settings', icon: Settings },
]

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()

  const handleNavClick = () => {
    if (onMobileClose) {
      onMobileClose()
    }
  }

  return (
    <>
      {/* 移动端遮罩层 */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onMobileClose}
      />

      {/* 侧边栏 */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-slate-900 text-white z-50
          transform transition-transform duration-300 ease-in-out
          md:translate-x-0 md:static md:z-auto
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-700">
          <h1 className="text-xl font-bold">后台管理</h1>
        </div>

        {/* 导航菜单 */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

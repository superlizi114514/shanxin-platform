'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/admin/Sidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleMenuClick = () => {
    setMobileOpen(!mobileOpen)
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* 左侧导航栏 */}
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      {/* 右侧内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部 Header */}
        <AdminHeader onMenuClick={handleMenuClick} />

        {/* 主内容区 */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

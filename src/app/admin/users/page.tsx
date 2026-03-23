"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  Shield,
  UserCheck,
  Mail,
  Phone,
  GraduationCap,
  MoreVertical,
  Edit2,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: string;
  studentId: string | null;
  school: string | null;
  major: string | null;
  class: string | null;
  phone: string | null;
  emailVerified: Date | null;
  createdAt: string;
  _count: {
    products: number;
    buyerOrders: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState({
    role: "user",
    emailVerified: false,
  });

  useEffect(() => {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    if (session.user.role !== "admin") {
      router.push("/");
      return;
    }

    fetchUsers();
  }, [session, router]);

  const fetchUsers = async (page = 1, searchQuery = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (data.users) {
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    const timeout = setTimeout(() => {
      fetchUsers(1, value);
    }, 500);
    setSearchTimeout(timeout);
  };

  const handleOpenUserModal = (user: User) => {
    setSelectedUser(user);
    setUserFormData({
      role: user.role,
      emailVerified: !!user.emailVerified,
    });
    setShowUserModal(true);
  };

  const handleCloseUserModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedUser.id,
          role: userFormData.role,
          emailVerified: userFormData.emailVerified,
        }),
      });

      if (response.ok) {
        await fetchUsers(pagination?.page || 1, search);
        handleCloseUserModal();
        alert("用户信息已更新");
      } else {
        const data = await response.json();
        alert(data.error || "操作失败");
      }
    } catch (error) {
      console.error("Failed to update user:", error);
      alert("操作失败，请重试");
    }
  };

  const handleToggleRole = async (user: User) => {
    if (!confirm(`确定要将 ${user.name || user.email} ${user.role === "admin" ? "降级为" : "提升为"}${user.role === "admin" ? "普通用户" : "管理员"}吗？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          role: user.role === "admin" ? "user" : "admin",
        }),
      });

      if (response.ok) {
        await fetchUsers(pagination?.page || 1, search);
        alert("用户角色已更新");
      } else {
        const data = await response.json();
        alert(data.error || "操作失败");
      }
    } catch (error) {
      console.error("Failed to update user role:", error);
      alert("操作失败，请重试");
    }
  };

  const handleToggleEmailVerified = async (user: User) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          emailVerified: !user.emailVerified,
        }),
      });

      if (response.ok) {
        await fetchUsers(pagination?.page || 1, search);
        alert("邮箱验证状态已更新");
      } else {
        const data = await response.json();
        alert(data.error || "操作失败");
      }
    } catch (error) {
      console.error("Failed to update email verification:", error);
      alert("操作失败，请重试");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer group"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-medium">返回总站</span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full text-sm font-medium">
                <Shield className="w-4 h-4" />
                管理员
              </div>
              {session?.user?.name && (
                <span className="text-sm text-slate-600 hidden sm:block">{session.user.name}</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">用户管理</h2>
              <p className="text-slate-600 text-sm">管理系统用户账号和权限</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索用户（昵称、邮箱、学号）..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats */}
        {pagination && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">总用户数</p>
                  <p className="text-2xl font-bold text-blue-600">{pagination.total.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">管理员数</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {users.filter(u => u.role === "admin").length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">当前页</p>
                  <p className="text-2xl font-bold text-green-600">{pagination.page} / {pagination.totalPages}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <MoreVertical className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-slate-50 to-blue-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">用户</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">联系方式</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">学籍信息</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">角色</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">活动</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-4 text-slate-600">加载中...</p>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-600">
                      暂无用户数据
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.name || ""} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              (user.name || user.email || "U").charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{user.name || "未设置昵称"}</p>
                            <p className="text-sm text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {user.phone && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Phone className="w-4 h-4 text-slate-400" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {user.studentId && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <GraduationCap className="w-4 h-4 text-slate-400" />
                              {user.studentId}
                            </div>
                          )}
                          {user.school && (
                            <p className="text-sm text-slate-500">{user.school}</p>
                          )}
                          {user.major && (
                            <p className="text-xs text-slate-400">{user.major} · {user.class}班</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.role === "admin"
                            ? "bg-red-100 text-red-800"
                            : "bg-slate-100 text-slate-800"
                        }`}>
                          <Shield className="w-3 h-3" />
                          {user.role === "admin" ? "管理员" : "普通用户"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            user.emailVerified
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {user.emailVerified ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {user.emailVerified ? "已验证" : "未验证"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-500">
                          <p>商品：{user._count.products}</p>
                          <p>订单：{user._count.buyerOrders}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenUserModal(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="编辑用户"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleRole(user)}
                            className={`p-2 rounded-lg transition-colors ${
                              user.role === "admin"
                                ? "text-red-600 hover:bg-red-50"
                                : "text-green-600 hover:bg-green-50"
                            }`}
                            title={user.role === "admin" ? "降级为普通用户" : "提升为管理员"}
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleEmailVerified(user)}
                            className={`p-2 rounded-lg transition-colors ${
                              user.emailVerified
                                ? "text-yellow-600 hover:bg-yellow-50"
                                : "text-green-600 hover:bg-green-50"
                            }`}
                            title={user.emailVerified ? "标记为未验证" : "标记为已验证"}
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-slate-600">
                显示 {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} 共 {pagination.total} 条
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchUsers(pagination.page - 1, search)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  上一页
                </button>
                <button
                  onClick={() => fetchUsers(pagination.page + 1, search)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* User Edit Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-900">编辑用户</h2>
                <p className="text-sm text-slate-500">{selectedUser.email}</p>
              </div>
              <button
                onClick={handleCloseUserModal}
                className="text-slate-400 hover:text-slate-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  用户角色
                </label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">普通用户</option>
                  <option value="admin">管理员</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg bg-slate-50">
                  <input
                    type="checkbox"
                    checked={userFormData.emailVerified}
                    onChange={(e) => setUserFormData({ ...userFormData, emailVerified: e.target.checked })}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <p className="font-medium text-slate-900">邮箱已验证</p>
                    <p className="text-sm text-slate-500">标记用户邮箱为已验证状态</p>
                  </div>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseUserModal}
                  className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  保存修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

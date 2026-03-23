"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Shield,
  Save,
  X,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface UserData {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  studentId: string | null;
  school: string | null;
  major: string | null;
  class: string | null;
}

interface FormState {
  name: string;
  phone: string;
  role: "user" | "admin";
  status: "active" | "banned";
}

interface FormErrors {
  name?: string;
  phone?: string;
  role?: string;
  status?: string;
}

export default function AdminUserEditPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [user, setUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState<FormState>({
    name: "",
    phone: "",
    role: "user",
    status: "active",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const userId = params.id as string;

  useEffect(() => {
    if (!session?.user || session.user.role !== "admin") {
      router.push("/login");
      return;
    }
    fetchUser();
  }, [session, router, userId]);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setUser(data.data);
        setFormData({
          name: data.data.name || "",
          phone: data.data.phone || "",
          role: data.data.role as "user" | "admin",
          status: data.data.disabled ? "banned" : "active",
        });
      } else {
        router.push("/admin/users");
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      router.push("/admin/users");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // 昵称验证
    if (formData.name && formData.name.length > 50) {
      newErrors.name = "昵称不能超过 50 个字符";
    }

    // 手机号验证
    if (formData.phone) {
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = "手机号格式不正确";
      }
    }

    // 角色验证
    if (!["user", "admin"].includes(formData.role)) {
      newErrors.role = "角色只能是 user 或 admin";
    }

    // 状态验证
    if (!["active", "banned"].includes(formData.status)) {
      newErrors.status = "状态只能是 active 或 banned";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name || null,
          phone: formData.phone || null,
          role: formData.role,
          status: formData.status,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          router.push(`/admin/users/${userId}`);
        }, 1500);
      } else {
        setErrors({ name: data.error || "更新失败" });
      }
    } catch (error) {
      console.error("Update failed:", error);
      setErrors({ name: "更新失败，请重试" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/admin/users/${userId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">用户不存在</h2>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            返回列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">编辑用户</h1>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* 成功提示 */}
          {showSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-medium">用户信息已更新，即将跳转...</span>
            </div>
          )}

          {/* 错误提示 */}
          {errors.name && !formData.name && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">{errors.name}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 昵称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                昵称
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="请输入昵称"
              />
              {errors.name && formData.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">最多 50 个字符</p>
            </div>

            {/* 邮箱 (只读) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                邮箱
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">邮箱地址不可修改</p>
            </div>

            {/* 手机号 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                手机号
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.phone ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="请输入手机号"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">11 位手机号码</p>
            </div>

            {/* 角色选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Shield className="w-4 h-4 inline mr-1" />
                角色
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 px-4 py-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="role"
                    value="user"
                    checked={formData.role === "user"}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as "user" | "admin" })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">普通用户</span>
                </label>
                <label className="flex items-center gap-2 px-4 py-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={formData.role === "admin"}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as "user" | "admin" })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">管理员</span>
                </label>
              </div>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role}</p>
              )}
            </div>

            {/* 状态选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                账号状态
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 px-4 py-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="status"
                    value="active"
                    checked={formData.status === "active"}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "banned" })}
                    className="text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">正常</span>
                </label>
                <label className="flex items-center gap-2 px-4 py-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="status"
                    value="banned"
                    checked={formData.status === "banned"}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "banned" })}
                    className="text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm font-medium text-gray-700">禁用</span>
                </label>
              </div>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status}</p>
              )}
            </div>

            {/* 学生信息 (只读) */}
            {user.studentId && (
              <div className="pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">学生信息</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">学号</p>
                    <p className="text-sm font-medium text-gray-900">{user.studentId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">校区</p>
                    <p className="text-sm font-medium text-gray-900">{user.school || "未设置"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">系</p>
                    <p className="text-sm font-medium text-gray-900">{user.major || "未设置"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">班级</p>
                    <p className="text-sm font-medium text-gray-900">{user.class || "未设置"}</p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-gray-500">学生信息由用户自行填写，管理员不可修改</p>
              </div>
            )}

            {/* 提交按钮 */}
            <div className="flex gap-4 pt-6 border-t">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {saving ? "保存中..." : "保存更改"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <X className="w-5 h-5" />
                取消
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

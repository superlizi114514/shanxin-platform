"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Store,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Upload,
  Trash2,
} from "lucide-react";

interface School {
  id: string;
  name: string;
  logo: string | null;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

interface Merchant {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  address: string | null;
  phone: string | null;
  verified: boolean;
  schoolId: string;
  categoryIds: string[];
}

interface FormState {
  name: string;
  description: string;
  logo: string;
  schoolId: string;
  address: string;
  phone: string;
  verified: boolean;
  categoryIds: string[];
}

interface FormErrors {
  name?: string;
  schoolId?: string;
}

export default function AdminMerchantEditPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [formData, setFormData] = useState<FormState>({
    name: "",
    description: "",
    logo: "",
    schoolId: "",
    address: "",
    phone: "",
    verified: false,
    categoryIds: [],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [schools, setSchools] = useState<School[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const merchantId = params.id as string;

  useEffect(() => {
    if (!session?.user || session.user.role !== "admin") {
      router.push("/login");
      return;
    }
    fetchMerchant();
    fetchSchools();
    fetchCategories();
  }, [session, router, merchantId]);

  const fetchMerchant = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/merchants/${merchantId}`);
      const data = await response.json();

      if (response.ok) {
        setMerchant(data);
        setFormData({
          name: data.name,
          description: data.description || "",
          logo: data.logo || "",
          schoolId: data.school?.id || "",
          address: data.address || "",
          phone: data.phone || "",
          verified: data.verified,
          categoryIds: data.categories?.map((c: Category) => c.id) || [],
        });
      } else {
        router.push("/admin/merchants");
      }
    } catch (error) {
      console.error("Failed to fetch merchant:", error);
      router.push("/admin/merchants");
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await fetch("/api/schools");
      const data = await response.json();
      if (data.schools) {
        setSchools(data.schools);
      }
    } catch (error) {
      console.error("Failed to fetch schools:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/merchants/categories");
      const data = await response.json();
      if (data.categories) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "商家名称不能为空";
    } else if (formData.name.length > 100) {
      newErrors.name = "商家名称不能超过 100 个字符";
    }

    if (!formData.schoolId) {
      newErrors.schoolId = "请选择所属学校";
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
      const response = await fetch(`/api/merchants/${merchantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          router.push(`/admin/merchants/${merchantId}`);
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
    router.push(`/admin/merchants/${merchantId}`);
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  };

  const handleImageRemove = () => {
    setFormData({ ...formData, logo: "" });
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

  if (!merchant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">商家不存在</h2>
          <Link
            href="/admin/merchants"
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
                <h1 className="text-2xl font-bold text-gray-900">编辑商家</h1>
                <p className="text-sm text-gray-500">{merchant.name}</p>
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
              <span className="text-green-800 font-medium">商家信息已更新，即将跳转...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                商家 Logo
              </label>
              <div className="flex items-start gap-4">
                {formData.logo ? (
                  <div className="relative w-32 h-32 rounded-lg bg-gray-100 overflow-hidden">
                    <Image
                      src={formData.logo}
                      alt="Logo preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleImageRemove}
                      className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Store className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="url"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入 Logo 图片 URL"
                  />
                  <p className="mt-1 text-xs text-gray-500">支持 JPG、PNG 格式的图片 URL</p>
                </div>
              </div>
            </div>

            {/* 商家名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Store className="w-4 h-4 inline mr-1" />
                商家名称 *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="请输入商家名称"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* 所属学校 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                所属学校 *
              </label>
              <select
                value={formData.schoolId}
                onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.schoolId ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">请选择学校</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
              {errors.schoolId && (
                <p className="mt-1 text-sm text-red-600">{errors.schoolId}</p>
              )}
            </div>

            {/* 商家分类 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                商家分类
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className={`flex items-center gap-2 px-3 py-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.categoryIds.includes(category.id)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.categoryIds.includes(category.id)}
                      onChange={() => handleCategoryToggle(category.id)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">{category.icon || "🏪"} {category.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 商家地址 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                商家地址
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入商家地址"
              />
            </div>

            {/* 联系电话 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                联系电话
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入联系电话"
              />
            </div>

            {/* 商家描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                商家描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入商家描述"
              />
            </div>

            {/* 认证状态 */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.verified}
                  onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">已认证商家</span>
              </label>
              <p className="mt-1 text-xs text-gray-500 ml-7">认证成功后商家将显示认证标识</p>
            </div>

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

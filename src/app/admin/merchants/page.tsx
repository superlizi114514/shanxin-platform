"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Merchant {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  rating: number;
  reviewCount: number;
  address: string | null;
  phone: string | null;
  verified: boolean;
  school: {
    id: string;
    name: string;
    logo: string | null;
  } | null;
  categories: {
    id: string;
    name: string;
    icon: string | null;
  }[];
  images: { id: string; url: string }[];
}

interface School {
  id: string;
  name: string;
  code: string;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

interface Claim {
  id: string;
  status: string;
  reason: string | null;
  rejectReason: string | null;
  createdAt: string;
  merchant: {
    id: string;
    name: string;
    school?: { name: string };
  };
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

export default function AdminMerchantsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"merchants" | "claims">("merchants");
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logo: "",
    schoolId: "",
    address: "",
    phone: "",
    verified: false,
    categoryIds: [] as string[],
  });
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [reviewReason, setReviewReason] = useState("");

  useEffect(() => {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    // Check if admin
    if (session.user.role !== "admin") {
      router.push("/");
      return;
    }

    fetchMerchants();
    fetchSchools();
    fetchCategories();
  }, [session, router]);

  useEffect(() => {
    if (activeTab === "claims") {
      fetchClaims();
    }
  }, [activeTab]);

  const fetchClaims = async () => {
    try {
      const response = await fetch("/api/merchants/claim");
      const data = await response.json();
      if (data.claims) {
        setClaims(data.claims);
      }
    } catch (error) {
      console.error("Failed to fetch claims:", error);
    }
  };

  const fetchMerchants = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/merchants?limit=100");
      const data = await response.json();
      if (data.merchants) {
        setMerchants(data.merchants);
      }
    } catch (error) {
      console.error("Failed to fetch merchants:", error);
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

  const handleOpenCreate = () => {
    setEditingMerchant(null);
    setFormData({
      name: "",
      description: "",
      logo: "",
      schoolId: "",
      address: "",
      phone: "",
      verified: false,
      categoryIds: [],
    });
    setShowModal(true);
  };

  const handleOpenEdit = (merchant: Merchant) => {
    setEditingMerchant(merchant);
    setFormData({
      name: merchant.name,
      description: merchant.description || "",
      logo: merchant.logo || "",
      schoolId: merchant.school?.id || "",
      address: merchant.address || "",
      phone: merchant.phone || "",
      verified: merchant.verified,
      categoryIds: merchant.categories.map((c) => c.id),
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMerchant(null);
  };

  const handleOpenClaimReview = (claim: Claim) => {
    setSelectedClaim(claim);
    setReviewReason("");
    setShowClaimModal(true);
  };

  const handleCloseClaimModal = () => {
    setShowClaimModal(false);
    setSelectedClaim(null);
    setReviewReason("");
  };

  const handleClaimReview = async (status: "approved" | "rejected") => {
    if (!selectedClaim) return;

    if (status === "rejected" && !reviewReason.trim()) {
      alert("请填写拒绝原因");
      return;
    }

    try {
      const response = await fetch(`/api/merchants/claim/${selectedClaim.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          rejectReason: status === "rejected" ? reviewReason : null,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(`认领申请已${status === "approved" ? "批准" : "拒绝"}`);
        handleCloseClaimModal();
        fetchClaims();
      } else {
        alert(data.error || "操作失败");
      }
    } catch (error) {
      console.error("Failed to review claim:", error);
      alert("操作失败，请重试");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingMerchant
        ? `/api/merchants/${editingMerchant.id}`
        : "/api/merchants";

      const method = editingMerchant ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchMerchants();
        handleCloseModal();
      } else {
        const data = await response.json();
        alert(data.error || "操作失败");
      }
    } catch (error) {
      console.error("Failed to save merchant:", error);
      alert("操作失败，请重试");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定要删除商家"${name}"吗？此操作不可恢复！`)) {
      return;
    }

    try {
      const response = await fetch(`/api/merchants/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchMerchants();
      } else {
        const data = await response.json();
        alert(data.error || "删除失败");
      }
    } catch (error) {
      console.error("Failed to delete merchant:", error);
      alert("删除失败，请重试");
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="text-lg font-medium text-blue-600 hover:text-blue-700">
              ← 返回总站
            </Link>
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">商家管理后台</h1>
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                管理员
              </span>
            </div>
          </div>
          {/* Tabs */}
          <div className="flex gap-4 mt-4 border-b">
            <button
              onClick={() => setActiveTab("merchants")}
              className={`pb-2 px-1 font-medium ${
                activeTab === "merchants"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              商家管理
            </button>
            <button
              onClick={() => setActiveTab("claims")}
              className={`pb-2 px-1 font-medium ${
                activeTab === "claims"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              认领审核
              {claims.filter((c) => c.status === "pending").length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {claims.filter((c) => c.status === "pending").length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Merchants Tab */}
        {activeTab === "merchants" && (
          <>
            {/* Actions */}
            <div className="mb-6 flex justify-between items-center">
              <p className="text-gray-600">
                共 <span className="font-medium text-gray-900">{merchants.length}</span> 个商家
              </p>
              <button
                onClick={handleOpenCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + 添加商家
              </button>
            </div>

            {/* Merchants Grid */}
            {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        ) : merchants.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">暂无商家数据</p>
            <button
              onClick={handleOpenCreate}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              添加第一个商家
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {merchants.map((merchant) => (
              <div
                key={merchant.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="aspect-video bg-gray-200 relative">
                  {merchant.logo ? (
                    <Image
                      src={merchant.logo}
                      alt={merchant.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      暂无 logo
                    </div>
                  )}
                  {merchant.verified && (
                    <span className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs">
                      已认证
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-lg text-gray-900">
                    {merchant.name}
                  </h3>
                  {merchant.school && (
                    <p className="text-sm text-gray-500 mt-1">
                      {merchant.school.name}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex text-yellow-400">
                      {"★".repeat(Math.floor(merchant.rating))}
                      {"☆".repeat(5 - Math.floor(merchant.rating))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {merchant.rating.toFixed(1)} ({merchant.reviewCount}条)
                    </span>
                  </div>
                  {merchant.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {merchant.categories.map((cat) => (
                        <span
                          key={cat.id}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                        >
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-4 flex gap-2">
        <Link
                      href={`/admin/merchants/${merchant.id}`}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white text-center rounded hover:bg-blue-700 text-sm"
                    >
                      详情
                    </Link>
                    <button
                      onClick={() => handleOpenEdit(merchant)}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(merchant.id, merchant.name)}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
      )}

      {/* Claims Tab */}
      {activeTab === "claims" && (
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">认领申请列表</h2>
            <p className="text-sm text-gray-500 mt-1">
              审核用户对商家的认领申请
            </p>
          </div>

          {claims.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-600">暂无认领申请</p>
            </div>
          ) : (
            <div className="space-y-4">
              {claims.map((claim) => (
                <div
                  key={claim.id}
                  className="bg-white rounded-lg shadow-md p-6"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-lg text-gray-900">
                        {claim.merchant.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        申请人：{claim.user.name || claim.user.email}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        申请理由：{claim.reason || "未填写"}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        申请时间：{new Date(claim.createdAt).toLocaleString("zh-CN")}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          claim.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : claim.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {claim.status === "pending"
                          ? "待审核"
                          : claim.status === "approved"
                          ? "已批准"
                          : "已拒绝"}
                      </span>
                      {claim.status === "pending" && (
                        <button
                          onClick={() => handleOpenClaimReview(claim)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          审核
                        </button>
                      )}
                    </div>
                  </div>
                  {claim.status === "rejected" && claim.rejectReason && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                      <p className="text-xs text-red-800">
                        拒绝原因：{claim.rejectReason}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {editingMerchant ? "编辑商家" : "添加商家"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  商家名称 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入商家名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  所属学校 *
                </label>
                <select
                  required
                  value={formData.schoolId}
                  onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择学校</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  商家分类
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {categories.map((cat) => (
                    <label
                      key={cat.id}
                      className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer ${
                        formData.categoryIds.includes(cat.id)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.categoryIds.includes(cat.id)}
                        onChange={() => handleCategoryToggle(cat.id)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{cat.icon || "🏪"} {cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  商家地址
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入商家地址"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  联系电话
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入联系电话"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo 图片 URL
                </label>
                <input
                  type="url"
                  value={formData.logo}
                  onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入 Logo 图片 URL"
                />
                {formData.logo && (
                  <div className="mt-2 w-32 h-32 border rounded overflow-hidden">
                    <Image
                      src={formData.logo}
                      alt="Preview"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  商家描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入商家描述"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.verified}
                    onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">已认证</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingMerchant ? "保存修改" : "创建商家"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Claim Review Modal */}
      {showClaimModal && selectedClaim && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">审核认领申请</h2>
              <p className="text-sm text-gray-500 mt-1">
                商家：{selectedClaim.merchant.name}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  申请人
                </label>
                <p className="text-gray-900">
                  {selectedClaim.user.name || selectedClaim.user.email}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  申请理由
                </label>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {selectedClaim.reason || "未填写"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  申请时间
                </label>
                <p className="text-gray-700">
                  {new Date(selectedClaim.createdAt).toLocaleString("zh-CN")}
                </p>
              </div>

              {selectedClaim.status === "pending" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    拒绝原因（仅拒绝时填写）
                  </label>
                  <textarea
                    value={reviewReason}
                    onChange={(e) => setReviewReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="如果拒绝申请，请说明原因..."
                  />
                </div>
              )}

              {selectedClaim.status === "rejected" && selectedClaim.rejectReason && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    拒绝原因
                  </label>
                  <p className="text-red-600 bg-red-50 p-3 rounded-lg">
                    {selectedClaim.rejectReason}
                  </p>
                </div>
              )}

              {selectedClaim.status === "pending" && (
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => handleClaimReview("rejected")}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    拒绝
                  </button>
                  <button
                    type="button"
                    onClick={() => handleClaimReview("approved")}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    批准
                  </button>
                </div>
              )}

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleCloseClaimModal}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

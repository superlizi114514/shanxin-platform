"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Store,
  MapPin,
  Phone,
  Star,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  AlertCircle,
  Calendar,
} from "lucide-react";

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
  createdAt: string;
  updatedAt: string;
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
  _count: {
    reviews: number;
    claims: number;
  };
}

export default function AdminMerchantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const merchantId = params.id as string;

  useEffect(() => {
    if (!session?.user || session.user.role !== "admin") {
      router.push("/login");
      return;
    }
    fetchMerchant();
  }, [session, router, merchantId]);

  const fetchMerchant = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/merchants/${merchantId}`);
      const data = await response.json();

      if (response.ok) {
        // Fetch additional stats
        const statsResponse = await fetch(`/api/admin/merchants/${merchantId}/stats`);
        const statsData = await statsResponse.json();

        setMerchant({
          ...data,
          _count: statsData.success ? statsData.data : { reviews: 0, claims: 0 },
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

  const handleDelete = async () => {
    if (!merchant) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/merchants/${merchantId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        alert("商家已删除");
        router.push("/admin/merchants");
      } else {
        alert(data.error || "删除失败");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert("删除失败，请重试");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
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
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/admin/merchants")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">商家详情</h1>
                <p className="text-sm text-gray-500">{merchant.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/merchants/${merchantId}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                编辑商家
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 基本信息卡片 */}
          <div className="md:col-span-2 space-y-6">
            {/* Logo 和基本信息 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start gap-6">
                <div className="w-32 h-32 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                  {merchant.logo ? (
                    <Image
                      src={merchant.logo}
                      alt={merchant.name}
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Store className="w-12 h-12" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{merchant.name}</h2>
                    {merchant.verified && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        已认证
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex text-yellow-400">
                      {"★".repeat(Math.floor(merchant.rating))}
                      {"☆".repeat(5 - Math.floor(merchant.rating))}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{merchant.rating.toFixed(1)}</span>
                    <span className="text-sm text-gray-500">({merchant.reviewCount}条评价)</span>
                  </div>
                  {merchant.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{merchant.description}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
                {merchant.school && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                      {merchant.school.logo ? (
                        <Image
                          src={merchant.school.logo}
                          alt={merchant.school.name}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Store className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">所属学校</p>
                      <p className="text-sm font-medium text-gray-900">{merchant.school.name}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">创建时间</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(merchant.createdAt).toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 联系信息 */}
            {(merchant.address || merchant.phone) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  联系信息
                </h3>
                <div className="space-y-4">
                  {merchant.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">地址</p>
                        <p className="text-sm font-medium text-gray-900">{merchant.address}</p>
                      </div>
                    </div>
                  )}
                  {merchant.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">联系电话</p>
                        <p className="text-sm font-medium text-gray-900">{merchant.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 分类标签 */}
            {merchant.categories.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Store className="w-5 h-5 text-blue-600" />
                  商家分类
                </h3>
                <div className="flex flex-wrap gap-2">
                  {merchant.categories.map((category) => (
                    <span
                      key={category.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm"
                    >
                      <span>{category.icon || "🏪"}</span>
                      <span>{category.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 商家图片 */}
            {merchant.images.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  商家图片
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {merchant.images.map((image) => (
                    <div key={image.id} className="aspect-square rounded-lg bg-gray-100 overflow-hidden">
                      <Image
                        src={image.url}
                        alt="商家图片"
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 右侧统计 */}
          <div className="space-y-6">
            {/* 统计数据 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                统计数据
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-medium text-gray-700">评价数量</span>
                  </div>
                  <span className="text-lg font-bold text-yellow-600">{merchant._count.reviews}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">认领申请</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{merchant._count.claims}</span>
                </div>
              </div>
            </div>

            {/* 状态卡片 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">商家状态</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">认证状态</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                    merchant.verified
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {merchant.verified ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        已认证
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        未认证
                      </>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">评分</span>
                  <span className="text-sm font-medium text-gray-900">{merchant.rating.toFixed(1)} / 5.0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">最后更新</span>
                  <span className="text-sm text-gray-500">
                    {new Date(merchant.updatedAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">快捷操作</h3>
              <div className="space-y-2">
                <Link
                  href={`/admin/merchants/${merchantId}/edit`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Edit2 className="w-4 h-4" />
                  编辑商家
                </Link>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleting}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  删除商家
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">确认删除</h3>
            </div>
            <p className="text-gray-600 mb-6">
              确定要删除商家 <span className="font-medium">{merchant.name}</span> 吗？此操作不可恢复。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {deleting ? "删除中..." : "确认删除"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

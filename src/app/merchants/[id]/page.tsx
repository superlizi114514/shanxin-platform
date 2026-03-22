"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import StarRating from "./star-rating";
import ReviewForm from "./review-form";

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
  claimedBy: string | null;
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

interface Review {
  id: string;
  content: string;
  rating: number;
  helpful: number;
  isHelpful?: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    avatar: string | null;
  } | null;
  images: { id: string; url: string }[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function MerchantDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [helpfulStates, setHelpfulStates] = useState<Record<string, { count: number; hasVoted: boolean }>>({});
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimData, setClaimData] = useState({ reason: "", proof: "" });
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [userClaim, setUserClaim] = useState<{ status: string; reason?: string; rejectReason?: string } | null>(null);

  const merchantId = params.id as string;

  const fetchMerchant = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/merchants/${merchantId}`);
      const data = await response.json();

      if (response.ok) {
        setMerchant(data);
      }
    } catch (error) {
      console.error("Failed to fetch merchant:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (page: number = 1) => {
    setReviewsLoading(true);
    try {
      const response = await fetch(
        `/api/merchants/${merchantId}/reviews?page=${page}&limit=10`
      );
      const data = await response.json();

      if (response.ok) {
        setReviews(data.reviews);
        setPagination(data.pagination);
        // Initialize helpful states with actual vote status from API
        const helpfulData: Record<string, { count: number; hasVoted: boolean }> = {};
        data.reviews.forEach((review: Review) => {
          helpfulData[review.id] = {
            count: review.helpful || 0,
            hasVoted: review.isHelpful || false
          };
        });
        setHelpfulStates(helpfulData);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleToggleHelpful = async (reviewId: string) => {
    if (!session?.user?.id) {
      alert("请先登录后点赞");
      return;
    }

    try {
      const response = await fetch(`/api/merchants/${merchantId}/reviews/${reviewId}/helpful`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setHelpfulStates((prev) => ({
          ...prev,
          [reviewId]: { count: data.helpful, hasVoted: data.isHelpful },
        }));
      }
    } catch (error) {
      console.error("Failed to toggle helpful:", error);
    }
  };

  useEffect(() => {
    if (merchantId) {
      fetchMerchant();
      fetchReviews();
      fetchUserClaim();
    }
  }, [merchantId]);

  const handlePageChange = (newPage: number) => {
    fetchReviews(newPage);
  };

  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    fetchMerchant();
    fetchReviews(1);
  };

  const fetchUserClaim = async () => {
    if (!session?.user?.id) return;
    try {
      const response = await fetch(`/api/merchants/claim?merchantId=${merchantId}`);
      const data = await response.json();
      if (data.claims && data.claims.length > 0) {
        setUserClaim(data.claims[0]);
      }
    } catch (error) {
      console.error("Failed to fetch user claim:", error);
    }
  };

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimData.reason.trim()) {
      alert("请填写申请理由");
      return;
    }
    setClaimSubmitting(true);
    try {
      const response = await fetch("/api/merchants/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId,
          reason: claimData.reason,
          proof: claimData.proof || null,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        alert("认领申请已提交，请等待管理员审核");
        setShowClaimModal(false);
        setClaimData({ reason: "", proof: "" });
        fetchUserClaim();
      } else {
        alert(data.error || "提交失败，请重试");
      }
    } catch (error) {
      console.error("Failed to submit claim:", error);
      alert("提交失败，请重试");
    } finally {
      setClaimSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <Link href="/merchants" className="text-lg font-medium text-blue-600 hover:text-blue-700">
                ← 返回
              </Link>
              <h1 className="text-xl font-bold text-gray-900">商家详情</h1>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-gray-600">商家不存在或已删除</p>
            <Link href="/merchants" className="mt-4 inline-block text-blue-600 hover:text-blue-700">
              返回商家列表
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/merchants" className="text-lg font-medium text-blue-600 hover:text-blue-700">
              ← 返回
            </Link>
            <h1 className="text-xl font-bold text-gray-900">商家详情</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Merchant Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Cover Image */}
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
                    暂无图片
                  </div>
                )}
                {merchant.verified && (
                  <span className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    ✓ 已认证
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {merchant.name}
                    </h2>
                    {merchant.school && (
                      <p className="text-gray-500 mt-1">
                        📍 {merchant.school.name}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <StarRating rating={merchant.rating} />
                      <span className="text-lg font-medium text-gray-900">
                        {merchant.rating.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {merchant.reviewCount} 条评价
                    </p>
                  </div>
                </div>

                {/* Categories */}
                {merchant.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {merchant.categories.map((category) => (
                      <span
                        key={category.id}
                        className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm"
                      >
                        {category.icon || "🏪"} {category.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Description */}
                {merchant.description && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700">{merchant.description}</p>
                  </div>
                )}

                {/* Contact Info */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {merchant.address && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <span>📍</span>
                      <span className="text-sm">{merchant.address}</span>
                    </div>
                  )}
                  {merchant.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <span>📞</span>
                      <span className="text-sm">{merchant.phone}</span>
                    </div>
                  )}
                </div>

                {/* Claim Button */}
                {!merchant.claimedBy && session?.user?.id && !userClaim && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowClaimModal(true)}
                      className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-medium"
                    >
                      📋 认领商家
                    </button>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      如果您是此商家的所有者，可以申请认领
                    </p>
                  </div>
                )}

                {/* Claim Status */}
                {userClaim && (
                  <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm font-medium text-yellow-800">
                      您的认领申请正在审核中
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      申请理由：{userClaim.reason || "未填写"}
                    </p>
                    {userClaim.status === "rejected" && userClaim.rejectReason && (
                      <p className="text-xs text-red-600 mt-2">
                        拒绝原因：{userClaim.rejectReason}
                      </p>
                    )}
                  </div>
                )}

                {/* Write Review Button */}
                {session?.user?.id ? (
                  <div className="mt-6">
                    {!showReviewForm ? (
                      <button
                        onClick={() => setShowReviewForm(true)}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
                      >
                        写评价
                      </button>
                    ) : (
                      <ReviewForm
                        merchantId={merchantId}
                        onSubmitSuccess={handleReviewSubmitted}
                        onCancel={() => setShowReviewForm(false)}
                      />
                    )}
                  </div>
                ) : (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
                    <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                      登录后可写评价
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                用户评价
              </h3>

              {reviewsLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : reviews.length === 0 ? (
                <p className="text-gray-500 text-center py-8">暂无评价</p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {reviews.map((review) => {
                    const helpfulState = helpfulStates[review.id] || { count: 0, hasVoted: false };
                    return (
                      <div
                        key={review.id}
                        className="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            {review.user?.avatar ? (
                              <Image
                                src={review.user.avatar}
                                alt={review.user.name || "用户"}
                                width={32}
                                height={32}
                                className="rounded-full"
                              />
                            ) : (
                              <span className="text-xs text-gray-500">
                                {review.user?.name?.charAt(0) || "用"}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {review.user?.name || "匿名用户"}
                            </p>
                            <StarRating rating={review.rating} size="sm" />
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm">{review.content}</p>

                        {/* Review Images */}
                        {review.images && review.images.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {review.images.map((image) => (
                              <div
                                key={image.id}
                                className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200"
                              >
                                <Image
                                  src={image.url}
                                  alt="评价图片"
                                  width={80}
                                  height={80}
                                  className="w-full h-full object-cover cursor-pointer hover:opacity-90"
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString("zh-CN")}
                          </span>
                          <button
                            onClick={() => handleToggleHelpful(review.id)}
                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                              helpfulState.hasVoted
                                ? "bg-blue-100 text-blue-600"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            <span>👍</span>
                            <span>有用 ({helpfulState.count})</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="mt-4 flex justify-center items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    上一页
                  </button>
                  <span className="text-sm text-gray-700">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    下一页
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gallery */}
        {merchant.images.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">商家图片</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {merchant.images.map((image) => (
                <div
                  key={image.id}
                  className="aspect-square bg-gray-200 rounded-lg overflow-hidden"
                >
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
      </main>

      {/* Claim Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">认领商家申请</h2>
              <p className="text-sm text-gray-500 mt-1">
                申请认领：{merchant.name}
              </p>
            </div>

            <form onSubmit={handleClaimSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  申请理由 *
                </label>
                <textarea
                  required
                  value={claimData.reason}
                  onChange={(e) => setClaimData({ ...claimData, reason: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请说明您是此商家的所有者或管理者的理由..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  证明材料 URL（可选）
                </label>
                <input
                  type="url"
                  value={claimData.proof}
                  onChange={(e) => setClaimData({ ...claimData, proof: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="营业执照、经营许可证等证明材料图片链接"
                />
                <p className="text-xs text-gray-500 mt-1">
                  提供证明材料可以加快审核速度
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowClaimModal(false);
                    setClaimData({ reason: "", proof: "" });
                  }}
                  disabled={claimSubmitting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={claimSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {claimSubmitting ? "提交中..." : "提交申请"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

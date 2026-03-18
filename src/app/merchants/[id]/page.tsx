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
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (merchantId) {
      fetchMerchant();
      fetchReviews();
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
                  {reviews.map((review) => (
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
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(review.createdAt).toLocaleDateString("zh-CN")}
                      </p>
                    </div>
                  ))}
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
    </div>
  );
}

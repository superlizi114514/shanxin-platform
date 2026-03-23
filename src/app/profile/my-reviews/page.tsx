"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface ProductReview {
  id: string;
  content: string;
  rating: number;
  createdAt: string;
  product: {
    id: string;
    title: string;
    images: { id: string; url: string }[];
  };
  images: { id: string; url: string }[];
}

interface MerchantReview {
  id: string;
  content: string;
  rating: number;
  createdAt: string;
  merchant: {
    id: string;
    name: string;
    logo: string | null;
    school: {
      id: string;
      name: string;
      logo: string | null;
    };
  };
  images: { id: string; url: string }[];
}

type TabType = "product" | "merchant";

export default function MyReviewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("product");
  const [productReviews, setProductReviews] = useState<ProductReview[]>([]);
  const [merchantReviews, setMerchantReviews] = useState<MerchantReview[]>([]);
  const [stats, setStats] = useState({ productReviews: 0, merchantReviews: 0 });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchReviews();
    }
  }, [status]);

  const fetchReviews = async () => {
    try {
      const response = await fetch("/api/reviews/my");
      if (response.ok) {
        const data = await response.json();
        setProductReviews(data.productReviews);
        setMerchantReviews(data.merchantReviews);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (id: string, type: "product" | "merchant") => {
    if (!confirm("确定要删除这条评价吗？")) return;

    try {
      const endpoint = type === "product"
        ? `/api/reviews/${id}`
        : `/api/merchant-reviews/${id}`;

      const response = await fetch(endpoint, {
        method: "DELETE",
      });

      if (response.ok) {
        if (type === "product") {
          setProductReviews(productReviews.filter((r) => r.id !== id));
        } else {
          setMerchantReviews(merchantReviews.filter((r) => r.id !== id));
        }
        alert("评价已删除");
      }
    } catch (error) {
      console.error("Failed to delete review:", error);
      alert("删除失败，请重试");
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "text-yellow-400" : "text-gray-300"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <Link
              href="/profile"
              className="flex items-center space-x-2 group"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-gray-700 font-medium">返回个人主页</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">我的评价</h1>
          <p className="text-gray-600 mt-1">管理您发表的评价</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 15H4L5 9z" />
                </svg>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">{stats.productReviews}</div>
                <div className="text-gray-600 text-sm mt-1">商品评价</div>
              </div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">{stats.merchantReviews}</div>
                <div className="text-gray-600 text-sm mt-1">商家评价</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-md mb-6 p-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("product")}
              className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                activeTab === "product"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              商品评价 ({stats.productReviews})
            </button>
            <button
              onClick={() => setActiveTab("merchant")}
              className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                activeTab === "merchant"
                  ? "bg-green-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              商家评价 ({stats.merchantReviews})
            </button>
          </div>
        </div>

        {/* Reviews List */}
        {activeTab === "product" ? (
          productReviews.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-md p-12 text-center">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
              <p className="text-gray-500 text-lg mb-4">
                还没有发表商品评价
              </p>
              <Link
                href="/products"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all"
              >
                去浏览商品
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {productReviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white/80 backdrop-blur-lg rounded-xl shadow-md p-6"
                >
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <Link
                      href={`/products/${review.product.id}`}
                      className="w-24 h-24 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0"
                    >
                      {review.product.images.length > 0 ? (
                        <Image
                          src={review.product.images[0].url}
                          alt={review.product.title}
                          width={96}
                          height={96}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </Link>

                    {/* Review Content */}
                    <div className="flex-1">
                      <Link href={`/products/${review.product.id}`}>
                        <h3 className="font-medium text-gray-900 hover:text-blue-600 transition-colors mb-2">
                          {review.product.title}
                        </h3>
                      </Link>
                      <div className="mb-2">{renderStars(review.rating)}</div>
                      <p className="text-gray-700 text-sm mb-2">{review.content}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString("zh-CN")}
                        </span>
                        <button
                          onClick={() => handleDeleteReview(review.id, "product")}
                          className="text-red-600 text-sm hover:text-red-700 flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          merchantReviews.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-md p-12 text-center">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <p className="text-gray-500 text-lg mb-4">
                还没有发表商家评价
              </p>
              <Link
                href="/merchants"
                className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md transition-all"
              >
                浏览商家
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {merchantReviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white/80 backdrop-blur-lg rounded-xl shadow-md p-6"
                >
                  <div className="flex gap-4">
                    {/* Merchant Logo */}
                    <div className="w-24 h-24 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                      {review.merchant.logo ? (
                        <Image
                          src={review.merchant.logo}
                          alt={review.merchant.name}
                          width={96}
                          height={96}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-green-100 text-green-600 font-bold text-xl">
                          {review.merchant.name[0]}
                        </div>
                      )}
                    </div>

                    {/* Review Content */}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-2">
                        {review.merchant.name}
                      </h3>
                      <p className="text-xs text-gray-500 mb-2">
                        📍 {review.merchant.school.name}
                      </p>
                      <div className="mb-2">{renderStars(review.rating)}</div>
                      <p className="text-gray-700 text-sm mb-2">{review.content}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString("zh-CN")}
                        </span>
                        <button
                          onClick={() => handleDeleteReview(review.id, "merchant")}
                          className="text-red-600 text-sm hover:text-red-700 flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>
    </div>
  );
}

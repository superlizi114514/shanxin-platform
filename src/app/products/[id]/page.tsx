"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  status: string;
  views: number;
  likes: number;
  createdAt: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  };
  images: { id: string; url: string }[];
  seller: {
    id: string;
    name: string;
    logo: string | null;
  } | null;
  reviews: {
    id: string;
    content: string;
    rating: number;
    createdAt: string;
    user: {
      id: string;
      name: string | null;
      avatar: string | null;
    };
    images: { id: string; url: string }[];
  }[];
}

const CATEGORY_MAP: Record<string, string> = {
  electronics: "电子产品",
  books: "书籍教材",
  clothing: "服饰鞋包",
  daily: "生活用品",
  sports: "运动户外",
  beauty: "美妆护肤",
  other: "其他",
};

const STATUS_MAP: Record<string, string> = {
  available: "可售中",
  sold: "已售出",
  reserved: "已预留",
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [isCollected, setIsCollected] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [contacting, setContacting] = useState(false);

  useEffect(() => {
    if (typeof params.id !== "string") return;

    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/products/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setProduct(data);
        } else {
          router.push("/products");
        }
      } catch (error) {
        console.error("Failed to fetch product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.id, router]);

  // 检查收藏状态
  useEffect(() => {
    if (!session?.user?.id || !params.id) return;

    const checkCollection = async () => {
      try {
        const response = await fetch(`/api/collections/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setIsCollected(data.isCollected);
        }
      } catch (error) {
        console.error("Failed to check collection status:", error);
      }
    };

    checkCollection();
  }, [session?.user?.id, params.id]);

  // 记录访问
  useEffect(() => {
    if (!session?.user?.id || !params.id) return;

    const recordVisit = async () => {
      try {
        await fetch("/api/visits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetType: "product",
            targetId: params.id as string,
          }),
        });
      } catch (error) {
        console.error("Failed to record visit:", error);
      }
    };

    recordVisit();
  }, [session?.user?.id, params.id]);

  const handleToggleCollection = async () => {
    if (!session) {
      alert("请先登录");
      router.push("/login");
      return;
    }

    if (!product) return;

    if (isOwner) {
      alert("不能收藏自己的商品");
      return;
    }

    setCollecting(true);
    try {
      const response = await fetch(`/api/collections/${params.id}`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        setIsCollected(data.isCollected);
        alert(data.message || (data.isCollected ? "已添加收藏" : "已取消收藏"));
      } else {
        const data = await response.json();
        alert(data.error || "操作失败");
      }
    } catch (error) {
      console.error("Failed to toggle collection:", error);
      alert("操作失败，请重试");
    } finally {
      setCollecting(false);
    }
  };

  const handleContactSeller = async () => {
    if (!session) {
      alert("请先登录后再联系卖家");
      router.push("/login");
      return;
    }

    if (!product) return;

    if (isOwner) {
      alert("不能联系自己");
      return;
    }

    setContacting(true);
    try {
      // 先检查是否已经有对话，如果有则跳转到对话，没有则跳转到消息页面
      const response = await fetch(`/api/messages?userId=${product.owner.id}`);
      if (response.ok) {
        // 直接跳转到消息页面，并选中该用户
        router.push(`/messages?userId=${product.owner.id}`);
      } else {
        router.push(`/messages?userId=${product.owner.id}`);
      }
    } catch (error) {
      console.error("Failed to contact seller:", error);
      router.push("/messages");
    } finally {
      setContacting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除这个商品吗？")) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/products/${params.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/products");
      } else {
        const data = await response.json();
        alert(data.error || "删除失败");
      }
    } catch (error) {
      console.error("Failed to delete product:", error);
      alert("删除失败，请重试");
    } finally {
      setDeleting(false);
    }
  };

  const handleBuyNow = async () => {
    if (!session) {
      alert("请先登录后再购买");
      router.push("/login");
      return;
    }

    if (!product) return;

    if (isOwner) {
      alert("不能购买自己的商品");
      return;
    }

    if (!confirm(`确认以 ¥${product.price.toFixed(2)} 的价格购买此商品？`)) {
      return;
    }

    setOrdering(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId: product.owner.id,
          items: [{ productId: product.id, quantity: 1 }],
        }),
      });

      if (response.ok) {
        const order = await response.json();
        alert("订单创建成功！");
        router.push(`/orders/${order.id}`);
      } else {
        const data = await response.json();
        alert(data.error || "创建订单失败");
      }
    } catch (error) {
      console.error("Failed to create order:", error);
      alert("创建订单失败，请重试");
    } finally {
      setOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 font-medium">加载中...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const isOwner = session?.user?.id === product.owner.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />
      <div className="fixed top-1/4 -left-1/4 w-96 h-96 bg-blue-400 rounded-full opacity-20 blur-3xl animate-pulse" />
      <div className="fixed bottom-1/4 -right-1/4 w-96 h-96 bg-indigo-400 rounded-full opacity-20 blur-3xl animate-pulse delay-1000" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg shadow-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/products" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium px-4 py-2 rounded-xl hover:bg-blue-50 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回列表
            </Link>
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-blue-500/25 transition-all duration-300 group-hover:scale-105">
                <span className="text-white font-bold text-sm">山信</span>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden shadow-xl border border-white/20">
              {product.images.length > 0 ? (
                <Image
                  src={product.images[selectedImage]?.url || product.images[0].url}
                  alt={product.title}
                  width={600}
                  height={600}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {product.images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-xl overflow-hidden shadow-md transition-all duration-300 ${
                      selectedImage === index
                        ? "ring-2 ring-blue-600 ring-offset-2 scale-105"
                        : "hover:scale-105 hover:shadow-lg"
                    }`}
                  >
                    <Image
                      src={image.url}
                      alt={`${product.title} ${index + 1}`}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      sizes="100px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-900">{product.title}</h1>
                <span
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
                    product.status === "available"
                      ? "bg-green-100 text-green-700"
                      : product.status === "sold"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {STATUS_MAP[product.status]}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(product.createdAt).toLocaleDateString("zh-CN")}
              </div>
            </div>

            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              ¥{product.price.toFixed(2)}
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-xl border border-gray-200 py-4 px-5 space-y-3 shadow-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  分类
                </div>
                <span className="text-gray-900 font-medium">
                  {CATEGORY_MAP[product.category] || product.category}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  浏览量
                </div>
                <span className="text-gray-900 font-medium">{product.views}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-gray-500">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  收藏
                </div>
                <span className="text-gray-900 font-medium">{product.likes}</span>
              </div>
              {product.seller && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    学校
                  </div>
                  <span className="text-gray-900 font-medium">{product.seller.name}</span>
                </div>
              )}
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-xl border border-gray-200 p-5 shadow-sm">
              <h2 className="font-medium text-gray-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                商品描述
              </h2>
              <p className="mt-3 text-gray-600 whitespace-pre-wrap leading-relaxed">
                {product.description}
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-4">
                {product.owner.avatar ? (
                  <Image
                    src={product.owner.avatar}
                    alt={product.owner.name || "卖家"}
                    width={56}
                    height={56}
                    className="rounded-full ring-2 ring-blue-100"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-bold text-lg">
                    {product.owner.name?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-lg">
                    {product.owner.name || "匿名用户"}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    卖家信息
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {product.status === "available" && !isOwner && (
                <>
                  <button
                    onClick={handleContactSeller}
                    disabled={contacting}
                    className="flex-1 py-3.5 rounded-xl font-medium border-2 border-gray-200 bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {contacting ? "跳转中..." : "联系卖家"}
                  </button>
                  <button
                    onClick={handleToggleCollection}
                    disabled={collecting}
                    className={`flex-1 py-3.5 rounded-xl font-medium border-2 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 ${
                      isCollected
                        ? "bg-gradient-to-r from-blue-500 to-indigo-500 border-blue-600 text-white shadow-md shadow-blue-500/25"
                        : "bg-white/80 backdrop-blur-sm border-gray-200 text-gray-700 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    {collecting ? "操作中..." : isCollected ? "已收藏" : "收藏"}
                  </button>
                  <button
                    onClick={handleBuyNow}
                    disabled={ordering}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 font-medium shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {ordering ? "创建中..." : "购买"}
                  </button>
                </>
              )}
              {product.status === "available" && isOwner && (
                <div className="flex-1 py-3.5 rounded-xl font-medium bg-gray-100 text-gray-500 text-center cursor-not-allowed">
                  这是您的商品
                </div>
              )}
              {isOwner && (
                <>
                  <Link
                    href={`/products/${product.id}/edit`}
                    className="flex-1 bg-gray-100 text-gray-800 py-3.5 rounded-xl hover:bg-gray-200 font-medium text-center transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    编辑
                  </Link>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3.5 rounded-xl hover:from-red-600 hover:to-red-700 font-medium shadow-md shadow-red-500/20 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {deleting ? "删除中..." : "删除"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        {product.reviews && product.reviews.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              商品评价 ({product.reviews.length})
            </h2>
            <div className="space-y-4">
              {product.reviews.map((review) => (
                <div key={review.id} className="bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-md border border-white/20 hover:shadow-lg transition-all duration-200">
                  <div className="flex items-center gap-4">
                    {review.user.avatar ? (
                      <Image
                        src={review.user.avatar}
                        alt={review.user.name || "用户"}
                        width={48}
                        height={48}
                        className="rounded-full ring-2 ring-gray-100"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-bold">
                        {review.user.name?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {review.user.name || "匿名用户"}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex text-yellow-400 text-sm">
                          {"★".repeat(review.rating)}
                          {"☆".repeat(5 - review.rating)}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString("zh-CN")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-gray-700 leading-relaxed">{review.content}</p>
                  {review.images.length > 0 && (
                    <div className="mt-4 flex gap-3 flex-wrap">
                      {review.images.map((image) => (
                        <Image
                          key={image.id}
                          src={image.url}
                          alt="评价图片"
                          width={100}
                          height={100}
                          className="rounded-lg object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

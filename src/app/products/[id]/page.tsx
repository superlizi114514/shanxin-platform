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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const isOwner = session?.user?.id === product.owner.id;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/products" className="text-lg font-medium text-blue-600 hover:text-blue-700">
              ← 返回商品列表
            </Link>
            <Link href="/" className="text-xl font-bold text-gray-900">
              山信二手平台
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
              {product.images.length > 0 ? (
                <Image
                  src={product.images[selectedImage]?.url || product.images[0].url}
                  alt={product.title}
                  width={600}
                  height={600}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  暂无图片
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square bg-gray-200 rounded-md overflow-hidden ${
                      selectedImage === index ? "ring-2 ring-blue-600" : ""
                    }`}
                  >
                    <Image
                      src={image.url}
                      alt={`${product.title} ${index + 1}`}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{product.title}</h1>
              <div className="mt-2 flex items-center gap-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    product.status === "available"
                      ? "bg-green-100 text-green-800"
                      : product.status === "sold"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {STATUS_MAP[product.status]}
                </span>
                <span className="text-gray-500">
                  发布于 {new Date(product.createdAt).toLocaleDateString("zh-CN")}
                </span>
              </div>
            </div>

            <div className="text-3xl font-bold text-blue-600">
              ¥{product.price.toFixed(2)}
            </div>

            <div className="border-t border-b border-gray-200 py-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">分类</span>
                <span className="text-gray-900">
                  {CATEGORY_MAP[product.category] || product.category}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">浏览量</span>
                <span className="text-gray-900">{product.views}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">收藏</span>
                <span className="text-gray-900">{product.likes}</span>
              </div>
              {product.seller && (
                <div className="flex justify-between">
                  <span className="text-gray-500">学校</span>
                  <span className="text-gray-900">{product.seller.name}</span>
                </div>
              )}
            </div>

            <div>
              <h2 className="font-medium text-gray-900">商品描述</h2>
              <p className="mt-2 text-gray-600 whitespace-pre-wrap">
                {product.description}
              </p>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white rounded-lg border">
              {product.owner.avatar ? (
                <Image
                  src={product.owner.avatar}
                  alt={product.owner.name || "卖家"}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                  {product.owner.name?.[0]?.toUpperCase() || "?"}
                </div>
              )}
              <div>
                <div className="font-medium text-gray-900">
                  {product.owner.name || "匿名用户"}
                </div>
                <div className="text-sm text-gray-500">卖家信息</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              {product.status === "available" && !isOwner && (
                <>
                  <button
                    onClick={handleContactSeller}
                    disabled={contacting}
                    className="flex-1 py-3 rounded-lg font-medium border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {contacting ? "跳转中..." : "💬 联系卖家"}
                  </button>
                  <button
                    onClick={handleToggleCollection}
                    disabled={collecting}
                    className={`flex-1 py-3 rounded-lg font-medium border-2 transition-colors disabled:opacity-50 ${
                      isCollected
                        ? "bg-blue-50 border-blue-600 text-blue-600 hover:bg-blue-100"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {collecting
                      ? "操作中..."
                      : isCollected
                      ? "★ 已收藏"
                      : "☆ 添加收藏"}
                  </button>
                  <button
                    onClick={handleBuyNow}
                    disabled={ordering}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                  >
                    {ordering ? "创建订单中..." : "立即购买"}
                  </button>
                </>
              )}
              {product.status === "available" && isOwner && (
                <button className="flex-1 bg-gray-400 text-white py-3 rounded-lg font-medium cursor-not-allowed">
                  这是您的商品
                </button>
              )}
              {isOwner && (
                <>
                  <Link
                    href={`/products/${product.id}/edit`}
                    className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 font-medium text-center"
                  >
                    编辑
                  </Link>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
                  >
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
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              商品评价 ({product.reviews.length})
            </h2>
            <div className="space-y-4">
              {product.reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-lg p-6 shadow">
                  <div className="flex items-center gap-4">
                    {review.user.avatar ? (
                      <Image
                        src={review.user.avatar}
                        alt={review.user.name || "用户"}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                        {review.user.name?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">
                        {review.user.name || "匿名用户"}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex text-yellow-400">
                          {"★".repeat(review.rating)}
                          {"☆".repeat(5 - review.rating)}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString("zh-CN")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-gray-700">{review.content}</p>
                  {review.images.length > 0 && (
                    <div className="mt-4 flex gap-2">
                      {review.images.map((image) => (
                        <Image
                          key={image.id}
                          src={image.url}
                          alt="评价图片"
                          width={80}
                          height={80}
                          className="rounded-md object-cover"
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

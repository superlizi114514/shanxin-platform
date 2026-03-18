"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: string;
  emailVerified: string | null;
  school: {
    id: string;
    name: string;
    code: string;
  } | null;
  stats: {
    products: number;
    buyerOrders: number;
    sellerOrders: number;
    reviews: number;
    collections: number;
  };
  products: Product[];
  buyerOrders: Order[];
  sellerOrders: Order[];
  reviews: Review[];
}

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  status: string;
  images: { id: string; url: string }[];
  createdAt: string;
}

interface Order {
  id: string;
  orderNo: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
  buyer?: { id: string; name: string | null; email: string };
  seller?: { id: string; name: string | null; email: string };
}

interface OrderItem {
  id: string;
  productId: string;
  price: number;
  product: {
    id: string;
    title: string;
    images: { id: string; url: string }[];
  };
}

interface Review {
  id: string;
  content: string;
  rating: number;
  createdAt: string;
  product: {
    id: string;
    title: string;
  };
}

type TabType = "overview" | "products" | "orders" | "reviews" | "settings";

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
  });

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setEditForm({
          name: data.user.name || "",
          email: data.user.email,
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session) {
      router.push("/login");
      return;
    }
    fetchProfile();
  }, [session]);

  const handleUpdateProfile = async () => {
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
        }),
      });

      if (response.ok) {
        await updateSession();
        setEditMode(false);
        fetchProfile();
        alert("个人资料已更新");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("更新失败，请重试");
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "待付款",
      paid: "已付款",
      completed: "已完成",
      cancelled: "已取消",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return colorMap[status] || "bg-gray-100 text-gray-800";
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
    return null;
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name || "用户"}
                  width={80}
                  height={80}
                  className="object-cover"
                />
              ) : (
                <span className="text-2xl text-gray-500">
                  {user.name?.charAt(0) || user.email.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {user.name || "未设置昵称"}
              </h2>
              <p className="text-gray-600">{user.email}</p>
              {user.school && (
                <p className="text-gray-500 text-sm">{user.school.name}</p>
              )}
              {user.role === "admin" && (
                <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                  管理员
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              setEditMode(true);
              setActiveTab("settings");
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            编辑资料
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">
            {user.stats.products}
          </div>
          <div className="text-gray-600 mt-1">发布的商品</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <div className="text-3xl font-bold text-green-600">
            {user.stats.buyerOrders}
          </div>
          <div className="text-gray-600 mt-1">购买的订单</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <div className="text-3xl font-bold text-purple-600">
            {user.stats.sellerOrders}
          </div>
          <div className="text-gray-600 mt-1">卖出的订单</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <div className="text-3xl font-bold text-yellow-600">
            {user.stats.reviews}
          </div>
          <div className="text-gray-600 mt-1">评价</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <div className="text-3xl font-bold text-pink-600">
            {user.stats.collections}
          </div>
          <div className="text-gray-600 mt-1">收藏</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">快捷操作</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/products/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            发布商品
          </Link>
          <Link
            href="/collections"
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            我的收藏
          </Link>
          <Link
            href="/messages"
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            消息中心
          </Link>
          <Link
            href="/orders"
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            订单管理
          </Link>
        </div>
      </div>

      {/* Recent Products */}
      {user.products.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">最新商品</h3>
            <button
              onClick={() => setActiveTab("products")}
              className="text-blue-600 hover:text-blue-700"
            >
              查看全部
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {user.products.slice(0, 3).map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                  {product.images.length > 0 ? (
                    <Image
                      src={product.images[0].url}
                      alt={product.title}
                      width={64}
                      height={64}
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                      无图
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {product.title}
                  </p>
                  <p className="text-blue-600 font-bold">
                    ¥{product.price.toFixed(2)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      {(user.buyerOrders.length > 0 || user.sellerOrders.length > 0) && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">最近订单</h3>
            <button
              onClick={() => setActiveTab("orders")}
              className="text-blue-600 hover:text-blue-700"
            >
              查看全部
            </button>
          </div>
          <div className="space-y-3">
            {[...user.buyerOrders, ...user.sellerOrders]
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .slice(0, 3)
              .map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {order.orderNo}
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.items.length} 件商品
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      ¥{order.totalAmount.toFixed(2)}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">我的商品</h2>
        <Link
          href="/products/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          发布商品
        </Link>
      </div>
      {user.products.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500">还没有发布任何商品</p>
          <Link
            href="/products/new"
            className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            发布第一个商品
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {user.products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg"
            >
              <div className="aspect-square bg-gray-200 relative">
                {product.images.length > 0 ? (
                  <Image
                    src={product.images[0].url}
                    alt={product.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    暂无图片
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-medium text-lg text-gray-900 truncate">
                  {product.title}
                </h3>
                <p className="text-blue-600 font-bold mt-1">
                  ¥{product.price.toFixed(2)}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      product.status === "available"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {product.status === "available" ? "在售" : "已售出"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  const renderOrders = () => {
    const allOrders = [
      ...user.buyerOrders.map((o) => ({ ...o, role: "buyer" })),
      ...user.sellerOrders.map((o) => ({ ...o, role: "seller" })),
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">我的订单</h2>
        {allOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500">还没有任何订单</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allOrders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{order.orderNo}</p>
                    <p className="text-sm text-gray-500">
                      {order.role === "buyer" ? "购买" : "卖出"} |{" "}
                      {order.items.length} 件商品
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      ¥{order.totalAmount.toFixed(2)}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderReviews = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">我的评价</h2>
      {user.reviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500">还没有评价任何商品</p>
        </div>
      ) : (
        <div className="space-y-3">
          {user.reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-lg shadow-md p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <Link
                  href={`/products/${review.product.id}`}
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  {review.product.title}
                </Link>
                <div className="flex items-center">
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </div>
              </div>
              <p className="text-gray-700">{review.content}</p>
              <p className="text-sm text-gray-500 mt-2">
                {new Date(review.createdAt).toLocaleDateString("zh-CN")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">账户设置</h2>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          编辑个人资料
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              昵称
            </label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入昵称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              邮箱
            </label>
            <input
              type="email"
              value={editForm.email}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">邮箱不可修改</p>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleUpdateProfile}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              保存修改
            </button>
            <button
              onClick={() => {
                setEditMode(false);
                setEditForm({ name: user.name || "", email: user.email });
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              取消
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">账户信息</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">用户 ID</span>
            <span className="text-gray-900 font-mono text-sm">{user.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">邮箱</span>
            <span className="text-gray-900">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">邮箱验证</span>
            <span
              className={
                user.emailVerified
                  ? "text-green-600"
                  : "text-yellow-600"
              }
            >
              {user.emailVerified ? "已验证" : "未验证"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">账户角色</span>
            <span className="text-gray-900">
              {user.role === "admin" ? "管理员" : "普通用户"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              山信二手平台
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                href="/products"
                className="text-gray-700 hover:text-gray-900"
              >
                全部商品
              </Link>
              <Link
                href="/collections"
                className="text-gray-700 hover:text-gray-900"
              >
                我的收藏
              </Link>
              <Link
                href="/orders"
                className="text-gray-700 hover:text-gray-900"
              >
                订单管理
              </Link>
              <Link
                href="/messages"
                className="text-gray-700 hover:text-gray-900"
              >
                消息中心
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-3 font-medium ${
                activeTab === "overview"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              概览
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`px-6 py-3 font-medium ${
                activeTab === "products"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              我的商品 ({user.stats.products})
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-6 py-3 font-medium ${
                activeTab === "orders"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              我的订单 (
              {user.stats.buyerOrders + user.stats.sellerOrders})
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`px-6 py-3 font-medium ${
                activeTab === "reviews"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              我的评价 ({user.stats.reviews})
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-6 py-3 font-medium ${
                activeTab === "settings"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              设置
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && renderOverview()}
        {activeTab === "products" && renderProducts()}
        {activeTab === "orders" && renderOrders()}
        {activeTab === "reviews" && renderReviews()}
        {activeTab === "settings" && renderSettings()}
      </main>
    </div>
  );
}

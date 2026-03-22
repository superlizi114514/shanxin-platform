"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    title: string;
    images: { id: string; url: string }[];
  };
}

interface Order {
  id: string;
  orderNo: string;
  totalAmount: number;
  status: string;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
  buyer: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
  seller: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
  items: OrderItem[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_MAP: Record<string, string> = {
  pending: "待付款",
  paid: "已付款",
  completed: "已完成",
  cancelled: "已取消",
};

const STATUS_COLOR_MAP: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const TABS = [
  { value: "all", label: "全部订单" },
  { value: "buyer", label: "我买的" },
  { value: "seller", label: "我卖的" },
];

const STATUS_FILTERS = [
  { value: "", label: "全部状态" },
  { value: "pending", label: "待付款" },
  { value: "paid", label: "已付款" },
  { value: "completed", label: "已完成" },
  { value: "cancelled", label: "已取消" },
];

export default function OrdersPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [activeTab, setActiveTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchOrders = async (page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        role: activeTab === "all" ? "" : activeTab,
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await fetch(`/api/orders?${params}`);
      const data = await response.json();

      if (response.ok) {
        setOrders(data.orders);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchOrders();
    }
  }, [activeTab, statusFilter, session]);

  const handlePageChange = (newPage: number) => {
    fetchOrders(newPage);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchOrders(pagination.page);
      } else {
        const data = await response.json();
        alert(data.error || "操作失败");
      }
    } catch (error) {
      console.error("Failed to update order:", error);
      alert("操作失败，请重试");
    } finally {
      setUpdating(null);
    }
  };

  const getOrderRole = (order: Order) => {
    if (session?.user?.id === order.buyer.id) return "buyer";
    if (session?.user?.id === order.seller.id) return "seller";
    return "other";
  };

  const renderActionButtons = (order: Order) => {
    const role = getOrderRole(order);
    const buttons: React.ReactElement[] = [];

    if (order.status === "pending") {
      // 买家可以取消订单
      if (role === "buyer") {
        buttons.push(
          <button
            key="cancel"
            onClick={() => handleStatusUpdate(order.id, "cancelled")}
            disabled={updating === order.id}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 text-sm"
          >
            取消订单
          </button>
        );
      }
      // 卖家可以确认收款
      if (role === "seller") {
        buttons.push(
          <button
            key="confirm"
            onClick={() => handleStatusUpdate(order.id, "paid")}
            disabled={updating === order.id}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            确认收款
          </button>
        );
      }
    }

    if (order.status === "paid") {
      // 买卖双方都可以完成订单
      buttons.push(
        <button
          key="complete"
          onClick={() => handleStatusUpdate(order.id, "completed")}
          disabled={updating === order.id}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
        >
          完成交易
        </button>
      );
    }

    return buttons;
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center relative overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />
        <div className="fixed top-1/4 -left-1/4 w-96 h-96 bg-blue-400 rounded-full opacity-20 blur-3xl animate-pulse" />
        <div className="fixed bottom-1/4 -right-1/4 w-96 h-96 bg-indigo-400 rounded-full opacity-20 blur-3xl animate-pulse delay-1000" />

        <div className="text-center relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h1>
          <Link
            href="/login"
            className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 font-medium shadow-lg shadow-blue-500/30 transition-all duration-300"
          >
            登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />
      <div className="fixed top-1/4 -left-1/4 w-96 h-96 bg-blue-400 rounded-full opacity-20 blur-3xl animate-pulse" />
      <div className="fixed bottom-1/4 -right-1/4 w-96 h-96 bg-indigo-400 rounded-full opacity-20 blur-3xl animate-pulse delay-1000" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg shadow-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300 group-hover:scale-105">
                <span className="text-white font-bold text-lg">山信</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hidden sm:block">
                二手平台
              </span>
            </Link>
            <div className="flex items-center space-x-3">
              <Link
                href="/products"
                className="text-gray-700 hover:text-blue-600 text-sm font-medium px-3 py-2 rounded-lg hover:bg-blue-50 transition-all"
              >
                商品列表
              </Link>
              <Link
                href="/orders"
                className="text-blue-600 font-medium text-sm px-3 py-2 rounded-lg bg-blue-50"
              >
                我的订单
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">我的订单</h1>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200 pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-5 py-3 font-medium text-sm whitespace-nowrap transition-all duration-200 border-b-2 ${
                activeTab === tab.value
                  ? "text-blue-600 border-blue-600 bg-blue-50/50 rounded-t-xl"
                  : "text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50 rounded-t-xl"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                statusFilter === filter.value
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25"
                  : "bg-white/80 backdrop-blur-sm text-gray-700 border border-gray-200 hover:bg-blue-50 hover:border-blue-300"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 font-medium">加载中...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 10-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <p className="text-gray-600 text-lg">暂无订单</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              去购物
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300"
                >
                  {/* Order Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-200">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-900">
                          订单号：{order.orderNo}
                        </span>
                        <span
                          className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                            STATUS_COLOR_MAP[order.status]
                          }`}
                        >
                          {STATUS_MAP[order.status]}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        创建时间：{new Date(order.createdAt).toLocaleString("zh-CN")}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {renderActionButtons(order)}
                      <Link
                        href={`/orders/${order.id}`}
                        className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 rounded-xl hover:from-gray-200 hover:to-gray-300 text-sm font-medium transition-all duration-200 flex items-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        查看详情
                      </Link>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="py-4 space-y-4">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-4 items-center"
                      >
                        <Link
                          href={`/products/${item.product.id}`}
                          className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden flex-shrink-0 shadow-md hover:shadow-lg transition-all duration-200 group"
                        >
                          {item.product.images.length > 0 ? (
                            <Image
                              src={item.product.images[0].url}
                              alt={item.product.title}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </Link>
                        <div className="flex-1">
                          <Link
                            href={`/products/${item.product.id}`}
                            className="font-medium text-gray-900 hover:text-blue-600 transition-colors duration-200 line-clamp-1"
                          >
                            {item.product.title}
                          </Link>
                          <div className="text-sm text-gray-500 mt-1">
                            单价：¥{item.price.toFixed(2)} × {item.quantity}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            ¥{(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer */}
                  <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                    <div className="text-sm text-gray-500 flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {activeTab === "seller" || getOrderRole(order) === "seller"
                        ? `买家：${order.buyer.name || "匿名用户"}`
                        : `卖家：${order.seller.name || "匿名用户"}`}
                    </div>
                    <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      合计：¥{order.totalAmount.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-5 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 font-medium text-gray-700"
                >
                  上一页
                </button>
                <span className="text-gray-700 font-medium bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-200">
                  第 {pagination.page} / {pagination.totalPages} 页
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-5 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 font-medium text-gray-700"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

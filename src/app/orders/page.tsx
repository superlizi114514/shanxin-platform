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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h1>
          <Link
            href="/login"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="text-xl font-bold text-gray-900">
              山信二手平台
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                href="/products"
                className="text-gray-700 hover:text-gray-900"
              >
                商品列表
              </Link>
              <Link
                href="/orders"
                className="text-blue-600 font-medium"
              >
                我的订单
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">我的订单</h1>

        {/* Tabs */}
        <div className="mb-6 flex gap-4 border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 font-medium ${
                activeTab === tab.value
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
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
              className={`px-4 py-2 rounded-md text-sm ${
                statusFilter === filter.value
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">暂无订单</p>
            <Link
              href="/products"
              className="inline-block mt-4 text-blue-600 hover:text-blue-700"
            >
              去购物 →
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-lg shadow p-6"
                >
                  {/* Order Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-200">
                    <div className="space-y-1">
                      <div className="flex items-center gap-4">
                        <span className="font-medium text-gray-900">
                          订单号：{order.orderNo}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            STATUS_COLOR_MAP[order.status]
                          }`}
                        >
                          {STATUS_MAP[order.status]}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        创建时间：{new Date(order.createdAt).toLocaleString("zh-CN")}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {renderActionButtons(order)}
                      <Link
                        href={`/orders/${order.id}`}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm"
                      >
                        查看详情
                      </Link>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="py-4 space-y-4">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-4"
                      >
                        <Link
                          href={`/products/${item.product.id}`}
                          className="w-20 h-20 bg-gray-200 rounded-md overflow-hidden flex-shrink-0"
                        >
                          {item.product.images.length > 0 ? (
                            <Image
                              src={item.product.images[0].url}
                              alt={item.product.title}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              暂无图片
                            </div>
                          )}
                        </Link>
                        <div className="flex-1">
                          <Link
                            href={`/products/${item.product.id}`}
                            className="font-medium text-gray-900 hover:text-blue-600 line-clamp-1"
                          >
                            {item.product.title}
                          </Link>
                          <div className="text-sm text-gray-500 mt-1">
                            单价：¥{item.price.toFixed(2)} × {item.quantity}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">
                            ¥{(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer */}
                  <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      {activeTab === "seller" || getOrderRole(order) === "seller"
                        ? `买家：${order.buyer.name || "匿名用户"}`
                        : `卖家：${order.seller.name || "匿名用户"}`}
                    </div>
                    <div className="text-xl font-bold text-gray-900">
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
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  上一页
                </button>
                <span className="text-gray-700">
                  第 {pagination.page} / {pagination.totalPages} 页
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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

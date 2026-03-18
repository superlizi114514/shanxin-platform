"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    title: string;
    description: string;
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
    email: string;
    avatar: string | null;
  };
  seller: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  };
  items: OrderItem[];
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

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (typeof params.id !== "string") return;

    const fetchOrder = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/orders/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setOrder(data);
        } else {
          const data = await response.json();
          alert(data.error || "订单不存在");
          router.push("/orders");
        }
      } catch (error) {
        console.error("Failed to fetch order:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [params.id, router]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        setOrder(updatedOrder);
      } else {
        const data = await response.json();
        alert(data.error || "操作失败");
      }
    } catch (error) {
      console.error("Failed to update order:", error);
      alert("操作失败，请重试");
    } finally {
      setUpdating(false);
    }
  };

  const getOrderRole = () => {
    if (!order || !session?.user?.id) return "other";
    if (session.user.id === order.buyer.id) return "buyer";
    if (session.user.id === order.seller.id) return "seller";
    return "other";
  };

  const renderActionButtons = () => {
    if (!order) return null;

    const role = getOrderRole();
    const buttons: React.ReactElement[] = [];

    if (order.status === "pending") {
      // 买家可以取消订单
      if (role === "buyer") {
        buttons.push(
          <button
            onClick={() => handleStatusUpdate("cancelled")}
            disabled={updating}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
          >
            取消订单
          </button>
        );
      }
      // 卖家可以确认收款
      if (role === "seller") {
        buttons.push(
          <button
            onClick={() => handleStatusUpdate("paid")}
            disabled={updating}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
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
          onClick={() => handleStatusUpdate("completed")}
          disabled={updating}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
        >
          完成交易
        </button>
      );
    }

    return buttons;
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

  if (!order) {
    return null;
  }

  const role = getOrderRole();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/orders" className="text-lg font-medium text-blue-600 hover:text-blue-700">
              ← 返回订单列表
            </Link>
            <Link href="/" className="text-xl font-bold text-gray-900">
              山信二手平台
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          {/* Order Info */}
          <div className="pb-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-gray-900">订单详情</h1>
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  STATUS_COLOR_MAP[order.status]
                }`}
              >
                {STATUS_MAP[order.status]}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">订单号：</span>
                <span className="text-gray-900">{order.orderNo}</span>
              </div>
              <div>
                <span className="text-gray-500">创建时间：</span>
                <span className="text-gray-900">
                  {new Date(order.createdAt).toLocaleString("zh-CN")}
                </span>
              </div>
              <div>
                <span className="text-gray-500">更新时间：</span>
                <span className="text-gray-900">
                  {new Date(order.updatedAt).toLocaleString("zh-CN")}
                </span>
              </div>
              <div>
                <span className="text-gray-500">
                  {role === "seller" ? "买家：" : "卖家："}
                </span>
                <span className="text-gray-900">
                  {role === "seller"
                    ? order.buyer.name || "匿名用户"
                    : order.seller.name || "匿名用户"}
                </span>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="py-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">商品列表</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 bg-gray-50 rounded-lg"
                >
                  <Link
                    href={`/products/${item.product.id}`}
                    className="w-24 h-24 bg-gray-200 rounded-md overflow-hidden flex-shrink-0"
                  >
                    {item.product.images.length > 0 ? (
                      <Image
                        src={item.product.images[0].url}
                        alt={item.product.title}
                        width={96}
                        height={96}
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
                      className="font-medium text-gray-900 hover:text-blue-600"
                    >
                      {item.product.title}
                    </Link>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {item.product.description}
                    </p>
                    <div className="text-sm text-gray-500 mt-2">
                      单价：¥{item.price.toFixed(2)} × {item.quantity}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900 text-lg">
                      ¥{(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Price Summary */}
          <div className="py-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">订单备注</span>
              <span className="text-gray-900">
                {order.remark || "无"}
              </span>
            </div>
          </div>

          {/* Price Summary */}
          <div className="py-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-900">订单总额</span>
              <span className="text-2xl font-bold text-blue-600">
                ¥{order.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 flex gap-4">
            {renderActionButtons()}
            {order.remark && (
              <div className="flex-1 text-sm text-gray-500 bg-gray-50 p-3 rounded">
                备注：{order.remark}
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">订单时间线</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <div className="w-0.5 flex-1 bg-gray-200 mt-2"></div>
              </div>
              <div className="flex-1 pb-4">
                <div className="font-medium text-gray-900">订单创建</div>
                <div className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleString("zh-CN")}
                </div>
              </div>
            </div>
            {order.status !== "pending" && order.status !== "cancelled" && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  <div className="w-0.5 flex-1 bg-gray-200 mt-2"></div>
                </div>
                <div className="flex-1 pb-4">
                  <div className="font-medium text-gray-900">付款成功</div>
                  <div className="text-sm text-gray-500">
                    {new Date(order.updatedAt).toLocaleString("zh-CN")}
                  </div>
                </div>
              </div>
            )}
            {(order.status === "completed" || order.status === "cancelled") && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      order.status === "completed"
                        ? "bg-green-600"
                        : "bg-red-600"
                    }`}
                  ></div>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {order.status === "completed" ? "交易完成" : "交易取消"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(order.updatedAt).toLocaleString("zh-CN")}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

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
  school: string | null;
  studentId: string | null;
  major: string | null;
  class: string | null;
  phone: string | null;
  isTeacher: boolean | null;
  title: string | null;
  stats: {
    products: number;
    buyerOrders: number;
    sellerOrders: number;
    reviews: number;
    collections: number;
    visits: number;
  };
  products: Product[];
  buyerOrders: Order[];
  sellerOrders: Order[];
  reviews: Review[];
  visits: Visit[];
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

interface Visit {
  id: string;
  targetType: string;
  targetId: string;
  createdAt: string;
}

type TabType = "overview" | "products" | "orders" | "reviews" | "visits" | "settings";

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
    studentId: "",
    school: "",
    major: "",
    class: "",
    phone: "",
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setEditForm({
          name: data.user.name || "",
          email: data.user.email,
          studentId: data.user.studentId || "",
          school: data.user.school || "",
          major: data.user.major || "",
          class: data.user.class || "",
          phone: data.user.phone || "",
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
          studentId: editForm.studentId,
          school: editForm.school,
          major: editForm.major,
          class: editForm.class,
          phone: editForm.phone,
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("请选择图片文件");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("图片大小不能超过 5MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "上传失败");
      }

      const data = await response.json();

      // Update user avatar
      const updateResponse = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: data.url }),
      });

      if (updateResponse.ok) {
        await updateSession();
        fetchProfile();
        alert("头像已更新");
      }
    } catch (error) {
      console.error("Avatar upload failed:", error);
      alert("头像上传失败：" + (error as Error).message);
    } finally {
      setUploadingAvatar(false);
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
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-8 border border-white/20">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center overflow-hidden shadow-lg ring-4 ring-blue-50">
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.name || "用户"}
                    width={96}
                    height={96}
                    className="object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-blue-600">
                    {(user.name?.charAt(0) || user.email.charAt(0)).toUpperCase()}
                  </span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-md">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploadingAvatar}
                />
              </label>
              {uploadingAvatar && (
                <div className="absolute inset-0 rounded-full bg-white/80 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                {user.name || "未设置昵称"}
                {user.role === "admin" && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-sm">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    管理员
                  </span>
                )}
                {user.isTeacher && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-sm">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 4.8a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                      <path fillRule="evenodd" d="M2.343 10.657c.39-.39 1.023-.39 1.414 0L6 12.9V5a1 1 0 011-1h6a1 1 0 011 1v7.9l2.243-2.243a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414zM5 14a1 1 0 100 2h.01a1 1 0 100-2H5z" clipRule="evenodd" />
                    </svg>
                    {user.title || "老师"}
                  </span>
                )}
              </h2>
              <p className="text-gray-600 mt-1">{user.email}</p>
              <div className="mt-2 space-y-1">
                {user.studentId && (
                  <p className="text-gray-500 text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-8 0a2 2 0 104 0m-2 0h4" />
                    </svg>
                    学号：{user.studentId}
                  </p>
                )}
                {user.school && (
                  <p className="text-gray-500 text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                    {user.school}
                  </p>
                )}
                {user.major && (
                  <p className="text-gray-500 text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    专业：{user.major}
                  </p>
                )}
                {user.class && (
                  <p className="text-gray-500 text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    班级：{user.class}
                  </p>
                )}
                {user.phone && (
                  <p className="text-gray-500 text-sm flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    手机：{user.phone}
                  </p>
                )}
                {!user.isTeacher && !user.studentId && (
                  <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-700 font-medium flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      老师认证
                    </p>
                    <p className="text-xs text-gray-500 mt-1.5">
                      联系微信 <span className="font-mono font-medium text-blue-600 select-all">SiNianNiQWQ</span> 进行老师身份认证
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      认证后可获得老师专属标识和更多权限
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setEditMode(true);
              setActiveTab("settings");
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            编辑资料
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-md p-5 text-center hover:shadow-lg transition-all duration-200 group">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md group-hover:shadow-lg group-hover:shadow-blue-500/30 transform group-hover:scale-110 transition-all">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 15H4L5 9z" />
            </svg>
          </div>
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
            {user.stats.products}
          </div>
          <div className="text-gray-600 mt-1 text-sm font-medium">发布的商品</div>
        </div>
        <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-md p-5 text-center hover:shadow-lg transition-all duration-200 group">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md group-hover:shadow-lg group-hover:shadow-green-500/30 transform group-hover:scale-110 transition-all">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 15H4L5 9z" />
            </svg>
          </div>
          <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
            {user.stats.buyerOrders}
          </div>
          <div className="text-gray-600 mt-1 text-sm font-medium">购买的订单</div>
        </div>
        <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-md p-5 text-center hover:shadow-lg transition-all duration-200 group">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md group-hover:shadow-lg group-hover:shadow-purple-500/30 transform group-hover:scale-110 transition-all">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
            {user.stats.sellerOrders}
          </div>
          <div className="text-gray-600 mt-1 text-sm font-medium">卖出的订单</div>
        </div>
        <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-md p-5 text-center hover:shadow-lg transition-all duration-200 group">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md group-hover:shadow-lg group-hover:shadow-yellow-500/30 transform group-hover:scale-110 transition-all">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <div className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
            {user.stats.reviews}
          </div>
          <div className="text-gray-600 mt-1 text-sm font-medium">评价</div>
        </div>
        <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-md p-5 text-center hover:shadow-lg transition-all duration-200 group">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md group-hover:shadow-lg group-hover:shadow-pink-500/30 transform group-hover:scale-110 transition-all">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            {user.stats.collections}
          </div>
          <div className="text-gray-600 mt-1 text-sm font-medium">收藏</div>
        </div>
        <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-md p-5 text-center hover:shadow-lg transition-all duration-200 group">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md group-hover:shadow-lg group-hover:shadow-indigo-500/30 transform group-hover:scale-110 transition-all">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent">
            {user.stats.visits}
          </div>
          <div className="text-gray-600 mt-1 text-sm font-medium">浏览记录</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-white/20">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          快捷操作
        </h3>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/products/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 font-medium text-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            发布商品
          </Link>
          <Link
            href="/profile/my-products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow transition-all duration-200 font-medium text-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 15H4L5 9z" />
            </svg>
            我的发布
          </Link>
          <Link
            href="/profile/my-collections"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow transition-all duration-200 font-medium text-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            我的收藏
          </Link>
          <Link
            href="/profile/my-schedule"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow transition-all duration-200 font-medium text-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            我的课表
          </Link>
          <Link
            href="/profile/my-reviews"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow transition-all duration-200 font-medium text-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            我的评价
          </Link>
          <Link
            href="/messages"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow transition-all duration-200 font-medium text-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            消息中心
          </Link>
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow transition-all duration-200 font-medium text-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            订单管理
          </Link>
          <Link
            href="/profile/account-security"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow transition-all duration-200 font-medium text-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            账号安全
          </Link>
        </div>
      </div>

      {/* Recent Products */}
      {user.products.length > 0 && (
        <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-white/20">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 15H4L5 9z" />
              </svg>
              最新商品
            </h3>
            <button
              onClick={() => setActiveTab("products")}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 transition-colors"
            >
              查看全部
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {user.products.slice(0, 3).map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:border-blue-200 transition-all duration-200"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden flex-shrink-0 group-hover:shadow-md transition-all">
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
                  <p className="font-medium text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                    {product.title}
                  </p>
                  <p className="text-blue-600 font-bold mt-0.5">
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
        <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg p-6 border border-white/20">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              最近订单
            </h3>
            <button
              onClick={() => setActiveTab("orders")}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1 transition-colors"
            >
              查看全部
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
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
                  className="group flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:border-blue-200 transition-all duration-200"
                >
                  <div>
                    <p className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                      {order.orderNo}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {order.items.length} 件商品
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                      ¥{order.totalAmount.toFixed(2)}
                    </p>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(
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

  const getVisitTargetLabel = (targetType: string, targetId: string) => {
    const typeLabels: Record<string, string> = {
      product: "商品",
      merchant: "商家",
      news: "新闻",
      guide: "指南",
    };
    return `${typeLabels[targetType] || "未知"}: ${targetId}`;
  };

  const getVisitTargetUrl = (visit: Visit) => {
    const urlMap: Record<string, string> = {
      product: `/products/${visit.targetId}`,
      merchant: `/merchants/${visit.targetId}`,
      news: `/news/${visit.targetId}`,
      guide: `/guide/${visit.targetId}`,
    };
    return urlMap[visit.targetType] || "/";
  };

  const renderVisits = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">浏览记录</h2>
      {user.visits.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500">还没有浏览记录</p>
          <Link
            href="/products"
            className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            去逛逛
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {user.visits.map((visit) => (
            <Link
              key={visit.id}
              href={getVisitTargetUrl(visit)}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {getVisitTargetLabel(visit.targetType, visit.targetId)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(visit.createdAt).toLocaleString("zh-CN")}
                </p>
              </div>
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                {visit.targetType === "product" && "商品"}
                {visit.targetType === "merchant" && "商家"}
                {visit.targetType === "news" && "新闻"}
                {visit.targetType === "guide" && "指南"}
              </span>
            </Link>
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
              学号
            </label>
            <input
              type="text"
              value={editForm.studentId}
              onChange={(e) =>
                setEditForm({ ...editForm, studentId: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入学号"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              学校
            </label>
            <input
              type="text"
              value={editForm.school}
              onChange={(e) =>
                setEditForm({ ...editForm, school: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入学校名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              专业
            </label>
            <input
              type="text"
              value={editForm.major}
              onChange={(e) =>
                setEditForm({ ...editForm, major: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入专业"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              班级
            </label>
            <input
              type="text"
              value={editForm.class}
              onChange={(e) =>
                setEditForm({ ...editForm, class: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入班级"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              手机号
            </label>
            <input
              type="tel"
              value={editForm.phone}
              onChange={(e) =>
                setEditForm({ ...editForm, phone: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入手机号"
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
                setEditForm({
                  name: user.name || "",
                  email: user.email,
                  studentId: user.studentId || "",
                  school: user.school || "",
                  major: user.major || "",
                  class: user.class || "",
                  phone: user.phone || "",
                });
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
                <span className="text-white font-bold text-sm">山信</span>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                二手平台
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                href="/products"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                全部商品
              </Link>
              <Link
                href="/collections"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                我的收藏
              </Link>
              <Link
                href="/orders"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                订单管理
              </Link>
              <Link
                href="/messages"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                消息中心
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg mb-6 overflow-hidden border border-white/20">
          <div className="flex border-b overflow-x-auto">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-5 py-4 font-medium text-sm whitespace-nowrap transition-all duration-200 border-b-2 ${
                activeTab === "overview"
                  ? "text-blue-600 border-blue-600 bg-blue-50/50"
                  : "text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                概览
              </div>
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`px-5 py-4 font-medium text-sm whitespace-nowrap transition-all duration-200 border-b-2 ${
                activeTab === "products"
                  ? "text-blue-600 border-blue-600 bg-blue-50/50"
                  : "text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 15H4L5 9z" />
                </svg>
                我的商品 ({user.stats.products})
              </div>
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-5 py-4 font-medium text-sm whitespace-nowrap transition-all duration-200 border-b-2 ${
                activeTab === "orders"
                  ? "text-blue-600 border-blue-600 bg-blue-50/50"
                  : "text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                我的订单 ({user.stats.buyerOrders + user.stats.sellerOrders})
              </div>
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`px-5 py-4 font-medium text-sm whitespace-nowrap transition-all duration-200 border-b-2 ${
                activeTab === "reviews"
                  ? "text-blue-600 border-blue-600 bg-blue-50/50"
                  : "text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                我的评价 ({user.stats.reviews})
              </div>
            </button>
            <button
              onClick={() => setActiveTab("visits")}
              className={`px-5 py-4 font-medium text-sm whitespace-nowrap transition-all duration-200 border-b-2 ${
                activeTab === "visits"
                  ? "text-blue-600 border-blue-600 bg-blue-50/50"
                  : "text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                浏览记录 ({user.stats.visits})
              </div>
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-5 py-4 font-medium text-sm whitespace-nowrap transition-all duration-200 border-b-2 ${
                activeTab === "settings"
                  ? "text-blue-600 border-blue-600 bg-blue-50/50"
                  : "text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                设置
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && renderOverview()}
        {activeTab === "products" && renderProducts()}
        {activeTab === "orders" && renderOrders()}
        {activeTab === "reviews" && renderReviews()}
        {activeTab === "visits" && renderVisits()}
        {activeTab === "settings" && renderSettings()}
      </main>
    </div>
  );
}

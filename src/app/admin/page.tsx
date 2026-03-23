"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Users,
  Package,
  Store,
  Newspaper,
  ShoppingCart,
  LayoutDashboard,
  FileText,
  BookOpen,
  UserCog,
  ArrowRight,
  ChevronRight,
  Shield,
  TrendingUp,
  PieChart as PieChartIcon,
  Network,
  Activity,
} from "lucide-react";
import { AnalyticsCard } from "@/components/AnalyticsCard";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

interface Stats {
  userCount: number;
  productCount: number;
  merchantCount: number;
  newsCount: number;
  orderCount: number;
}

interface AdminCard {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
}

// 图表数据类型
interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

export default function AdminHomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{
    categoryData: ChartData[];
    trendData: ChartData[];
    radarData: ChartData[];
  } | null>(null);

  useEffect(() => {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    if (session.user.role !== "admin") {
      router.push("/");
      return;
    }

    fetchStats();
    fetchChartData();
  }, [session, router]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/stats");
      const data = await response.json();
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      const response = await fetch("/api/admin/dashboard/charts");
      const data = await response.json();
      if (data.success) {
        setChartData(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch chart data:", error);
    }
  };

  const adminCards: AdminCard[] = [
    {
      title: "商家管理",
      description: "管理商家信息、审核认领申请、查看评价",
      href: "/admin/merchants",
      icon: Store,
      gradient: "from-blue-500 to-blue-600",
      iconBg: "bg-blue-100",
    },
    {
      title: "新闻管理",
      description: "发布校园新闻、通知公告、活动资讯",
      href: "/admin/news",
      icon: Newspaper,
      gradient: "from-green-500 to-green-600",
      iconBg: "bg-green-100",
    },
    {
      title: "信息大全",
      description: "管理校园指南、生活信息、常见问题",
      href: "/admin/guide",
      icon: BookOpen,
      gradient: "from-purple-500 to-purple-600",
      iconBg: "bg-purple-100",
    },
    {
      title: "用户管理",
      description: "管理用户账号、查看用户信息、权限设置",
      href: "/admin/users",
      icon: UserCog,
      gradient: "from-orange-500 to-orange-600",
      iconBg: "bg-orange-100",
    },
  ];

  const statsCards = [
    { label: "用户总数", value: stats?.userCount ?? 0, icon: Users, color: "blue", gradient: "from-blue-500 to-blue-600" },
    { label: "商品总数", value: stats?.productCount ?? 0, icon: Package, color: "green", gradient: "from-green-500 to-green-600" },
    { label: "商家总数", value: stats?.merchantCount ?? 0, icon: Store, color: "purple", gradient: "from-purple-500 to-purple-600" },
    { label: "新闻总数", value: stats?.newsCount ?? 0, icon: FileText, color: "orange", gradient: "from-orange-500 to-orange-600" },
    { label: "订单总数", value: stats?.orderCount ?? 0, icon: ShoppingCart, color: "red", gradient: "from-red-500 to-red-600" },
  ];

  // 饼状图颜色
  const COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899", "#6366F1"];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto w-full">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">欢迎回来，管理员！</h2>
            <p className="text-slate-600 text-sm">企业级数据可视化仪表板</p>
          </div>
        </div>
      </div>

        {/* Statistics Cards */}
        <div className="mb-10">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
            核心指标
          </h3>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-3 bg-slate-200 rounded w-1/2 mb-3"></div>
                      <div className="h-8 bg-slate-200 rounded w-3/4 mb-2"></div>
                      <div className="h-2 bg-slate-200 rounded w-1/3"></div>
                    </div>
                    <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {statsCards.map((stat, index) => (
                <div
                  key={index}
                  className="group bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                      <p className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mt-1`}>
                        {stat.value.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">实时更新</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LayoutDashboard className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium">暂无统计数据</p>
              <p className="text-slate-400 text-sm mt-1">系统正在初始化</p>
            </div>
          )}
        </div>

        {/* Analytics 访客分析面板 */}
        <div className="mb-10">
          <AnalyticsCard />
        </div>

        {/* Charts Section - 业务数据图表 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* 饼状图 - 分类分布 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                  <PieChartIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">分类分布</h3>
                  <p className="text-sm text-slate-500">各类目占比分析</p>
                </div>
              </div>
            </div>
            <div className="h-80">
              {chartData?.categoryData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                  加载图表数据...
                </div>
              )}
            </div>
          </div>

          {/* 线形图 - 趋势分析 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">增长趋势</h3>
                  <p className="text-sm text-slate-500">近 7 日数据变化</p>
                </div>
              </div>
            </div>
            <div className="h-80">
              {chartData?.trendData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.trendData}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="用户增长"
                      stroke="#3B82F6"
                      fillOpacity={1}
                      fill="url(#colorUsers)"
                    />
                    <Area
                      type="monotone"
                      dataKey="订单增长"
                      stroke="#10B981"
                      fillOpacity={1}
                      fill="url(#colorOrders)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                  加载图表数据...
                </div>
              )}
            </div>
          </div>

          {/* 雷达图 - 综合能力分析 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 p-6 lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Network className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">平台健康度分析</h3>
                  <p className="text-sm text-slate-500">多维度运营指标评估</p>
                </div>
              </div>
            </div>
            <div className="h-80">
              {chartData?.radarData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData.radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={12} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#64748b" fontSize={12} />
                    <Radar
                      name="平台健康度"
                      dataKey="value"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      fill="#8B5CF6"
                      fillOpacity={0.5}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                  加载图表数据...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Admin Function Cards */}
        <div className="mb-10">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-green-500 rounded-full"></div>
            管理功能
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {adminCards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`h-2 bg-gradient-to-r ${card.gradient}`}></div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 ${card.iconBg} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
                      <card.icon className="w-7 h-7" />
                    </div>
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                  <h4 className="font-semibold text-lg text-slate-900 mb-2">{card.title}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{card.description}</p>
                  <div className="flex items-center gap-2 mt-4 text-sm font-medium">
                    <span className="text-blue-600 group-hover:text-blue-700">进入管理</span>
                    <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-purple-500 rounded-full"></div>
            快速操作
          </h3>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/merchants"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 text-sm font-medium shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            >
              <Store className="w-4 h-4" />
              管理商家
            </Link>
            <Link
              href="/admin/news"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 text-sm font-medium shadow-md shadow-green-500/25 hover:shadow-lg hover:shadow-green-500/30 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            >
              <Newspaper className="w-4 h-4" />
              发布新闻
            </Link>
            <Link
              href="/admin/guide"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 text-sm font-medium shadow-md shadow-purple-500/25 hover:shadow-lg hover:shadow-purple-500/30 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              信息大全
            </Link>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 text-sm font-medium shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            >
              <UserCog className="w-4 h-4" />
              用户管理
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

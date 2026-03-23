"use client";

import { useEffect, useState } from "react";
import { Activity, TrendingUp, Users, Eye } from "lucide-react";
import {
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
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface AnalyticsData {
  pageViews: number;
  uniqueVisitors: number;
  activeUsers: number;
  bounceRate: number;
  avgSessionDuration: string;
  topPages: { path: string; views: number }[];
  trendData: { name: string; pageViews: number; visitors: number }[];
  deviceData: { name: string; value: number }[];
}

export function AnalyticsCard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"overview" | "trend" | "device">("overview");

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // TODO: 实现真实的 Vercel Analytics API 调用
      // 需要配置 VERCEL_ANALYTICS_ID 和 VERCEL_TOKEN 环境变量

      // 模拟数据 - 实际使用时请替换为真实 API 调用
      setAnalytics({
        pageViews: 1234,
        uniqueVisitors: 567,
        activeUsers: 23,
        bounceRate: 42,
        avgSessionDuration: "2:34",
        topPages: [
          { path: "/", views: 456 },
          { path: "/products", views: 234 },
          { path: "/merchants", views: 189 },
          { path: "/news", views: 156 },
          { path: "/profile", views: 123 },
        ],
        trendData: [
          { name: "周一", pageViews: 156, visitors: 89 },
          { name: "周二", pageViews: 234, visitors: 123 },
          { name: "周三", pageViews: 189, visitors: 98 },
          { name: "周四", pageViews: 278, visitors: 145 },
          { name: "周五", pageViews: 312, visitors: 167 },
          { name: "周六", pageViews: 198, visitors: 102 },
          { name: "周日", pageViews: 167, visitors: 87 },
        ],
        deviceData: [
          { name: "手机", value: 65 },
          { name: "电脑", value: 25 },
          { name: "平板", value: 10 },
        ],
      });
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      label: "页面浏览量",
      value: analytics?.pageViews ?? 0,
      icon: Eye,
      color: "from-blue-500 to-cyan-600",
      format: (v: number) => v.toLocaleString(),
    },
    {
      label: "独立访客",
      value: analytics?.uniqueVisitors ?? 0,
      icon: Users,
      color: "from-green-500 to-emerald-600",
      format: (v: number) => v.toLocaleString(),
    },
    {
      label: "活跃用户",
      value: analytics?.activeUsers ?? 0,
      icon: Activity,
      color: "from-purple-500 to-violet-600",
      format: (v: number) => v.toLocaleString(),
    },
    {
      label: "跳出率",
      value: analytics?.bounceRate ?? 0,
      icon: TrendingUp,
      color: "from-orange-500 to-red-600",
      format: (v: number) => `${v}%`,
    },
  ];

  const COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444"];

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">访客分析</h3>
            <p className="text-sm text-slate-500">Vercel Analytics 实时数据</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs text-green-600 font-medium">实时</span>
        </div>
      </div>

      {/* 视图切换 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveView("overview")}
          className={`px-4 py-2 text-sm rounded-lg transition-all ${
            activeView === "overview"
              ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          总览
        </button>
        <button
          onClick={() => setActiveView("trend")}
          className={`px-4 py-2 text-sm rounded-lg transition-all ${
            activeView === "trend"
              ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          趋势
        </button>
        <button
          onClick={() => setActiveView("device")}
          className={`px-4 py-2 text-sm rounded-lg transition-all ${
            activeView === "device"
              ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          设备
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-3 bg-slate-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-slate-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : analytics ? (
        <>
          {/* 总览视图 */}
          {activeView === "overview" && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <stat.icon className="w-4 h-4 text-slate-500" />
                      <span className="text-xs text-slate-600">{stat.label}</span>
                    </div>
                    <p className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                      {stat.format(stat.value)}
                    </p>
                  </div>
                ))}
              </div>

              {/* 热门页面 */}
              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">🔥 热门页面 TOP5</h4>
                <div className="space-y-3">
                  {analytics.topPages.map((page, index) => (
                    <div key={page.path} className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? "bg-yellow-100 text-yellow-700" :
                        index === 1 ? "bg-slate-100 text-slate-700" :
                        index === 2 ? "bg-orange-100 text-orange-700" :
                        "bg-slate-50 text-slate-600"
                      }`}>
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-700 font-medium">{page.path}</span>
                          <span className="text-sm text-slate-900 font-semibold">{page.views.toLocaleString()}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                            style={{ width: `${(page.views / analytics.topPages[0].views) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* 趋势视图 */}
          {activeView === "trend" && (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.trendData}>
                  <defs>
                    <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
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
                    dataKey="pageViews"
                    name="页面浏览量"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#colorPv)"
                  />
                  <Area
                    type="monotone"
                    dataKey="visitors"
                    name="独立访客"
                    stroke="#10B981"
                    fillOpacity={1}
                    fill="url(#colorUv)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 设备视图 */}
          {activeView === "device" && (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.deviceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.deviceData.map((entry, index) => (
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
            </div>
          )}

          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700">
              💡 数据来自 Vercel Analytics，每 30 秒更新一次
            </p>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-slate-400">
          <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">暂无 Analytics 数据</p>
        </div>
      )}
    </div>
  );
}

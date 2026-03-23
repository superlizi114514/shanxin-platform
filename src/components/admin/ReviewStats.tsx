'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';

interface ReviewStatsData {
  totalReviews: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  hiddenCount: number;
  reportCount: number;
  averageRating: number;
  approvalRate: number;
  trendData: Array<{
    date: string;
    approved: number;
    rejected: number;
    pending: number;
  }>;
  merchantRanking: Array<{
    merchantId: string;
    merchantName: string;
    averageRating: number;
    reviewCount: number;
  }>;
  pendingReports: Array<{
    id: string;
    reviewId: string;
    reason: string;
    reviewContent: string;
    reviewRating: number;
    createdAt: string;
  }>;
}

interface ReviewStatsProps {
  stats: ReviewStatsData;
  onNavigate?: (path: string) => void;
}

const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#6b7280'];

export function ReviewStats({ stats, onNavigate }: ReviewStatsProps) {
  // 状态卡片数据
  const statCards = [
    {
      title: '待审核',
      value: stats.pendingCount,
      trend: '+12%',
      trendDirection: 'up' as const,
      icon: '⏳',
      color: 'bg-amber-500',
      href: '/admin/reviews/list?status=pending',
    },
    {
      title: '已通过',
      value: stats.approvedCount,
      trend: '+5%',
      trendDirection: 'up' as const,
      icon: '✅',
      color: 'bg-green-500',
      href: '/admin/reviews/list?status=approved',
    },
    {
      title: '已拒绝',
      value: stats.rejectedCount,
      trend: '-3%',
      trendDirection: 'down' as const,
      icon: '❌',
      color: 'bg-red-500',
      href: '/admin/reviews/list?status=rejected',
    },
    {
      title: '待处理举报',
      value: stats.reportCount,
      trend: '-8%',
      trendDirection: 'down' as const,
      icon: '🚩',
      color: 'bg-purple-500',
      href: '/admin/reports',
    },
  ];

  return (
    <div className="grid gap-6">
      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card
            key={card.title}
            className="relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={() => onNavigate?.(card.href)}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 ${card.color} opacity-10 rounded-bl-full`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <span className="text-2xl">{card.icon}</span>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{card.value}</div>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`text-xs font-medium ${
                    card.trendDirection === 'up'
                      ? 'text-green-600'
                      : card.title === '已拒绝' || card.title === '待处理举报'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {card.trendDirection === 'up' ? '↑' : '↓'} {card.trend}
                </span>
                <span className="text-xs text-gray-500">较上周</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 趋势图表 */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>本周审核趋势</span>
            <Badge variant="secondary">近 7 天</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats.trendData}>
              <defs>
                <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorRejected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                className="text-xs"
              />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                labelFormatter={(date) => new Date(date).toLocaleDateString('zh-CN', { weekday: 'long', month: 'short', day: 'numeric' })}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="approved"
                stroke="#22c55e"
                fillOpacity={1}
                fill="url(#colorApproved)"
                name="通过"
              />
              <Area
                type="monotone"
                dataKey="rejected"
                stroke="#ef4444"
                fillOpacity={1}
                fill="url(#colorRejected)"
                name="拒绝"
              />
              <Area
                type="monotone"
                dataKey="pending"
                stroke="#f59e0b"
                fillOpacity={1}
                fill="url(#colorPending)"
                name="待审核"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 商家排行和举报处理 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 商家评分排行 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>商家评分排行</span>
              <Badge variant="outline">TOP 10</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.merchantRanking.slice(0, 5).map((merchant, i) => (
                <div key={merchant.merchantId} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                      i === 0 ? 'bg-yellow-100 text-yellow-700' :
                      i === 1 ? 'bg-gray-100 text-gray-700' :
                      i === 2 ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-50 text-gray-500'
                    }`}>
                      {i + 1}
                    </span>
                    <span className="font-medium text-gray-900">{merchant.merchantName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-yellow-500">
                      {'⭐'.repeat(Math.round(merchant.averageRating))}
                    </span>
                    <span className="text-gray-600 font-medium w-12 text-right">
                      {merchant.averageRating.toFixed(1)}
                    </span>
                    <span className="text-gray-400 text-xs w-16 text-right">
                      {merchant.reviewCount}条
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              className="w-full mt-4"
              onClick={() => onNavigate?.('/admin/merchants')}
            >
              查看全部 →
            </Button>
          </CardContent>
        </Card>

        {/* 待处理举报 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>待处理举报</span>
              <Badge variant="destructive">{stats.reportCount}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.pendingReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <span className="text-4xl mb-2">✅</span>
                <p>暂无待处理举报</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.pendingReports.slice(0, 5).map((report) => (
                  <div
                    key={report.id}
                    className="p-3 rounded-lg border border-red-100 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                    onClick={() => onNavigate?.(`/admin/reports/${report.id}`)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="destructive" className="text-xs">
                            {report.reason}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(report.createdAt).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 truncate">
                          {report.reviewContent}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">⭐{report.reviewRating}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button
              variant="ghost"
              className="w-full mt-4"
              onClick={() => onNavigate?.('/admin/reports')}
            >
              查看全部 →
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

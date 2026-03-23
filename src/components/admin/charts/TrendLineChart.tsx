"use client";

import { useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { DownloadIcon } from "lucide-react";

interface TrendLineChartProps {
  data: Array<{
    name: string;
    userGrowth: number;
    orderGrowth: number;
    productGrowth: number;
  }>;
  title?: string;
  height?: number;
  onDownload?: () => void;
}

/**
 * 趋势线图组件
 * 支持 7 天/30 天切换，展示用户、订单、商品增长趋势
 */
export function TrendLineChart({
  data,
  title = "增长趋势",
  height = 320,
  onDownload
}: TrendLineChartProps) {
  const [timeRange, setTimeRange] = useState<7 | 30>(7);

  const downloadChart = () => {
    if (onDownload) onDownload();
  };

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400">
        <div className="text-center">
          <p>暂无数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 z-10 flex items-center gap-2">
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 mr-2">
          <button
            onClick={() => setTimeRange(7)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              timeRange === 7
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            7 天
          </button>
          <button
            onClick={() => setTimeRange(30)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              timeRange === 30
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            30 天
          </button>
        </div>
        <button
          onClick={downloadChart}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          title="下载图表"
        >
          <DownloadIcon className="w-4 h-4 text-slate-500" />
        </button>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
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
          <Line
            type="monotone"
            dataKey="userGrowth"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ fill: "#3B82F6", r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="orderGrowth"
            stroke="#10B981"
            strokeWidth={2}
            dot={{ fill: "#10B981", r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="productGrowth"
            stroke="#F59E0B"
            strokeWidth={2}
            dot={{ fill: "#F59E0B", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

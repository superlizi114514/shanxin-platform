"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { DownloadIcon } from "lucide-react";

interface GrowthAreaChartProps {
  data: Array<{
    name: string;
    cumulativeUsers: number;
    cumulativeOrders: number;
    cumulativeProducts: number;
  }>;
  title?: string;
  height?: number;
  onDownload?: () => void;
}

/**
 * 增长面积图组件
 * 堆叠面积展示累计业务数据，渐变色填充
 */
export function GrowthAreaChart({
  data,
  title = "业务增长",
  height = 320,
  onDownload
}: GrowthAreaChartProps) {
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
      <div className="absolute top-0 right-0 z-10">
        <button
          onClick={downloadChart}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          title="下载图表"
        >
          <DownloadIcon className="w-4 h-4 text-slate-500" />
        </button>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorCumulativeUsers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorCumulativeOrders" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorCumulativeProducts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
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
            dataKey="cumulativeUsers"
            stroke="#3B82F6"
            fillOpacity={1}
            fill="url(#colorCumulativeUsers)"
          />
          <Area
            type="monotone"
            dataKey="cumulativeOrders"
            stroke="#10B981"
            fillOpacity={1}
            fill="url(#colorCumulativeOrders)"
          />
          <Area
            type="monotone"
            dataKey="cumulativeProducts"
            stroke="#F59E0B"
            fillOpacity={1}
            fill="url(#colorCumulativeProducts)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

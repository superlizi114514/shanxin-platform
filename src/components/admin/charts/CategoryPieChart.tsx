"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { DownloadIcon } from "lucide-react";

interface CategoryPieChartProps {
  data: Array<{ name: string; value: number }>;
  title?: string;
  height?: number;
  onDownload?: () => void;
}

const COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899", "#6366F1"];

/**
 * 分类饼图组件
 * 用于展示商品分类、商家分类等占比数据
 */
export function CategoryPieChart({
  data,
  title = "分类分布",
  height = 320,
  onDownload
}: CategoryPieChartProps) {
  const downloadChart = () => {
    if (onDownload) onDownload();
    // 实际项目中可使用 html-to-image 等库实现下载
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

  const total = data.reduce((sum, item) => sum + item.value, 0);

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
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
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
  );
}

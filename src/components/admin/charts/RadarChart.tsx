"use client";

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, Legend } from "recharts";
import { DownloadIcon } from "lucide-react";

interface RadarChartProps {
  data: Array<{ subject: string; value: number }>;
  title?: string;
  height?: number;
  onDownload?: () => void;
}

/**
 * 雷达图组件
 * 展示平台健康度 6 维度评估
 */
export function RadarChartComponent({
  data,
  title = "平台健康度",
  height = 320,
  onDownload
}: RadarChartProps) {
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

  // 计算综合得分
  const avgScore = Math.round(data.reduce((sum, item) => sum + item.value, 0) / data.length);

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 z-10 flex items-center gap-2 mr-4">
        <div className="text-right">
          <p className="text-xs text-slate-500">综合得分</p>
          <p className={`text-lg font-bold ${
            avgScore >= 80 ? "text-green-600" :
            avgScore >= 60 ? "text-yellow-600" :
            "text-red-600"
          }`}>
            {avgScore}
          </p>
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
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={11} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#64748b" fontSize={11} tickCount={5} />
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
    </div>
  );
}

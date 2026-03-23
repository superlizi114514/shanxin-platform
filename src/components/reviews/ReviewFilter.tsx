"use client";

import { cn } from "@/lib/utils";
import { StarIcon } from "lucide-react";

interface ReviewFilterProps {
  currentFilter: "all" | 5 | 4 | 3 | 2 | 1;
  onFilterChange: (filter: "all" | 5 | 4 | 3 | 2 | 1) => void;
  className?: string;
  ratingCounts?: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  total?: number;
}

/**
 * 点评过滤器组件
 *
 * 功能：
 * - 按评分筛选 (全部/5 星/4 星/3 星/2 星/1 星)
 * - 可选显示各评分数量
 *
 * @example
 * <ReviewFilter
 *   currentFilter={currentFilter}
 *   onFilterChange={setFilter}
 *   ratingCounts={counts}
 *   total={100}
 * />
 */
export function ReviewFilter({
  currentFilter,
  onFilterChange,
  className,
  ratingCounts,
  total,
}: ReviewFilterProps) {
  const filters: { value: "all" | 5 | 4 | 3 | 2 | 1; label: string }[] = [
    { value: "all", label: "全部" },
    { value: 5, label: "5 星" },
    { value: 4, label: "4 星" },
    { value: 3, label: "3 星" },
    { value: 2, label: "2 星" },
    { value: 1, label: "1 星" },
  ];

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-sm text-gray-500">筛选:</span>
      <div className="flex flex-wrap items-center gap-1">
        {filters.map((filter) => {
          const isSelected = currentFilter === filter.value;
          const count = filter.value === "all"
            ? total
            : ratingCounts?.[filter.value as 5 | 4 | 3 | 2 | 1];

          return (
            <button
              key={filter.value}
              onClick={() => onFilterChange(filter.value)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium",
                "transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
                isSelected
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              )}
            >
              {filter.value === "all" ? (
                <span>全部</span>
              ) : (
                <>
                  <StarIcon
                    className={cn(
                      "w-4 h-4",
                      isSelected ? "fill-white" : "fill-amber-500 text-amber-500"
                    )}
                  />
                  <span>{filter.label}</span>
                </>
              )}
              {count !== undefined && count !== null && (
                <span
                  className={cn(
                    "text-xs px-1.5 py-0.5 rounded",
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-600"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

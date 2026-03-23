"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { StarIcon } from "lucide-react";

interface StarRatingProps {
  rating: number;           // 当前评分 (1-5)
  onRatingChange?: (r: number) => void;  // 回调函数，未提供则为只读
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

/**
 * 评分星级组件
 *
 * 功能特性:
 * - 支持只读/可编辑两种模式
 * - 键盘导航 (ArrowLeft/ArrowRight 选择评分)
 * - Hover 效果：未选中的星星半透明，hover 时高亮
 * - 选中状态：实心星星 + 主题色填充
 * - 无障碍支持 (ARIA 标签)
 *
 * @example
 * // 只读模式
 * <StarRating rating={4} readOnly />
 *
 * @example
 * // 可编辑模式
 * <StarRating rating={rating} onRatingChange={setRating} />
 */
export function StarRating({
  rating,
  onRatingChange,
  size = 'md',
  readOnly = false,
  className,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const [isFocused, setIsFocused] = useState(false);

  const handleRatingChange = useCallback((newRating: number) => {
    if (readOnly) return;
    onRatingChange?.(newRating);
  }, [readOnly, onRatingChange]);

  // 键盘事件处理
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (readOnly) return;

    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        e.preventDefault();
        handleRatingChange(Math.min(5, rating + 1));
        break;
      case "ArrowLeft":
      case "ArrowDown":
        e.preventDefault();
        handleRatingChange(Math.max(1, rating - 1));
        break;
      case "Home":
        e.preventDefault();
        handleRatingChange(1);
        break;
      case "End":
        e.preventDefault();
        handleRatingChange(5);
        break;
    }
  }, [readOnly, rating, handleRatingChange]);

  const starSize = sizeClasses[size];
  const currentRating = hoverRating || rating;

  return (
    <div
      className={cn(
        "flex items-center gap-0.5",
        !readOnly && "cursor-pointer",
        className
      )}
      role={readOnly ? "img" : "slider"}
      aria-label={readOnly ? `${rating} 星评分` : `当前评分：${rating} 星，使用方向键选择评分`}
      aria-valuemin={1}
      aria-valuemax={5}
      aria-valuenow={rating}
      tabIndex={readOnly ? -1 : 0}
      onKeyDown={handleKeyDown}
      onFocus={() => !readOnly && setIsFocused(true)}
      onBlur={() => !readOnly && setIsFocused(false)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= currentRating;
        const isHovered = star <= hoverRating;

        return (
          <button
            key={star}
            type="button"
            className={cn(
              "transition-all duration-150",
              "focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 rounded",
              isFocused && "ring-2 ring-amber-500 ring-offset-1"
            )}
            onClick={() => handleRatingChange(star)}
            onMouseEnter={() => !readOnly && setHoverRating(star)}
            onMouseLeave={() => !readOnly && setHoverRating(0)}
            disabled={readOnly}
            aria-label={`${star} 星`}
          >
            <StarIcon
              className={cn(
                starSize,
                "transition-colors duration-150",
                isFilled
                  ? "fill-amber-500 text-amber-500"
                  : isHovered && !readOnly
                  ? "text-amber-400"
                  : "text-gray-300"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

/**
 * 只读评分展示组件（用于评论卡片等只读场景）
 */
export function StarRatingDisplay({
  rating,
  size = 'md',
  className,
  showValue = false,
}: {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showValue?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <StarRating rating={rating} size={size} readOnly />
      {showValue && (
        <span className={cn(
          "font-medium text-gray-700",
          size === 'sm' && "text-xs",
          size === 'md' && "text-sm",
          size === 'lg' && "text-base"
        )}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

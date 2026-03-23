"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { ReviewCard, ReviewWithUser } from "./ReviewCard";
import { ReviewFilter } from "./ReviewFilter";
import { EmptyState } from "@/components/EmptyState";
import { Loader2Icon } from "lucide-react";

interface ReviewListProps {
  merchantId?: string;      // 按商家筛选
  userId?: string;          // 按用户筛选
  sortBy?: "newest" | "highest" | "lowest" | "helpful";
  pageSize?: number;
  showFilter?: boolean;
  className?: string;
}

type SortOption = {
  value: "newest" | "highest" | "lowest" | "helpful";
  label: string;
};

const SORT_OPTIONS: SortOption[] = [
  { value: "newest", label: "最新发布" },
  { value: "highest", label: "评分最高" },
  { value: "lowest", label: "评分最低" },
  { value: "helpful", label: "最有帮助" },
];

interface ReviewListResponse {
  reviews: ReviewWithUser[];
  total: number;
  page: number;
  pageSize: number;
  averageRating?: number;
}

/**
 * 点评列表组件
 *
 * 功能特性:
 * - 分页加载 (滚动加载更多)
 * - 排序 (最新/高分/低分/有帮助)
 * - 筛选 (按评分)
 * - 空状态处理
 * - 加载状态
 *
 * @example
 * <ReviewList
 *   merchantId="xxx"
 *   sortBy="newest"
 *   pageSize={20}
 * />
 */
export function ReviewList({
  merchantId,
  userId,
  sortBy = "newest",
  pageSize = 20,
  showFilter = true,
  className,
}: ReviewListProps) {
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sortOption, setSortOption] = useState(sortBy);
  const [ratingFilter, setRatingFilter] = useState<"all" | 5 | 4 | 3 | 2 | 1>("all");
  const [error, setError] = useState<string | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 加载点评列表
  const loadReviews = useCallback(async (pageNum: number, reset = false) => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        pageSize: String(pageSize),
        sortBy: sortOption,
      });

      if (merchantId) params.set("merchantId", merchantId);
      if (userId) params.set("userId", userId);
      if (ratingFilter !== "all") params.set("rating", String(ratingFilter));

      const response = await fetch(`/api/reviews?${params}`);

      if (!response.ok) {
        throw new Error("加载失败");
      }

      const data: ReviewListResponse = await response.json();

      setReviews((prev) => (reset ? data.reviews : [...prev, ...data.reviews]));
      setTotal(data.total);
      setHasMore(data.reviews.length === pageSize);
    } catch (err) {
      console.error("Load reviews error:", err);
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [merchantId, userId, pageSize, sortOption, ratingFilter, loading]);

  // 初始加载和筛选变化时重新加载
  useEffect(() => {
    setPage(1);
    setReviews([]);
    loadReviews(1, true);
  }, [merchantId, userId, sortOption, ratingFilter]);

  // 加载更多
  useEffect(() => {
    if (loading || !hasMore) return;

    const callback: IntersectionObserverCallback = (entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        const nextPage = page + 1;
        setPage(nextPage);
        loadReviews(nextPage);
      }
    };

    observerRef.current = new IntersectionObserver(callback, {
      root: null,
      rootMargin: "100px",
      threshold: 0.1,
    });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [page, loading, hasMore, loadReviews]);

  // 处理点赞
  const handleHelpful = async (reviewId: string) => {
    try {
      await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Helpful error:", error);
    }
  };

  // 处理举报
  const handleReport = async (reviewId: string, reason: string) => {
    try {
      await fetch(`/api/reviews/${reviewId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, reason }),
      });
    } catch (error) {
      console.error("Report error:", error);
      throw error;
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {/* 顶部控制栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        {showFilter && (
          <ReviewFilter
            currentFilter={ratingFilter}
            onFilterChange={setRatingFilter}
          />
        )}

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">排序:</span>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption["value"])}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 点评数量统计 */}
      <div className="mb-4 text-sm text-gray-600">
        共 <span className="font-medium text-gray-900">{total}</span> 条评价
      </div>

      {/* 点评列表 */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            showActions
            onHelpful={handleHelpful}
            onReport={handleReport}
          />
        ))}
      </div>

      {/* 空状态 */}
      {reviews.length === 0 && !loading && (
        <EmptyState
          type="default"
          title="暂无点评"
          description="成为第一个发表评论的人吧！"
        />
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="flex justify-center py-8">
          <Loader2Icon className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}

      {/* 加载更多触发器 */}
      <div ref={loadMoreRef} className="h-10" />

      {/* 没有更多数据 */}
      {!hasMore && reviews.length > 0 && (
        <div className="text-center py-4 text-sm text-gray-500">
          没有更多评论了
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div className="text-center py-4">
          <p className="text-red-500 text-sm">{error}</p>
          <button
            onClick={() => loadReviews(1, true)}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            重试
          </button>
        </div>
      )}
    </div>
  );
}

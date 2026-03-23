"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { StarRating } from "./StarRating";
import {
  ThumbsUpIcon,
  FlagIcon,
  MoreVerticalIcon,
  Trash2Icon,
  EditIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  EyeOffIcon,
  XIcon,
} from "lucide-react";

export interface ReviewWithUser {
  id: string;
  userId: string;
  merchantId: string;
  content: string;
  rating: number;
  images: string[];
  helpfulCount: number;
  reportCount: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar?: string | null;
    isVerified?: boolean;
  };
  status?: "pending" | "approved" | "rejected" | "hidden";
  isHelpful?: boolean;  // 当前用户是否已点赞
}

interface ReviewCardProps {
  review: ReviewWithUser;
  showActions?: boolean;
  onHelpful?: (id: string) => void;
  onReport?: (id: string, reason: string) => void;
  onEdit?: (review: ReviewWithUser) => void;
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
  showAdminActions?: boolean;
  onAudit?: (id: string, action: "approve" | "reject" | "hide" | "delete", reason?: string) => void;
}

/**
 * 点评卡片组件
 *
 * 展示内容:
 * - 用户信息 (头像、昵称、实名认证标识)
 * - 评分和发布时间
 * - 点评内容和图片
 * - 点赞/举报操作
 *
 * @example
 * <ReviewCard
 *   review={reviewData}
 *   showActions
 *   onHelpful={handleHelpful}
 *   onReport={handleReport}
 * />
 */
export function ReviewCard({
  review,
  showActions = true,
  onHelpful,
  onReport,
  onEdit,
  onDelete,
  isAdmin = false,
  showAdminActions = false,
  onAudit,
}: ReviewCardProps) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const [localHelpful, setLocalHelpful] = useState(review.isHelpful ?? false);
  const [localHelpfulCount, setLocalHelpfulCount] = useState(review.helpfulCount);

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // 处理点赞
  const handleHelpful = async () => {
    if (!onHelpful) return;

    if (localHelpful) {
      showToast("info", "您已经点过赞了");
      return;
    }

    setLocalHelpful(true);
    setLocalHelpfulCount((prev) => prev + 1);
    onHelpful(review.id);
  };

  // 处理举报
  const handleSubmitReport = async () => {
    if (!reportReason.trim()) {
      showToast("error", "请选择或填写举报原因");
      return;
    }

    setIsSubmitting(true);
    try {
      await onReport?.(review.id, reportReason);
      showToast("success", "举报已提交");
      setShowReportModal(false);
      setReportReason("");
    } catch {
      showToast("error", "举报失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理审核操作
  const handleAudit = async (action: "approve" | "reject" | "hide" | "delete", reason?: string) => {
    if (!onAudit) return;

    if (action === "reject" && !reason) {
      showToast("error", "请填写拒绝理由");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAudit(review.id, action, reason);
      showToast("success", `审核操作已执行：${action}`);
    } catch {
      showToast("error", "操作失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 格式化时间
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "今天";
    if (days === 1) return "昨天";
    if (days < 7) return `${days}天前`;
    if (days < 30) return `${Math.floor(days / 7)}周前`;
    if (days < 365) return `${Math.floor(days / 30)}个月前`;
    return date.toLocaleDateString("zh-CN");
  };

  // 获取状态标识
  const getStatusBadge = () => {
    switch (review.status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
            <ClockIcon className="w-3 h-3" />
            待审核
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
            <CheckCircleIcon className="w-3 h-3" />
            已通过
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
            <XCircleIcon className="w-3 h-3" />
            已拒绝
          </span>
        );
      case "hidden":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
            <EyeOffIcon className="w-3 h-3" />
            已隐藏
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "bg-white rounded-xl p-4 border border-gray-100",
      "transition-all duration-200",
      showActions && "hover:shadow-md"
    )}>
      {/* Toast 提示 */}
      {toast && (
        <div className={cn(
          "flex items-center justify-between p-3 mb-4 rounded-lg border shadow-md",
          toast.type === "success" && "bg-green-50 border-green-200 text-green-800",
          toast.type === "error" && "bg-red-50 border-red-200 text-red-800",
          toast.type === "info" && "bg-blue-50 border-blue-200 text-blue-800"
        )}>
          <span className="text-sm">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-gray-400 hover:text-gray-600"
            aria-label="关闭"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 头部：用户信息 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-medium text-sm">
            {review.user.avatar ? (
              <img
                src={review.user.avatar}
                alt={review.user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              review.user.name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">
                {review.user.name}
              </span>
              {review.user.isVerified && (
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
                  title="实名认证用户"
                >
                  <CheckCircleIcon className="w-3 h-3" />
                  已实名
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRating rating={review.rating} size="sm" readOnly />
              <span className="text-xs text-gray-500">
                {formatDate(review.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* 状态标识 (管理员可见) */}
        {isAdmin && review.status && (
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {showAdminActions && (
              <div className="relative group">
                <button className="p-1 hover:bg-gray-100 rounded">
                  <MoreVerticalIcon className="w-4 h-4 text-gray-500" />
                </button>
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 hidden group-hover:block">
                  <button
                    onClick={() => handleAudit("approve")}
                    className="w-full px-3 py-1.5 text-left text-sm text-green-600 hover:bg-green-50"
                  >
                    通过
                  </button>
                  <button
                    onClick={() => handleAudit("reject", "内容不符合规范")}
                    className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    拒绝
                  </button>
                  <button
                    onClick={() => handleAudit("hide")}
                    className="w-full px-3 py-1.5 text-left text-sm text-gray-600 hover:bg-gray-50"
                  >
                    隐藏
                  </button>
                  <button
                    onClick={() => handleAudit("delete")}
                    className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50 border-t"
                  >
                    删除
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 作者操作 */}
        {!isAdmin && onEdit && onDelete && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(review)}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="编辑"
            >
              <EditIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(review.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="删除"
            >
              <Trash2Icon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 内容 */}
      <div className="mb-3">
        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
          {review.content}
        </p>
      </div>

      {/* 图片 */}
      {review.images && review.images.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {review.images.map((img, index) => (
            <div
              key={index}
              className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
            >
              <img
                src={img}
                alt={`点评图片 ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {/* 底部操作栏 */}
      {showActions && (
        <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
          <button
            onClick={handleHelpful}
            disabled={localHelpful}
            className={cn(
              "flex items-center gap-1.5 text-sm transition-colors",
              localHelpful
                ? "text-blue-600"
                : "text-gray-500 hover:text-blue-600"
            )}
          >
            <ThumbsUpIcon className="w-4 h-4" />
            <span>{localHelpfulCount}</span>
          </button>
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            <FlagIcon className="w-4 h-4" />
            <span>举报</span>
          </button>
        </div>
      )}

      {/* 举报弹窗 */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              举报点评
            </h3>
            <div className="space-y-3 mb-6">
              {[
                { value: "spam", label: "垃圾广告" },
                { value: "fake", label: "虚假内容" },
                { value: "inappropriate", label: "不当内容" },
                { value: "hate", label: "仇恨言论" },
                { value: "other", label: "其他" },
              ].map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    reportReason === option.label
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={option.label}
                    checked={reportReason === option.label}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason("");
                }}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmitReport}
                disabled={isSubmitting || !reportReason}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "提交中..." : "提交举报"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

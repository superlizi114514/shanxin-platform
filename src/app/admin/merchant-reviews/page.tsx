"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface MerchantReview {
  id: string;
  merchantId: string;
  userId: string;
  rating: number;
  content: string;
  status: string;
  reportCount: number;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    studentId: string | null;
  } | null;
  merchant: {
    id: string;
    name: string;
    address: string | null;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminMerchantReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<MerchantReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    status: "pending",
  });
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [auditAction, setAuditAction] = useState<"approved" | "rejected" | null>(null);

  const fetchReviews = async (page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        status: filters.status,
      });

      const response = await fetch(`/api/admin/merchant-reviews?${params}`);
      const data = await response.json();

      if (response.ok) {
        setReviews(data.data.reviews);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error("获取点评列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [filters]);

  const handleSelectReview = (reviewId: string) => {
    setSelectedReviews((prev) =>
      prev.includes(reviewId) ? prev.filter((id) => id !== reviewId) : [...prev, reviewId]
    );
  };

  const handleSelectAll = () => {
    if (selectedReviews.length === reviews.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(reviews.map((review) => review.id));
    }
  };

  const handleBatchAudit = async (status: "approved" | "rejected") => {
    if (selectedReviews.length === 0) {
      alert("请选择要审核的点评");
      return;
    }

    if (status === "rejected") {
      setAuditAction(status);
      setShowRejectModal(true);
      return;
    }

    await submitAudit(status);
  };

  const submitAudit = async (status: "approved" | "rejected", reason?: string) => {
    try {
      const response = await fetch("/api/admin/merchant-reviews/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewIds: selectedReviews,
          status,
          rejectReason: reason,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || "审核成功");
        setSelectedReviews([]);
        fetchReviews();
      } else {
        alert(data.error || "审核失败");
      }
    } catch (error) {
      console.error("审核失败:", error);
      alert("审核失败，请重试");
    }
  };

  const handleSingleAudit = async (reviewId: string, status: "approved" | "rejected") => {
    if (status === "rejected") {
      const reason = prompt("请输入拒绝原因：");
      if (!reason) return;
      await submitAudit(status, reason);
    } else {
      await submitAudit(status);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    };
    return badges[status] || "bg-gray-100 text-gray-700";
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: "审核中",
      approved: "已通过",
      rejected: "已拒绝",
    };
    return texts[status] || status;
  };

  const getRatingStars = (rating: number) => {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">商家点评审核管理</h1>
            <Link
              href="/admin"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              返回管理后台
            </Link>
          </div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-wrap gap-3">
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">审核中</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>
        </div>
      </div>

      {/* 批量操作区 */}
      {selectedReviews.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">已选择 {selectedReviews.length} 个点评</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBatchAudit("approved")}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  批量通过
                </button>
                <button
                  onClick={() => handleBatchAudit("rejected")}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  批量拒绝
                </button>
                <button
                  onClick={() => setSelectedReviews([])}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                >
                  取消选择
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 内容区 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-500">加载中...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">暂无点评数据</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedReviews.length === reviews.length && reviews.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      点评内容
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      商家
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      评分
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      发布者
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      举报数
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      状态
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      发布时间
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reviews.map((review) => (
                    <tr key={review.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedReviews.includes(review.id)}
                          onChange={() => handleSelectReview(review.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-xs">
                          <div className="text-sm text-gray-900 line-clamp-2">{review.content}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {review.merchant?.name || "未知商家"}
                        </div>
                        {review.merchant?.address && (
                          <div className="text-xs text-gray-500 truncate max-w-[150px]">
                            {review.merchant.address}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-yellow-500">{getRatingStars(review.rating)}</span>
                        <span className="text-sm text-gray-600 ml-1">{review.rating}分</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">
                          {review.user?.name || review.user?.email || "匿名用户"}
                        </div>
                        {review.user?.studentId && (
                          <div className="text-xs text-gray-500">{review.user.studentId}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm ${review.reportCount > 0 ? "text-red-600" : "text-gray-500"}`}>
                          {review.reportCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(review.status)}`}>
                          {getStatusText(review.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString("zh-CN")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {review.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleSingleAudit(review.id, "approved")}
                                className="text-green-600 hover:text-green-800 text-sm"
                              >
                                通过
                              </button>
                              <button
                                onClick={() => handleSingleAudit(review.id, "rejected")}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                拒绝
                              </button>
                            </>
                          )}
                          {review.status === "approved" && (
                            <button
                              onClick={() => handleSingleAudit(review.id, "rejected")}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              下架
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => fetchReviews(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <span className="text-sm text-gray-600">
                  第 {pagination.page} / {pagination.totalPages} 页
                </span>
                <button
                  onClick={() => fetchReviews(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 拒绝原因弹窗 */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">填写拒绝原因</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入拒绝原因，以便用户了解..."
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  if (!rejectReason.trim()) {
                    alert("请输入拒绝原因");
                    return;
                  }
                  submitAudit(auditAction as "rejected", rejectReason);
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                确认拒绝
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                  setAuditAction(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

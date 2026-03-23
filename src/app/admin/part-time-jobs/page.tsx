"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PartTimeJob {
  id: string;
  title: string;
  description: string;
  jobType: string;
  salary: string;
  location: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    studentId: string | null;
  } | null;
  company: {
    id: string;
    name: string;
  } | null;
  applications: {
    id: string;
    status: string;
    createdAt: string;
    user: {
      id: string;
      name: string | null;
      phone: string | null;
    } | null;
  }[];
  _count: {
    applications: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminPartTimeJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<PartTimeJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    status: "pending",
    jobType: "",
  });
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [auditAction, setAuditAction] = useState<"approved" | "rejected" | "closed" | null>(null);

  const fetchJobs = async (page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        status: filters.status,
        ...(filters.jobType && { jobType: filters.jobType }),
      });

      const response = await fetch(`/api/admin/part-time-jobs?${params}`);
      const data = await response.json();

      if (response.ok) {
        setJobs(data.data.jobs);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error("获取兼职列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const handleSelectJob = (jobId: string) => {
    setSelectedJobs((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };

  const handleSelectAll = () => {
    if (selectedJobs.length === jobs.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(jobs.map((job) => job.id));
    }
  };

  const handleBatchAudit = async (status: "approved" | "rejected" | "closed") => {
    if (selectedJobs.length === 0) {
      alert("请选择要审核的兼职");
      return;
    }

    if (status === "rejected") {
      setAuditAction(status);
      setShowRejectModal(true);
      return;
    }

    await submitAudit(status);
  };

  const submitAudit = async (status: "approved" | "rejected" | "closed", reason?: string) => {
    try {
      const response = await fetch("/api/admin/part-time-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobIds: selectedJobs,
          status,
          rejectReason: reason,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || "审核成功");
        setSelectedJobs([]);
        fetchJobs();
      } else {
        alert(data.error || "审核失败");
      }
    } catch (error) {
      console.error("审核失败:", error);
      alert("审核失败，请重试");
    }
  };

  const handleSingleAudit = async (jobId: string, status: "approved" | "rejected" | "closed") => {
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
      closed: "bg-gray-100 text-gray-700",
    };
    return badges[status] || "bg-gray-100 text-gray-700";
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: "审核中",
      approved: "已通过",
      rejected: "已拒绝",
      closed: "已关闭",
    };
    return texts[status] || status;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">兼职审核管理</h1>
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
              <option value="all">全部状态</option>
            </select>
            <select
              value={filters.jobType}
              onChange={(e) => setFilters((prev) => ({ ...prev, jobType: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">所有类型</option>
              <option value="长期">长期</option>
              <option value="短期">短期</option>
              <option value="实习">实习</option>
            </select>
          </div>
        </div>
      </div>

      {/* 批量操作区 */}
      {selectedJobs.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">已选择 {selectedJobs.length} 个兼职</span>
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
                  onClick={() => handleBatchAudit("closed")}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                >
                  批量关闭
                </button>
                <button
                  onClick={() => setSelectedJobs([])}
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
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">暂无兼职数据</p>
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
                        checked={selectedJobs.length === jobs.length && jobs.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      兼职信息
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      发布者
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      类型
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      薪资
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      申请数
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
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedJobs.includes(job.id)}
                          onChange={() => handleSelectJob(job.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-xs">
                          <div className="font-medium text-gray-900 truncate">{job.title}</div>
                          <div className="text-xs text-gray-500 truncate">{job.location}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">
                          {job.user?.name || job.user?.email || "匿名用户"}
                        </div>
                        {job.user?.studentId && (
                          <div className="text-xs text-gray-500">{job.user.studentId}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700">{job.jobType}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-orange-600">{job.salary}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700">{job._count.applications}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(job.status)}`}>
                          {getStatusText(job.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-500">
                          {new Date(job.createdAt).toLocaleDateString("zh-CN")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {job.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleSingleAudit(job.id, "approved")}
                                className="text-green-600 hover:text-green-800 text-sm"
                              >
                                通过
                              </button>
                              <button
                                onClick={() => handleSingleAudit(job.id, "rejected")}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                拒绝
                              </button>
                            </>
                          )}
                          <Link
                            href={`/part-time-jobs/${job.id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            查看
                          </Link>
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
                  onClick={() => fetchJobs(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <span className="text-sm text-gray-600">
                  第 {pagination.page} / {pagination.totalPages} 页
                </span>
                <button
                  onClick={() => fetchJobs(pagination.page + 1)}
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

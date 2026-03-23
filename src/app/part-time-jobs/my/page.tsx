"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface PartTimeJob {
  id: string;
  title: string;
  description: string;
  jobType: string;
  salary: string;
  location: string;
  status: string;
  views: number;
  applicationCount: number;
  createdAt: string;
  images: {
    id: string;
    url: string;
    position: number;
  }[];
}

export default function MyPartTimeJobsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [jobs, setJobs] = useState<PartTimeJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "50",
        myJobs: "true",
      });

      const response = await fetch(`/api/part-time-jobs?${params}`);
      const data = await response.json();

      if (response.ok) {
        setJobs(data.data.jobs);
      }
    } catch (error) {
      console.error("获取兼职列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDelete = async (jobId: string) => {
    if (!confirm("确定要删除该兼职吗？")) return;

    try {
      const response = await fetch(`/api/part-time-jobs/${jobId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("兼职已删除");
        fetchJobs();
      } else {
        const data = await response.json();
        alert(data.error || "删除失败");
      }
    } catch (error) {
      console.error("删除失败:", error);
      alert("删除失败");
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

  const getJobTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      "长期": "长期",
      "短期": "短期",
      "实习": "实习",
    };
    return labels[type] || type;
  };

  const getJobTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      "长期": "bg-blue-100 text-blue-700",
      "短期": "bg-green-100 text-green-700",
      "实习": "bg-purple-100 text-purple-700",
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  const filteredJobs = filter === "all" ? jobs : jobs.filter((job) => job.status === filter);

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">请先登录后查看</p>
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">我的兼职</h1>
            <Link
              href="/part-time-jobs/create"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              发布兼职
            </Link>
          </div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto">
            {[
              { value: "all", label: "全部" },
              { value: "pending", label: "审核中" },
              { value: "approved", label: "已通过" },
              { value: "rejected", label: "已拒绝" },
              { value: "closed", label: "已关闭" },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setFilter(item.value)}
                className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  filter === item.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 内容区 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-500">加载中...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {filter === "all" ? "暂无发布的兼职" : `暂无${getStatusText(filter)}的兼职`}
            </p>
            {filter === "all" && (
              <Link
                href="/part-time-jobs/create"
                className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                发布第一个兼职
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all"
              >
                {/* 封面图 */}
                {job.images.length > 0 && (
                  <Link href={`/part-time-jobs/${job.id}`}>
                    <div className="relative h-40 -mx-4 -mt-4 mb-3 overflow-hidden rounded-t-xl">
                      <img
                        src={job.images[0].url}
                        alt={job.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Link>
                )}

                {/* 标题和状态 */}
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
                    {job.title}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(job.status)}`}>
                    {getStatusText(job.status)}
                  </span>
                </div>

                {/* 描述 */}
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {job.description}
                </p>

                {/* 标签 */}
                <div className="flex items-center gap-2 mt-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${getJobTypeColor(job.jobType)}`}>
                    {getJobTypeLabel(job.jobType)}
                  </span>
                </div>

                {/* 薪资和地点 */}
                <div className="mt-3 space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="font-medium text-orange-600">{job.salary}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 011.414-11.316l4.244 4.243a1.998 1.998 0 002.827 0l4.244-4.243a8 8 0 011.414 11.316z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{job.location}</span>
                  </div>
                </div>

                {/* 底部信息 */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t text-xs text-gray-500">
                  <span>浏览 {job.views}</span>
                  <span>申请 {job.applicationCount}</span>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2 mt-3">
                  <Link
                    href={`/part-time-jobs/${job.id}`}
                    className="flex-1 px-3 py-2 text-center bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                  >
                    查看
                  </Link>
                  {job.status !== "closed" && (
                    <Link
                      href={`/part-time-jobs/${job.id}/edit`}
                      className="flex-1 px-3 py-2 text-center bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
                    >
                      编辑
                    </Link>
                  )}
                  <button
                    onClick={() => handleDelete(job.id)}
                    className="px-3 py-2 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

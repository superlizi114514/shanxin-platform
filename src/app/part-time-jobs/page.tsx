"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/Skeleton";

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
  user: {
    id: string;
    name: string | null;
    avatar: string | null;
    phone: string | null;
  } | null;
  company: {
    id: string;
    name: string;
    logo: string | null;
    address: string | null;
  } | null;
  images: {
    id: string;
    url: string;
    position: number;
  }[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function PartTimeJobsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [jobs, setJobs] = useState<PartTimeJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    jobType: "",
    status: "approved",
  });

  const fetchJobs = async (page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...filters,
      });

      const response = await fetch(`/api/part-time-jobs?${params}`);
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

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const getJobTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      长期: "长期",
      短期: "短期",
      实习: "实习",
    };
    return labels[type] || type;
  };

  const getJobTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      长期: "bg-blue-100 text-blue-700",
      短期: "bg-green-100 text-green-700",
      实习: "bg-purple-100 text-purple-700",
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">兼职信息</h1>
            {session?.user && (
              <Link
                href="/part-time-jobs/create"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                发布兼职
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-wrap gap-3">
            <select
              value={filters.jobType}
              onChange={(e) => handleFilterChange("jobType", e.target.value)}
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

      {/* 内容区 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="relative h-40 -mx-4 -mt-4 mb-3 overflow-hidden rounded-t-xl">
                  <Skeleton className="w-full h-full" />
                </div>
                <Skeleton className="h-5 w-3/4" />
                <div className="space-y-2 mt-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Skeleton className="h-5 w-12 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <div className="mt-3 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">暂无兼职信息</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/part-time-jobs/${job.id}`}
                  className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:border-blue-300 transition-all"
                >
                  {/* 封面图 */}
                  {job.images.length > 0 && (
                    <div className="relative h-40 -mx-4 -mt-4 mb-3 overflow-hidden rounded-t-xl">
                      <img
                        src={job.images[0].url}
                        alt={job.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* 标题 */}
                  <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
                    {job.title}
                  </h3>

                  {/* 描述 */}
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {job.description}
                  </p>

                  {/* 标签 */}
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${getJobTypeColor(job.jobType)}`}>
                      {getJobTypeLabel(job.jobType)}
                    </span>
                    {job.company && (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                        {job.company.name}
                      </span>
                    )}
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
                </Link>
              ))}
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
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";

interface PartTimeJob {
  id: string;
  title: string;
  description: string;
  jobType: string;
  salary: string;
  location: string;
  contactInfo: string;
  status: string;
  views: number;
  applicationCount: number;
  createdAt: string;
  expiresAt: string | null;
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
    phone: string | null;
  } | null;
  images: {
    id: string;
    url: string;
    position: number;
  }[];
}

export default function PartTimeJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [job, setJob] = useState<PartTimeJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState("");

  const jobId = params.id as string;

  useEffect(() => {
    const fetchJob = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/part-time-jobs/${jobId}`);
        const data = await response.json();

        if (response.ok) {
          setJob(data);
        }
      } catch (error) {
        console.error("获取兼职详情失败:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  const handleApply = async () => {
    if (!session?.user) {
      router.push("/login");
      return;
    }

    if (!job || job.status !== "approved") {
      alert("该兼职已关闭或正在审核中");
      return;
    }

    setApplying(true);
    try {
      const response = await fetch(`/api/part-time-jobs/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: applicationMessage,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("申请成功！");
        setApplicationMessage("");
      } else {
        alert(data.error || "申请失败");
      }
    } catch (error) {
      console.error("申请失败:", error);
      alert("申请失败，请重试");
    } finally {
      setApplying(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除该兼职吗？")) return;

    try {
      const response = await fetch(`/api/part-time-jobs/${jobId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("兼职已删除");
        router.push("/part-time-jobs");
      } else {
        const data = await response.json();
        alert(data.error || "删除失败");
      }
    } catch (error) {
      console.error("删除失败:", error);
      alert("删除失败");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">兼职不存在</p>
          <button
            onClick={() => router.push("/part-time-jobs")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            返回列表
          </button>
        </div>
      </div>
    );
  }

  const isOwner = session?.user?.id === job.user?.id;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            ← 返回
          </button>
        </div>
      </div>

      {/* 内容区 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* 封面图 */}
          {job.images.length > 0 && (
            <div className="relative h-64 w-full">
              <Image
                src={job.images[0].url}
                alt={job.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="p-6">
            {/* 标题和状态 */}
            <div className="flex items-start justify-between">
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <span className={`px-3 py-1 rounded-full text-sm ${
                job.status === "approved"
                  ? "bg-green-100 text-green-700"
                  : job.status === "pending"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-700"
              }`}>
                {job.status === "approved" ? "已审核" : job.status === "pending" ? "审核中" : job.status}
              </span>
            </div>

            {/* 基本信息 */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <span className="text-sm text-gray-500">兼职类型</span>
                <p className="font-medium text-gray-900">{job.jobType}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">薪资待遇</span>
                <p className="font-medium text-orange-600">{job.salary}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">工作地点</span>
                <p className="font-medium text-gray-900">{job.location}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">联系方式</span>
                <p className="font-medium text-gray-900">{job.contactInfo}</p>
              </div>
            </div>

            {/* 公司信息 */}
            {job.company && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {job.company.logo ? (
                    <Image src={job.company.logo} alt={job.company.name} width={40} height={40} className="rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                      {job.company.name[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{job.company.name}</p>
                    <p className="text-sm text-gray-500">{job.company.address || "暂无地址"}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 描述 */}
            <div className="mt-6">
              <h2 className="font-semibold text-gray-900 mb-2">职位描述</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
            </div>

            {/* 统计信息 */}
            <div className="mt-6 pt-6 border-t flex items-center gap-6 text-sm text-gray-500">
              <span>浏览 {job.views} 次</span>
              <span>申请 {job.applicationCount} 次</span>
              <span>发布于 {new Date(job.createdAt).toLocaleDateString("zh-CN")}</span>
            </div>

            {/* 操作按钮 */}
            <div className="mt-6 flex gap-3">
              {isOwner ? (
                <>
                  <button
                    onClick={() => router.push(`/part-time-jobs/${jobId}/edit`)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    编辑
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    删除
                  </button>
                </>
              ) : job.status === "approved" ? (
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                >
                  {applying ? "申请中..." : "立即申请"}
                </button>
              ) : (
                <button
                  disabled
                  className="flex-1 px-4 py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
                >
                  该职位已关闭
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

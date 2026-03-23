"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface PartTimeJob {
  id: string;
  title: string;
  description: string;
  jobType: string;
  salary: string;
  location: string;
  contactInfo: string;
  images: {
    id: string;
    url: string;
    position: number;
  }[];
}

export default function EditPartTimeJobPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    jobType: "长期",
    salary: "",
    location: "",
    contactInfo: "",
  });
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deletingImage, setDeletingImage] = useState<number | null>(null);

  const jobId = params.id as string;

  useEffect(() => {
    const fetchJob = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/part-time-jobs/${jobId}`);
        const data = await response.json();

        if (response.ok) {
          setFormData({
            title: data.title,
            description: data.description,
            jobType: data.jobType,
            salary: data.salary,
            location: data.location,
            contactInfo: data.contactInfo,
          });
          setUploadedImages(data.images?.map((img: { url: string }) => img.url) || []);
        } else {
          setError("兼职不存在或无权编辑");
        }
      } catch {
        setError("获取兼职信息失败");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (uploadedImages.length + files.length > 5) {
      setError("最多只能上传 5 张图片");
      return;
    }

    setUploading(true);
    setError("");

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setError("只能上传图片文件");
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError("图片大小不能超过 5MB");
        continue;
      }

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "上传失败");
          continue;
        }

        setUploadedImages((prev) => [...prev, data.url]);
      } catch {
        setError("网络错误，上传失败");
      }
    }

    setUploading(false);
  };

  const removeImage = async (index: number) => {
    setDeletingImage(index);
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    setDeletingImage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.title || !formData.description || !formData.salary || !formData.location || !formData.contactInfo) {
      setError("请填写必填项");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/part-time-jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          images: uploadedImages.length > 0 ? uploadedImages : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "更新失败");
      } else {
        alert("更新成功！修改后将重新进入审核状态。");
        router.push(`/part-time-jobs/${jobId}`);
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setSaving(false);
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

  if (error && !formData.title) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">编辑兼职</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* 标题 */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              兼职标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如：周末兼职店员"
            />
          </div>

          {/* 描述 */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              职位描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="详细描述工作内容、要求等..."
            />
          </div>

          {/* 兼职类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              兼职类型 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              {["长期", "短期", "实习"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, jobType: type })}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    formData.jobType === type
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* 薪资 */}
          <div>
            <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-1">
              薪资待遇 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="salary"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如：150 元/天 或 20 元/小时"
            />
          </div>

          {/* 工作地点 */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              工作地点 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如：奎文区鸢飞路 36 号"
            />
          </div>

          {/* 联系方式 */}
          <div>
            <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-700 mb-1">
              联系方式 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="contactInfo"
              value={formData.contactInfo}
              onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如：138****8888（微信同号）"
            />
          </div>

          {/* 图片上传 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              工作图片（可选）
            </label>
            <div className="flex flex-wrap gap-3">
              {uploadedImages.map((url, index) => (
                <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 group">
                  {deletingImage === index ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <>
                      <img src={url} alt={`上传 ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </>
                  )}
                </div>
              ))}
              {uploadedImages.length < 5 && (
                <label className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    disabled={uploading}
                    className="hidden"
                  />
                  {uploading ? (
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="text-2xl text-gray-400">+</span>
                      <span className="text-xs text-gray-500 mt-1">上传图片</span>
                    </>
                  )}
                </label>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">最多上传 5 张图片，每张不超过 5MB</p>
          </div>

          {/* 提交按钮 */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving || uploading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "保存中..." : "保存修改"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 font-medium"
            >
              取消
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            提示：修改标题或描述后，兼职将重新进入审核状态。
          </p>
        </form>
      </div>
    </div>
  );
}

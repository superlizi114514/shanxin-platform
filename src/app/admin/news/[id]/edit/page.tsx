"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Trash2,
  FileText,
} from "lucide-react";

interface News {
  id: string;
  title: string;
  summary: string | null;
  content: string;
  coverImage: string | null;
  category: string;
  author: string | null;
  source: string | null;
  published: boolean;
}

interface FormState {
  title: string;
  summary: string;
  content: string;
  coverImage: string;
  category: string;
  author: string;
  source: string;
  published: boolean;
}

interface FormErrors {
  title?: string;
  content?: string;
}

const categoryNames: Record<string, string> = {
  news: "校园新闻",
  notice: "通知公告",
  activity: "活动资讯",
  policy: "政策法规",
};

export default function AdminNewsEditPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [news, setNews] = useState<News | null>(null);
  const [formData, setFormData] = useState<FormState>({
    title: "",
    summary: "",
    content: "",
    coverImage: "",
    category: "news",
    author: "",
    source: "",
    published: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const newsId = params.id as string;

  useEffect(() => {
    if (!session?.user || session.user.role !== "admin") {
      router.push("/login");
      return;
    }
    fetchNews();
  }, [session, router, newsId]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/news/${newsId}`);
      const data = await response.json();

      if (response.ok) {
        setNews(data);
        setFormData({
          title: data.title,
          summary: data.summary || "",
          content: data.content || "",
          coverImage: data.coverImage || "",
          category: data.category,
          author: data.author || "",
          source: data.source || "",
          published: data.published,
        });
      } else {
        router.push("/admin/news");
      }
    } catch (error) {
      console.error("Failed to fetch news:", error);
      router.push("/admin/news");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "新闻标题不能为空";
    } else if (formData.title.length > 200) {
      newErrors.title = "新闻标题不能超过 200 个字符";
    }

    if (!formData.content.trim()) {
      newErrors.content = "新闻内容不能为空";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/news/${newsId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          router.push(`/admin/news/${newsId}`);
        }, 1500);
      } else {
        setErrors({ title: data.error || "更新失败" });
      }
    } catch (error) {
      console.error("Update failed:", error);
      setErrors({ title: "更新失败，请重试" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/admin/news/${newsId}`);
  };

  const handleImageRemove = () => {
    setFormData({ ...formData, coverImage: "" });
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

  if (!news) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">新闻不存在</h2>
          <Link
            href="/admin/news"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            返回列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">编辑新闻</h1>
                <p className="text-sm text-gray-500 line-clamp-1">{news.title}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* 成功提示 */}
          {showSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-medium">新闻已更新，即将跳转...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 封面图 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                封面图片
              </label>
              <div className="flex items-start gap-4">
                {formData.coverImage ? (
                  <div className="relative w-40 h-24 rounded-lg bg-gray-100 overflow-hidden">
                    <Image
                      src={formData.coverImage}
                      alt="Cover preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleImageRemove}
                      className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-40 h-24 rounded-lg bg-gray-100 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="url"
                    value={formData.coverImage}
                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入封面图片 URL"
                  />
                  <p className="mt-1 text-xs text-gray-500">支持 JPG、PNG 格式的图片 URL</p>
                </div>
              </div>
            </div>

            {/* 新闻标题 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                新闻标题 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.title ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="请输入新闻标题"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* 分类 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                新闻分类
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(categoryNames) as string[]).map((key) => (
                  <label
                    key={key}
                    className={`flex items-center gap-2 px-4 py-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.category === key
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={key}
                      checked={formData.category === key}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="text-blue-600"
                    />
                    <span className="text-sm font-medium text-gray-700">{categoryNames[key]}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 摘要 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                新闻摘要
              </label>
              <textarea
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入新闻摘要（可选，一句话概括新闻内容）"
              />
            </div>

            {/* 作者和来源 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  作者
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="作者姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  来源
                </label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="新闻来源"
                />
              </div>
            </div>

            {/* 新闻内容 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                新闻内容 *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={12}
                className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans ${
                  errors.content ? "border-red-500" : ""
                }`}
                placeholder="请输入新闻内容（支持 Markdown 格式）"
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content}</p>
              )}
            </div>

            {/* 发布状态 */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">立即发布</span>
              </label>
              <p className="mt-1 text-xs text-gray-500 ml-7">取消勾选将保存为草稿</p>
            </div>

            {/* 提交按钮 */}
            <div className="flex gap-4 pt-6 border-t">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {saving ? "保存中..." : "保存更改"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <X className="w-5 h-5" />
                取消
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

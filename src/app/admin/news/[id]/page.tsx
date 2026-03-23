"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  FileText,
  Eye,
  Calendar,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
  Tag,
} from "lucide-react";

interface News {
  id: string;
  title: string;
  summary: string | null;
  content: string;
  coverImage: string | null;
  category: string;
  views: number;
  published: boolean;
  author: string | null;
  source: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const categoryNames: Record<string, string> = {
  news: "校园新闻",
  notice: "通知公告",
  activity: "活动资讯",
  policy: "政策法规",
};

const categoryColors: Record<string, string> = {
  news: "bg-blue-100 text-blue-700",
  notice: "bg-red-100 text-red-700",
  activity: "bg-green-100 text-green-700",
  policy: "bg-purple-100 text-purple-700",
};

export default function AdminNewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!news) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/news/${newsId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        alert("新闻已删除");
        router.push("/admin/news");
      } else {
        alert(data.error || "删除失败");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert("删除失败，请重试");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
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
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/admin/news")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">新闻详情</h1>
                <p className="text-sm text-gray-500 line-clamp-1">{news.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/news/${newsId}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                编辑新闻
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 左侧主要内容 */}
          <div className="md:col-span-2 space-y-6">
            {/* 新闻内容卡片 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* 封面图 */}
              {news.coverImage && (
                <div className="aspect-video bg-gray-100 relative">
                  <Image
                    src={news.coverImage}
                    alt={news.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div className="p-6">
                {/* 标题和分类 */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{news.title}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                    categoryColors[news.category] || "bg-gray-100 text-gray-700"
                  }`}>
                    {categoryNames[news.category] || news.category}
                  </span>
                </div>

                {/* 摘要 */}
                {news.summary && (
                  <div className="p-4 bg-gray-50 rounded-lg mb-6">
                    <p className="text-sm text-gray-700">{news.summary}</p>
                  </div>
                )}

                {/* 新闻内容 */}
                <div className="prose prose-sm max-w-none">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">新闻内容</h3>
                  <div className="text-gray-700 whitespace-pre-wrap font-sans">
                    {news.content}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧信息 */}
          <div className="space-y-6">
            {/* 状态卡片 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">新闻状态</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">发布状态</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                    news.published
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {news.published ? (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        已发布
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        未发布
                      </>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">浏览量</span>
                  <span className="text-sm font-medium text-gray-900">{news.views}</span>
                </div>
              </div>
            </div>

            {/* 元数据 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">元数据</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">作者</p>
                    <p className="text-sm font-medium text-gray-900">{news.author || "未设置"}</p>
                  </div>
                </div>
                {news.source && (
                  <div className="flex items-center gap-3">
                    <Tag className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">来源</p>
                      <p className="text-sm font-medium text-gray-900">{news.source}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">创建时间</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(news.createdAt).toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                </div>
                {news.publishedAt && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">发布时间</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(news.publishedAt).toLocaleDateString("zh-CN")}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">最后更新</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(news.updatedAt).toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">快捷操作</h3>
              <div className="space-y-2">
                <Link
                  href={`/admin/news/${newsId}/edit`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Edit2 className="w-4 h-4" />
                  编辑新闻
                </Link>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleting}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  删除新闻
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">确认删除</h3>
            </div>
            <p className="text-gray-600 mb-6">
              确定要删除新闻 <span className="font-medium">{news.title}</span> 吗？此操作不可恢复。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {deleting ? "删除中..." : "确认删除"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

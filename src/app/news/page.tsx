"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

interface News {
  id: string;
  title: string;
  summary: string | null;
  coverImage: string | null;
  category: string;
  views: number;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  comments: {
    id: string;
    createdAt: string;
    user: {
      id: string;
      name: string | null;
      avatar: string | null;
    } | null;
  }[];
}

interface HotNews {
  id: string;
  title: string;
  summary: string | null;
  coverImage: string | null;
  category: string;
  views: number;
  commentCount: number;
  publishedAt: string | null;
  hotScore: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const categoryNames: Record<string, string> = {
  news: "校园新闻",
  notice: "通知公告",
  activity: "活动资讯",
  policy: "政策法规",
};

const categoryColors: Record<string, string> = {
  news: "bg-blue-100 text-blue-800",
  notice: "bg-red-100 text-red-800",
  activity: "bg-green-100 text-green-800",
  policy: "bg-purple-100 text-purple-800",
};

export default function NewsPage() {
  const [news, setNews] = useState<News[]>([]);
  const [hotNews, setHotNews] = useState<HotNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHot, setLoadingHot] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchNews = async (page: number = 1, category?: string, search?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        published: "true",
      });

      if (category && category !== "all") {
        params.set("category", category);
      }

      if (search) {
        params.set("search", search);
      }

      const response = await fetch(`/api/news?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setNews(data.news);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch news:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHotNews = async () => {
    setLoadingHot(true);
    try {
      const response = await fetch("/api/news/hot?limit=5&days=7");
      const data = await response.json();

      if (response.ok) {
        setHotNews(data.hotNews);
      }
    } catch (error) {
      console.error("Failed to fetch hot news:", error);
    } finally {
      setLoadingHot(false);
    }
  };

  useEffect(() => {
    fetchNews(1, selectedCategory, searchQuery || undefined);
    fetchHotNews();
  }, [selectedCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNews(1, selectedCategory, searchQuery || undefined);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSearchQuery("");
  };

  const handlePageChange = (newPage: number) => {
    fetchNews(newPage, selectedCategory, searchQuery || undefined);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="text-lg font-medium text-blue-600 hover:text-blue-700">
              ← 返回
            </Link>
            <h1 className="text-xl font-bold text-gray-900">学校新闻</h1>
            <div className="w-16" /> {/* Spacer for alignment */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* News List - Left Column */}
          <div className="lg:col-span-3">
            {/* Search and Filter */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Category Filter */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleCategoryChange("all")}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === "all"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    全部
                  </button>
                  {Object.entries(categoryNames).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => handleCategoryChange(key)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedCategory === key
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索新闻..."
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    搜索
                  </button>
                </form>
              </div>
            </div>

            {/* News List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">加载中...</p>
              </div>
            ) : news.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📰</div>
                <p className="text-gray-600">暂无新闻</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {news.map((item) => (
                    <Link
                      key={item.id}
                      href={`/news/${item.id}`}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group"
                    >
                      {/* Cover Image */}
                      <div className="aspect-video bg-gray-200 relative overflow-hidden">
                        {item.coverImage ? (
                          <Image
                            src={item.coverImage}
                            alt={item.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400 bg-gradient-to-br from-gray-100 to-gray-200">
                            <span className="text-4xl">📰</span>
                          </div>
                        )}
                        {/* Category Badge */}
                        <span className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${categoryColors[item.category] || categoryColors.news}`}>
                          {categoryNames[item.category] || "新闻"}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-medium text-lg text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {item.title}
                        </h3>
                        {item.summary && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {item.summary}
                          </p>
                        )}

                        {/* Meta Info */}
                        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center gap-4">
                            <span>👁 {item.views}</span>
                            <span>💬 {item.comments.length}</span>
                          </div>
                          {item.publishedAt && (
                            <span>
                              {formatDistanceToNow(new Date(item.publishedAt), {
                                addSuffix: true,
                                locale: zhCN,
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-8 flex justify-center items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      上一页
                    </button>
                    <span className="text-gray-700">
                      第 {pagination.page} / {pagination.totalPages} 页
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      下一页
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Hot News Sidebar - Right Column */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🔥</span>
                  <h2 className="text-lg font-bold text-gray-900">热门新闻</h2>
                </div>

                {loadingHot ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-sm text-gray-600">加载中...</p>
                  </div>
                ) : hotNews.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📰</div>
                    <p className="text-sm text-gray-600">暂无热门新闻</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {hotNews.map((item, index) => (
                      <Link
                        key={item.id}
                        href={`/news/${item.id}`}
                        className="flex gap-3 group hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {item.title}
                          </h3>
                          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                            <span>👁 {item.views}</span>
                            <span>💬 {item.commentCount}</span>
                            <span className="text-orange-500 font-medium">
                              🔥 {item.hotScore}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">
                    基于浏览量、评论数和发布时间计算
                  </p>
                </div>
              </div>

              {/* Advanced Search Tips */}
              <div className="mt-6 bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">💡 搜索小贴士</h3>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• 使用关键词搜索标题和内容</li>
                  <li>• 按分类筛选快速定位</li>
                  <li>• 热门新闻显示最近 7 天数据</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

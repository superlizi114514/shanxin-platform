"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface GuideArticle {
  id: string;
  title: string;
  summary: string | null;
  coverImage: string | null;
  author: string | null;
  views: number;
  publishedAt: string | null;
  category: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  };
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

export default function GuideCategoryPage() {
  const params = useParams();
  const categoryId = params.id as string;
  const [articles, setArticles] = useState<GuideArticle[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (categoryId) {
      fetchCategory();
      fetchArticles();
    }
  }, [categoryId]);

  const fetchCategory = async () => {
    try {
      const res = await fetch(`/api/guide/categories/${categoryId}`);
      if (res.ok) {
        const data = await res.json();
        setCategory(data);
      }
    } catch (error) {
      console.error("Failed to fetch category:", error);
    }
  };

  const fetchArticles = async () => {
    try {
      const res = await fetch(`/api/guide/articles?categoryId=${categoryId}&published=true`);
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (error) {
      console.error("Failed to fetch articles:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`shadow ${category?.color ? `bg-gradient-to-r ${category.color}` : "bg-white"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <Link
              href="/guide"
              className={`mr-4 p-2 rounded-lg ${category?.color ? "text-white" : "text-gray-600"} hover:bg-white/20 transition-colors`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className={`text-3xl font-bold ${category?.color ? "text-white" : "text-gray-900"}`}>
                {category?.name || "分类"}
              </h1>
              {category?.name === "学习资源" && (
                <p className={`mt-1 ${category?.color ? "text-white/80" : "text-gray-600"}`}>
                  课程资料、学习指南、考试资源
                </p>
              )}
              {category?.name === "生活服务" && (
                <p className={`mt-1 ${category?.color ? "text-white/80" : "text-gray-600"}`}>
                  餐饮、购物、维修、便利信息
                </p>
              )}
              {category?.name === "就业信息" && (
                <p className={`mt-1 ${category?.color ? "text-white/80" : "text-gray-600"}`}>
                  实习机会、招聘信息、职业规划
                </p>
              )}
              {category?.name === "社团组织" && (
                <p className={`mt-1 ${category?.color ? "text-white/80" : "text-gray-600"}`}>
                  社团活动、组织介绍、报名指南
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Articles List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/guide/article/${article.id}`}
                className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {article.coverImage ? (
                  <div className="h-48 bg-gray-200 overflow-hidden">
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-6xl">📄</span>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-500 transition-colors">
                    {article.title}
                  </h3>
                  {article.summary && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {article.summary}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{article.author || "匿名"}</span>
                    <div className="flex items-center gap-3">
                      <span>{article.views} 阅读</span>
                      {article.publishedAt && (
                        <span>
                          {new Date(article.publishedAt).toLocaleDateString("zh-CN")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-gray-600">暂无文章</p>
          </div>
        )}
      </div>
    </div>
  );
}

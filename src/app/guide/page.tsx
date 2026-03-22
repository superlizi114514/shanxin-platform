"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface GuideCategory {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  color: string | null;
  order: number;
  _count: {
    articles: number;
  };
}

export default function GuidePage() {
  const [categories, setCategories] = useState<GuideCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/guide/categories");
      const data = await res.json();
      setCategories(data.categories);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const colorMap: Record<string, string> = {
    "学习资源": "from-blue-500 to-blue-600",
    "生活服务": "from-green-500 to-green-600",
    "就业信息": "from-orange-500 to-orange-600",
    "社团组织": "from-purple-500 to-purple-600",
  };

  const iconMap: Record<string, string> = {
    "学习资源": "📚",
    "生活服务": "🏠",
    "就业信息": "💼",
    "社团组织": "🎉",
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
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">信息大全</h1>
          <p className="text-gray-600 mt-2">
            探索校园生活的方方面面
          </p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => {
            const gradient = category.color || colorMap[category.name] || "from-blue-500 to-blue-600";
            const icon = category.icon || iconMap[category.name] || "📄";

            return (
              <Link
                key={category.id}
                href={`/guide/${category.id}`}
                className="group"
              >
                <div
                  className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 text-white shadow-lg transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl`}
                >
                  <div className="text-5xl mb-4">{icon}</div>
                  <h3 className="text-xl font-bold mb-2">{category.name}</h3>
                  {category.description && (
                    <p className="text-white/80 text-sm mb-4">
                      {category.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 text-sm">
                      {category._count?.articles || 0} 篇文章
                    </span>
                    <svg
                      className="w-6 h-6 transform group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-gray-600">暂无分类</p>
          </div>
        )}
      </div>
    </div>
  );
}

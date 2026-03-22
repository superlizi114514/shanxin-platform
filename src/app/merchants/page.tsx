"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";

interface Merchant {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  rating: number;
  reviewCount: number;
  address: string | null;
  phone: string | null;
  verified: boolean;
  school: {
    id: string;
    name: string;
    logo: string | null;
  } | null;
  categories: {
    id: string;
    name: string;
    icon: string | null;
  }[];
  images: { id: string; url: string }[];
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function MerchantsPage() {
  const { data: session } = useSession();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>("rating");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/merchants/categories");
      const data = await response.json();
      if (data.categories) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchMerchants = async (page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(selectedCategory !== "all" && { category: selectedCategory }),
        ...(minRating > 0 && { minRating: minRating.toString() }),
        ...(sortBy && { sortBy }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/merchants?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setMerchants(data.merchants);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch merchants:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchMerchants(1);
  }, [selectedCategory, minRating, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMerchants(1);
  };

  const handlePageChange = (newPage: number) => {
    fetchMerchants(newPage);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />
      <div className="fixed top-1/4 -left-1/4 w-96 h-96 bg-blue-400 rounded-full opacity-20 blur-3xl animate-pulse" />
      <div className="fixed bottom-1/4 -right-1/4 w-96 h-96 bg-indigo-400 rounded-full opacity-20 blur-3xl animate-pulse delay-1000" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg shadow-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium px-4 py-2 rounded-xl hover:bg-blue-50 transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent hidden sm:block">
                商家点评
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Search and Filter */}
        <div className="mb-6 bg-white/80 backdrop-blur-lg rounded-xl shadow-lg p-5 border border-white/20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1 lg:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索商家名称..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/80 backdrop-blur-sm transition-all"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 font-medium shadow-md hover:shadow-lg hover:shadow-orange-500/25 transition-all duration-300 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                搜索
              </button>
            </form>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-600 font-medium">分类:</span>
                <button
                  onClick={() => handleCategoryChange("all")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedCategory === "all"
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md"
                      : "bg-white/80 backdrop-blur-sm text-gray-700 border border-gray-200 hover:bg-orange-50 hover:border-orange-300"
                  }`}
                >
                  全部
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                      selectedCategory === cat.id
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md"
                        : "bg-white/80 backdrop-blur-sm text-gray-700 border border-gray-200 hover:bg-orange-50 hover:border-orange-300"
                    }`}
                  >
                    {cat.icon || "🏪"} {cat.name}
                  </button>
                ))}
              </div>

              {/* Rating Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 font-medium">评分:</span>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-white/80 backdrop-blur-sm cursor-pointer"
                >
                  <option value="0">全部</option>
                  <option value="4">4 星+</option>
                  <option value="3">3 星+</option>
                  <option value="2">2 星+</option>
                </select>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 font-medium">排序:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-white/80 backdrop-blur-sm cursor-pointer"
                >
                  <option value="rating">评分最高</option>
                  <option value="reviews">评价最多</option>
                  <option value="name">名称 A-Z</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600 bg-white/60 backdrop-blur-sm rounded-xl px-4 py-3 inline-block">
          找到 <span className="font-bold text-orange-600">{pagination.total}</span> 个商家
          {selectedCategory !== "all" && (
            <span className="ml-2">
              · 分类：<span className="font-medium">{categories.find(c => c.id === selectedCategory)?.name || selectedCategory}</span>
            </span>
          )}
          {minRating > 0 && (
            <span className="ml-2">
              · 评分：<span className="font-medium">{minRating}星+</span>
            </span>
          )}
        </div>

        {/* Merchants Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            <p className="mt-4 text-gray-600 font-medium">加载中...</p>
          </div>
        ) : merchants.length === 0 ? (
          <div className="text-center py-12 bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-gray-600 text-lg">没有找到符合条件的商家</p>
            <button
              onClick={() => {
                setSelectedCategory("all");
                setMinRating(0);
                setSortBy("rating");
                setSearchQuery("");
              }}
              className="mt-4 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 font-medium shadow-md transition-all duration-300"
            >
              清除筛选条件
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {merchants.map((merchant) => (
                <Link
                  key={merchant.id}
                  href={`/merchants/${merchant.id}`}
                  className="group bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02] border border-white/20"
                >
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-10" />

                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                    {merchant.logo ? (
                      <Image
                        src={merchant.logo}
                        alt={merchant.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    )}
                    {merchant.verified && (
                      <span className="absolute top-3 right-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-md flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                        已认证
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-orange-600 transition-colors duration-300">
                      {merchant.name}
                    </h3>
                    {merchant.school && (
                      <p className="text-sm text-gray-500 mt-1.5 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {merchant.school.name}
                      </p>
                    )}
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="flex text-yellow-400 text-sm">
                        {"★".repeat(Math.floor(merchant.rating))}
                        {"☆".repeat(5 - Math.floor(merchant.rating))}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {merchant.rating.toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {merchant.reviewCount}条
                      </span>
                    </div>
                    {merchant.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {merchant.categories.map((cat) => (
                          <span
                            key={cat.id}
                            className="px-2.5 py-1 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 rounded-lg text-xs font-medium border border-gray-200"
                          >
                            {cat.icon || "🏪"} {cat.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {merchant.address && (
                      <p className="text-sm text-gray-500 mt-3 flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {merchant.address}
                      </p>
                    )}
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
                  className="px-5 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-50 hover:border-orange-300 transition-all duration-200 font-medium text-gray-700"
                >
                  上一页
                </button>
                <span className="text-gray-700 font-medium bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-200">
                  第 {pagination.page} / {pagination.totalPages} 页
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-5 py-2.5 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-50 hover:border-orange-300 transition-all duration-200 font-medium text-gray-700"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

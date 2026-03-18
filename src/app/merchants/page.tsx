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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function MerchantsPage() {
  const { data: session } = useSession();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchMerchants = async (page: number = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/merchants?page=${page}&limit=20`);
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
    fetchMerchants();
  }, []);

  const handlePageChange = (newPage: number) => {
    fetchMerchants(newPage);
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
            <h1 className="text-xl font-bold text-gray-900">商家点评</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">加载中...</p>
          </div>
        ) : merchants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">暂无商家</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {merchants.map((merchant) => (
                <Link
                  key={merchant.id}
                  href={`/merchants/${merchant.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-video bg-gray-200 relative">
                    {merchant.logo ? (
                      <Image
                        src={merchant.logo}
                        alt={merchant.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        暂无 logo
                      </div>
                    )}
                    {merchant.verified && (
                      <span className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs">
                        已认证
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-lg text-gray-900">
                      {merchant.name}
                    </h3>
                    {merchant.school && (
                      <p className="text-sm text-gray-500 mt-1">
                        {merchant.school.name}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex text-yellow-400">
                        {"★".repeat(Math.floor(merchant.rating))}
                        {"☆".repeat(5 - Math.floor(merchant.rating))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {merchant.rating.toFixed(1)} ({merchant.reviewCount}条评价)
                      </span>
                    </div>
                    {merchant.address && (
                      <p className="text-sm text-gray-500 mt-2">
                        📍 {merchant.address}
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
      </main>
    </div>
  );
}

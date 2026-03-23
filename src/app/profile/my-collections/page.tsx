"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  status: string;
  images: { id: string; url: string }[];
  views: number;
  collectionCount: number;
  owner: {
    id: string;
    name: string | null;
    email: string | null;
    avatar: string | null;
  };
};

interface Collection {
  id: string;
  note: string | null;
  createdAt: string;
  product: Product;
}

export default function MyCollectionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchCollections();
    }
  }, [status]);

  const fetchCollections = async () => {
    try {
      const response = await fetch("/api/collections/my");
      if (response.ok) {
        const data = await response.json();
        setCollections(data.collections);
      }
    } catch (error) {
      console.error("Failed to fetch collections:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfavorite = async (id: string, productId: string) => {
    try {
      const response = await fetch(`/api/collections/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCollections(collections.filter((c) => c.id !== id));
        alert("已取消收藏");
      }
    } catch (error) {
      console.error("Failed to remove collection:", error);
      alert("取消收藏失败，请重试");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <Link
              href="/profile"
              className="flex items-center space-x-2 group"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-gray-700 font-medium">返回个人主页</span>
            </Link>
            <Link
              href="/products"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              浏览商品
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">我的收藏</h1>
          <p className="text-gray-600 mt-1">管理您收藏的商品</p>
        </div>

        {/* Stats Cards */}
        <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">{collections.length}</div>
              <div className="text-gray-600 text-sm mt-1">已收藏商品</div>
            </div>
          </div>
        </div>

        {/* Collections List */}
        {collections.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-md p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-300 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <p className="text-gray-500 text-lg mb-4">
              还没有收藏任何商品
            </p>
            <Link
              href="/products"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all"
            >
              去浏览商品
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map((collection) => (
              <div
                key={collection.id}
                className="bg-white/80 backdrop-blur-lg rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all"
              >
                {/* Product Image */}
                <Link href={`/products/${collection.product.id}`} className="block">
                  <div className="aspect-square relative bg-gray-100 overflow-hidden">
                    {collection.product.images.length > 0 ? (
                      <Image
                        src={collection.product.images[0].url}
                        alt={collection.product.title}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <svg
                          className="w-12 h-12"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-medium shadow-sm ${
                          collection.product.status === "available"
                            ? "bg-green-500 text-white"
                            : collection.product.status === "sold"
                            ? "bg-yellow-500 text-white"
                            : "bg-purple-500 text-white"
                        }`}
                      >
                        {collection.product.status === "available"
                          ? "出售中"
                          : collection.product.status === "sold"
                          ? "已售出"
                          : "已预留"}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Product Info */}
                <div className="p-4">
                  <Link href={`/products/${collection.product.id}`}>
                    <h3 className="font-medium text-gray-900 truncate mb-2 hover:text-blue-600 transition-colors">
                      {collection.product.title}
                    </h3>
                  </Link>

                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-xl font-bold text-blue-600">
                      ¥{collection.product.price.toFixed(2)}
                    </span>
                  </div>

                  {/* Seller Info */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
                      {collection.product.owner.avatar ? (
                        <Image
                          src={collection.product.owner.avatar}
                          alt={collection.product.owner.name || "卖家"}
                          width={24}
                          height={24}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600 text-xs font-medium">
                          {collection.product.owner.name?.[0]?.toUpperCase() || "S"}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-600">
                      {collection.product.owner.name || "卖家"}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <span>{collection.product.views} 浏览</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                      <span>{collection.product.collectionCount} 收藏</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/products/${collection.product.id}`}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-all text-center font-medium"
                    >
                      查看详情
                    </Link>
                    <button
                      onClick={() =>
                        handleUnfavorite(collection.id, collection.product.id)
                      }
                      className="px-3 py-2 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100 transition-all font-medium"
                      title="取消收藏"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  status: string;
  views: number;
  likes: number;
  createdAt: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  };
  images: { id: string; url: string }[];
  seller: {
    id: string;
    name: string;
    logo: string | null;
  } | null;
}

interface Collection {
  id: string;
  createdAt: string;
  product: Product;
}

const CATEGORY_MAP: Record<string, string> = {
  electronics: "电子产品",
  books: "书籍教材",
  clothing: "服饰鞋包",
  daily: "生活用品",
  sports: "运动户外",
  beauty: "美妆护肤",
  other: "其他",
};

const STATUS_MAP: Record<string, string> = {
  available: "可售中",
  sold: "已售出",
  reserved: "已预留",
};

export default function CollectionsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

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
    setLoading(true);
    try {
      const response = await fetch("/api/collections");
      if (response.ok) {
        const data = await response.json();
        setCollections(data.collections);
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Failed to fetch collections:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCollection = async (productId: string) => {
    if (!confirm("确定要取消收藏这个商品吗？")) return;

    setRemovingId(productId);
    try {
      const response = await fetch(`/api/collections/${productId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCollections(collections.filter((c) => c.product.id !== productId));
        alert("已取消收藏");
      } else {
        const data = await response.json();
        alert(data.error || "取消收藏失败");
      }
    } catch (error) {
      console.error("Failed to remove collection:", error);
      alert("取消收藏失败，请重试");
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="text-xl font-bold text-gray-900">
              山信二手平台
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                href="/products"
                className="text-gray-700 hover:text-gray-900"
              >
                商品列表
              </Link>
              <Link
                href="/collections"
                className="text-blue-600 font-medium"
              >
                我的收藏
              </Link>
              <Link
                href="/orders"
                className="text-gray-700 hover:text-gray-900"
              >
                订单管理
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">我的收藏</h1>
          <p className="text-gray-600 mt-1">
            已收藏 {collections.length} 个商品
          </p>
        </div>

        {collections.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <div className="text-6xl mb-4">☆</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              暂无收藏
            </h3>
            <p className="text-gray-600 mb-6">
              快去浏览商品，遇到心仪的商品就收藏下来吧
            </p>
            <Link
              href="/products"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              浏览商品
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <div
                key={collection.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden"
              >
                <Link href={`/products/${collection.product.id}`}>
                  <div className="aspect-square bg-gray-200 overflow-hidden">
                    {collection.product.images.length > 0 ? (
                      <Image
                        src={collection.product.images[0]?.url}
                        alt={collection.product.title}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        暂无图片
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <Link href={`/products/${collection.product.id}`}>
                    <h3 className="font-medium text-gray-900 truncate mb-2">
                      {collection.product.title}
                    </h3>
                  </Link>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">
                      {CATEGORY_MAP[collection.product.category] || collection.product.category}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        collection.product.status === "available"
                          ? "bg-green-100 text-green-800"
                          : collection.product.status === "sold"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {STATUS_MAP[collection.product.status]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-blue-600">
                      ¥{collection.product.price.toFixed(2)}
                    </span>
                    <button
                      onClick={() =>
                        handleRemoveCollection(collection.product.id)
                      }
                      disabled={removingId === collection.product.id}
                      className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      {removingId === collection.product.id
                        ? "移除中..."
                        : "取消收藏"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600 text-sm">
            <p>© 2026 山信二手平台 - 山东信息职业技术学院</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

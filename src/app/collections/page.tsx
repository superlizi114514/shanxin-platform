"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MessageSquare, ShoppingCart, Tag, Heart } from "lucide-react";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  status: string;
  views: number;
  likes: number;
  collectionCount: number;
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
  note?: string | null;
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
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

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

  const handleSaveNote = async (collectionId: string, productId: string) => {
    try {
      const response = await fetch(`/api/collections/${productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteDraft }),
      });

      if (response.ok) {
        setCollections(
          collections.map((c) =>
            c.id === collectionId ? { ...c, note: noteDraft } : c
          )
        );
        setEditingNoteId(null);
        alert("备注已保存");
      } else {
        const data = await response.json();
        alert(data.error || "保存备注失败");
      }
    } catch (error) {
      console.error("Failed to save note:", error);
      alert("保存备注失败，请重试");
    }
  };

  const startEditingNote = (collection: Collection) => {
    setEditingNoteId(collection.id);
    setNoteDraft(collection.note || "");
  };

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
            <div className="text-6xl mb-4">
              <Heart className="w-16 h-16 mx-auto text-gray-300" />
            </div>
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
                  <div className="aspect-square bg-gray-200 overflow-hidden relative">
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
                    {collection.product.status !== "available" && (
                      <div
                        className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${
                          collection.product.status === "sold"
                            ? "bg-red-500 text-white"
                            : "bg-yellow-500 text-white"
                        }`}
                      >
                        {STATUS_MAP[collection.product.status]}
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

                  {/* Category and Status */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {CATEGORY_MAP[collection.product.category] ||
                        collection.product.category}
                    </span>
                    <div className="flex items-center text-xs text-gray-500">
                      <Heart className="w-3 h-3 mr-1" />
                      {collection.product.collectionCount || 0} 人收藏
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-blue-600">
                      ¥{collection.product.price.toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {collection.product.views || 0} 浏览
                    </span>
                  </div>

                  {/* Note Section */}
                  <div className="mb-3">
                    {editingNoteId === collection.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          placeholder="添加备注..."
                          className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSaveNote(
                                collection.id,
                                collection.product.id
                              );
                            } else if (e.key === "Escape") {
                              setEditingNoteId(null);
                            }
                          }}
                        />
                        <button
                          onClick={() =>
                            handleSaveNote(collection.id, collection.product.id)
                          }
                          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditingNoteId(null)}
                          className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <div
                        className="flex items-center justify-between gap-2"
                        onClick={() => startEditingNote(collection)}
                      >
                        {collection.note ? (
                          <div className="flex-1 text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded flex items-center">
                            <Tag className="w-3 h-3 mr-1 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{collection.note}</span>
                          </div>
                        ) : (
                          <div
                            className="flex-1 text-sm text-gray-400 italic cursor-pointer hover:text-gray-600"
                            onClick={() => startEditingNote(collection)}
                          >
                            + 添加备注
                          </div>
                        )}
                        <button
                          onClick={() => startEditingNote(collection)}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          编辑
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <Link
                      href={`/messages?userId=${collection.product.owner.id}`}
                      className="flex-1 flex items-center justify-center gap-1 text-sm bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MessageSquare className="w-4 h-4" />
                      联系卖家
                    </Link>
                    <Link
                      href={`/products/${collection.product.id}`}
                      className="flex-1 flex items-center justify-center gap-1 text-sm bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      购买
                    </Link>
                    <button
                      onClick={() =>
                        handleRemoveCollection(collection.product.id)
                      }
                      disabled={removingId === collection.product.id}
                      className="flex items-center justify-center text-sm text-red-600 hover:text-red-700 disabled:opacity-50 px-2"
                      title="取消收藏"
                    >
                      <Heart className="w-4 h-4" />
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

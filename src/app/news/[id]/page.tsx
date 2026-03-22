"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

interface News {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  coverImage: string | null;
  category: string;
  author: string | null;
  source: string | null;
  views: number;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  comments: Comment[];
  relatedNews?: RelatedNews[];
}

interface RelatedNews {
  id: string;
  title: string;
  summary: string | null;
  coverImage: string | null;
  category: string;
  views: number;
  publishedAt: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    avatar: string | null;
  } | null;
  replies: Comment[];
}

const categoryNames: Record<string, string> = {
  news: "校园新闻",
  notice: "通知公告",
  activity: "活动资讯",
  policy: "政策法规",
};

export default function NewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchNews(params.id as string);
    }
  }, [params.id]);

  const fetchNews = async (id: string) => {
    try {
      const response = await fetch(`/api/news/${id}`);
      const data = await response.json();

      if (response.ok) {
        setNews(data);
      } else {
        router.push("/news");
      }
    } catch (error) {
      console.error("Failed to fetch news:", error);
      router.push("/news");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) {
      alert("请先登录");
      router.push("/login");
      return;
    }

    if (!commentContent.trim()) {
      alert("请输入评论内容");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/news/${params.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentContent }),
      });

      if (response.ok) {
        setCommentContent("");
        fetchNews(params.id as string);
      } else {
        const data = await response.json();
        alert(data.error || "评论失败");
      }
    } catch (error) {
      console.error("Failed to submit comment:", error);
      alert("评论失败，请重试");
    } finally {
      setSubmitting(false);
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
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/news" className="text-lg font-medium text-blue-600 hover:text-blue-700">
              ← 返回新闻列表
            </Link>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${categoryColors[news.category] || "bg-gray-100 text-gray-800"}`}>
              {categoryNames[news.category] || "新闻"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Article */}
        <article className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Cover Image */}
          {news.coverImage && (
            <div className="aspect-video bg-gray-200 relative">
              <Image
                src={news.coverImage}
                alt={news.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              {news.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6 pb-6 border-b">
              {news.author && (
                <span>作者：{news.author}</span>
              )}
              {news.source && (
                <span>来源：{news.source}</span>
              )}
              {news.publishedAt && (
                <span>
                  发布时间：{format(new Date(news.publishedAt), "yyyy 年 M 月 d 日", { locale: zhCN })}
                </span>
              )}
              <span>👁 {news.views} 次阅读</span>
            </div>

            {/* Summary */}
            {news.summary && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-gray-700 font-medium">摘要</p>
                <p className="text-gray-600 mt-1">{news.summary}</p>
              </div>
            )}

            {/* Content */}
            <div className="prose prose-lg max-w-none">
              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                {news.content}
              </div>
            </div>
          </div>
        </article>

        {/* Comments Section */}
        <section className="mt-8 bg-white rounded-lg shadow-md p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            评论区 ({news.comments.length})
          </h2>

          {/* Comment Form */}
          {session ? (
            <form onSubmit={handleSubmitComment} className="mb-8">
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="写下你的评论..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "提交中..." : "发表评论"}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 text-center mb-8">
              <p className="text-gray-600 mb-3">登录后才能发表评论</p>
              <Link
                href="/login"
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                登录
              </Link>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-6">
            {news.comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无评论，快来抢沙发吧！
              </div>
            ) : (
              news.comments.map((comment) => (
                <div key={comment.id} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      {comment.user?.avatar ? (
                        <Image
                          src={comment.user.avatar}
                          alt={comment.user.name || ""}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <span className="text-gray-400 text-sm">
                          {comment.user?.name?.charAt(0) || "匿"}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">
                          {comment.user?.name || "匿名用户"}
                        </span>
                        <span className="text-sm text-gray-500">
                          {format(new Date(comment.createdAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                        </span>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>

                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-4 ml-4 space-y-3">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-gray-900">
                                  {reply.user?.name || "匿名用户"}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {format(new Date(reply.createdAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                                </span>
                              </div>
                              <p className="text-gray-700">{reply.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Related News */}
        {news.relatedNews && news.relatedNews.length > 0 && (
          <section className="mt-8 bg-white rounded-lg shadow-md p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              相关新闻
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {news.relatedNews.map((item) => (
                <Link
                  key={item.id}
                  href={`/news/${item.id}`}
                  className="group hover:shadow-lg transition-shadow rounded-lg overflow-hidden border border-gray-200"
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
                        <span className="text-2xl">📰</span>
                      </div>
                    )}
                    {/* Category Badge */}
                    <span className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${categoryColors[item.category] || "bg-gray-100 text-gray-800"}`}>
                      {categoryNames[item.category] || "新闻"}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>
                    {item.summary && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {item.summary}
                      </p>
                    )}
                    {/* Meta Info */}
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <span>👁 {item.views}</span>
                      {item.publishedAt && (
                        <span>
                          {format(new Date(item.publishedAt), "yyyy-MM-dd", { locale: zhCN })}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

const categoryColors: Record<string, string> = {
  news: "bg-blue-100 text-blue-800",
  notice: "bg-red-100 text-red-800",
  activity: "bg-green-100 text-green-800",
  policy: "bg-purple-100 text-purple-800",
};

"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  isRead: boolean;
  createdAt: string;
  sender: User;
  receiver: User;
}

interface Conversation {
  otherUserId: string;
  otherUserName: string | null;
  otherUserAvatar: string | null;
  otherUserEmail: string;
  unreadCount: number;
  lastMessageAt: string | null;
}

export default function MessagesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const response = await fetch("/api/messages");
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    }
  };

  const fetchMessages = async (userId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/messages?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSelectedUserInfo = async (userId: string) => {
    try {
      // Get user info from the messages or conversations
      const conv = conversations.find(c => c.otherUserId === userId);
      if (conv) {
        setSelectedUser({
          id: conv.otherUserId,
          name: conv.otherUserName,
          email: conv.otherUserEmail,
          avatar: conv.otherUserAvatar,
        });
      }
    } catch (error) {
      console.error("Failed to fetch user info:", error);
    }
  };

  useEffect(() => {
    if (session) {
      fetchConversations();
    }
  }, [session]);

  useEffect(() => {
    if (selectedUserId) {
      fetchMessages(selectedUserId);
      fetchSelectedUserInfo(selectedUserId);
    }
  }, [selectedUserId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim() || !selectedUserId) return;

    setSending(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedUserId,
          content: messageContent.trim(),
        }),
      });

      if (response.ok) {
        setMessageContent("");
        fetchMessages(selectedUserId);
        fetchConversations();
      } else {
        const data = await response.json();
        alert(data.error || "发送失败");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("发送失败，请重试");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    } else if (days === 1) {
      return "昨天";
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h1>
          <Link
            href="/login"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            登录
          </Link>
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
                href="/messages"
                className="text-blue-600 font-medium"
              >
                我的消息
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
            {/* Conversations List */}
            <div className="border-r border-gray-200 overflow-y-auto">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">消息列表</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    暂无消息
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.otherUserId}
                      onClick={() => setSelectedUserId(conv.otherUserId)}
                      className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                        selectedUserId === conv.otherUserId ? "bg-blue-50" : ""
                      }`}
                    >
                      {conv.otherUserAvatar ? (
                        <Image
                          src={conv.otherUserAvatar}
                          alt={conv.otherUserName || "用户"}
                          width={48}
                          height={48}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium">
                          {conv.otherUserName?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-900">
                          {conv.otherUserName || "匿名用户"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {conv.unreadCount > 0 ? (
                            <span className="text-blue-600 font-medium">
                              有 {conv.unreadCount} 条未读消息
                            </span>
                          ) : (
                            "暂无未读消息"
                          )}
                        </div>
                      </div>
                      {conv.lastMessageAt && (
                        <div className="text-xs text-gray-400">
                          {formatTime(conv.lastMessageAt)}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="col-span-2 flex flex-col">
              {selectedUserId ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                    {selectedUser?.avatar ? (
                      <Image
                        src={selectedUser.avatar}
                        alt={selectedUser.name || "用户"}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium">
                        {selectedUser?.name?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">
                        {selectedUser?.name || "匿名用户"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {selectedUser?.email}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-500">加载消息中...</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        暂无消息记录
                        <p className="text-sm mt-2">发送第一条消息开始对话吧！</p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isSelf = message.senderId === session.user?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isSelf ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                isSelf
                                  ? "bg-blue-600 text-white"
                                  : "bg-white text-gray-900 border border-gray-200"
                              }`}
                            >
                              <div className="text-sm">{message.content}</div>
                              <div
                                className={`text-xs mt-1 ${
                                  isSelf ? "text-blue-100" : "text-gray-500"
                                }`}
                              >
                                {new Date(message.createdAt).toLocaleString("zh-CN", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        placeholder="输入消息内容..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={sending}
                      />
                      <button
                        type="submit"
                        disabled={sending || !messageContent.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {sending ? "发送中..." : "发送"}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <svg
                      className="w-16 h-16 mx-auto mb-4 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <p className="text-lg font-medium">选择对话</p>
                    <p className="text-sm mt-2">从左侧选择一个对话开始聊天</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

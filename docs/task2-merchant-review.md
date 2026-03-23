# 任务二：商家点评用户入口 + 审核优化

## 任务概述
为商家点评添加用户点评入口，完善审核流程，让用户可以便捷地点评商家。

## 功能范围
- ✅ 用户点评入口（多处）
- ✅ 点评提交表单
- ✅ 点评列表展示
- ✅ 管理员审核后台
- ✅ 点评举报功能

---

## 第一步：数据库 Schema 检查

### 文件：`prisma/schema.prisma`

现有 `MerchantReview` 模型已包含以下字段：

```prisma
model MerchantReview {
  id         String   @id @default(cuid())
  content    String
  rating     Int
  userId     String?
  merchantId String
  helpful    Int      @default(0)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  merchant     Merchant                @relation(fields: [merchantId], references: [id])
  user         User?                   @relation(fields: [userId], references: [id])
  images       MerchantReviewImage[]
  helpfulUsers MerchantReviewHelpful[]
}
```

### 需要新增的字段（如缺失）
```prisma
// 添加审核状态字段
status     String   @default("pending") // pending/approved/rejected
```

---

## 第二步：用户点评入口

### 入口位置

**1. 商家详情页添加入口**
文件：`src/app/merchants/[id]/page.tsx`

在商家详情页面添加：
```tsx
// 在商家信息下方添加点评按钮
<Link
  href={`/merchants/${merchant.id}/review`}
  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
>
  写点评
</Link>

// 展示现有点评列表
<div className="mt-8">
  <h3 className="text-lg font-bold mb-4">用户点评 ({reviewCount})</h3>
  {reviews.map(review => <ReviewCard key={review.id} review={review} />)}
</div>
```

**2. 商家列表页添加入口**
文件：`src/app/merchants/page.tsx`

在每个商家卡片上添加：
```tsx
<Link
  href={`/merchants/${merchant.id}/review`}
  className="text-sm text-blue-600 hover:underline"
>
  写点评 ({merchant.reviewCount})
</Link>
```

**3. 订单完成页添加入口**
文件：`src/app/orders/[id]/page.tsx`

订单完成后显示：
```tsx
{order.status === 'completed' && (
  <Link
    href={`/merchants/${order.merchantId}/review`}
    className="px-4 py-2 bg-green-600 text-white rounded-lg"
  >
    点评商家
  </Link>
)}
```

---

## 第三步：点评提交页面

### 新建页面：`src/app/merchants/[id]/review/page.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function WriteReviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [merchantName, setMerchantName] = useState("");

  // 获取商家信息
  useEffect(() => {
    const fetchMerchant = async () => {
      try {
        const res = await fetch(`/api/merchants/${params.id}`);
        const data = await res.json();
        if (res.ok) {
          setMerchantName(data.merchant.name);
        }
      } catch (error) {
        console.error("Failed to fetch merchant:", error);
      }
    };
    fetchMerchant();
  }, [params.id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      // TODO: 实现图片上传到图床/云存储
      // 这里是示例代码
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append("image", file);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        return data.url;
      });

      const urls = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...urls]);
    } catch (error) {
      console.error("Upload error:", error);
      alert("图片上传失败");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!session) {
      router.push("/login");
      return;
    }

    if (!content.trim()) {
      alert("请输入点评内容");
      return;
    }

    if (rating < 1 || rating > 5) {
      alert("请选择评分（1-5 星）");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/merchant-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchantId: params.id,
          content,
          rating,
          images,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("点评提交成功，等待审核后显示");
        router.push(`/merchants/${params.id}`);
      } else {
        alert(data.error || "提交失败");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("网络错误，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">请先登录后点评</p>
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg"
          >
            去登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">写点评</h1>
        <p className="text-gray-500 mb-6">分享您在 {merchantName} 的消费体验</p>

        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          {/* 评分 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              评分 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-4xl transition-colors ${
                    star <= rating ? "text-yellow-500" : "text-gray-300"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {rating === 5 ? "非常满意" : rating === 4 ? "满意" : rating === 3 ? "一般" : rating === 2 ? "不满意" : "非常不满意"}
            </p>
          </div>

          {/* 内容 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              点评内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 h-32 focus:ring-2 focus:ring-blue-500"
              placeholder="分享您的消费体验，包括服务质量、产品质量、环境等..."
              maxLength={500}
            />
            <p className="text-sm text-gray-500 mt-1">{content.length}/500</p>
          </div>

          {/* 图片上传 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              上传图片（可选）
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={uploading}
              className="w-full"
            />
            {uploading && (
              <p className="text-sm text-blue-600 mt-2">图片上传中...</p>
            )}
            {images.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {images.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt="预览"
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, i) => i !== index))}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 提交按钮 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !content.trim()}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "提交中..." : "提交点评"}
            </button>
          </div>

          <p className="text-sm text-gray-500 text-center">
            点评将在审核通过后显示
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## 第四步：API 路由

### 文件：`src/app/api/merchant-reviews/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { checkSensitiveWords } from "@/lib/sensitive-words";
import { paginationSchema } from "@/lib/validators";

const createReviewSchema = z.object({
  merchantId: z.string(),
  content: z.string().min(10, "点评内容不能少于 10 字").max(500, "点评内容不能超过 500 字"),
  rating: z.number().min(1, "评分最低 1 星").max(5, "评分最高 5 星"),
  images: z.array(z.string()).optional(),
});

const querySchema = paginationSchema.extend({
  merchantId: z.string(),
});

// GET - 获取商家点评列表（仅显示已审核通过的）
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const { page, limit, merchantId } = querySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      merchantId: searchParams.get("merchantId"),
    });

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.merchantReview.findMany({
        where: {
          merchantId,
          status: "approved", // 只显示已通过的
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          images: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.merchantReview.count({
        where: { merchantId, status: "approved" },
      }),
    ]);

    // 计算平均评分
    const ratingStats = await prisma.merchantReview.aggregate({
      where: { merchantId, status: "approved" },
      _avg: { rating: true },
      _count: true,
    });

    return NextResponse.json({
      reviews,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      averageRating: ratingStats._avg.rating || 0,
      totalReviews: ratingStats._count,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e) => e.message).join(", ");
      return NextResponse.json({ error: messages }, { status: 400 });
    }
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "获取点评失败" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST - 提交点评
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const { merchantId, content, rating, images } = createReviewSchema.parse(body);

    // 检查是否已点评过该商家
    const existing = await prisma.merchantReview.findFirst({
      where: {
        merchantId,
        userId: session.user.id,
      },
    });

    if (existing) {
      return NextResponse.json({ error: "您已经点评过该商家" }, { status: 400 });
    }

    // 敏感词检测
    const hasSensitiveWord = checkSensitiveWords(content);

    const review = await prisma.merchantReview.create({
      data: {
        merchantId,
        userId: session.user.id,
        content,
        rating,
        status: hasSensitiveWord ? "pending" : "approved", // 有敏感词转待审核
        images: images?.length
          ? { create: images.map((url) => ({ url })) }
          : undefined,
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    // 更新商家评分
    const stats = await prisma.merchantReview.aggregate({
      where: { merchantId, status: "approved" },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        rating: stats._avg.rating || 0,
        reviewCount: stats._count,
      },
    });

    return NextResponse.json({
      success: true,
      review,
      pending: hasSensitiveWord,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e) => e.message).join(", ");
      return NextResponse.json({ error: messages }, { status: 400 });
    }
    console.error("Error creating review:", error);
    return NextResponse.json({ error: "提交点评失败" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
```

---

### 文件：`src/app/api/admin/merchant-reviews/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { paginationSchema } from "@/lib/validators";

const querySchema = paginationSchema.extend({
  status: z.string().optional(),
  search: z.string().optional(),
});

const auditSchema = z.object({
  reviewIds: z.array(z.string()),
  action: z.enum(["approved", "rejected"]),
  reason: z.string().optional(),
});

// GET - 管理后台获取点评列表
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.role || session.user.role !== "admin") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const { page, limit, status, search } = querySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      status: searchParams.get("status") || "pending",
      search: searchParams.get("search"),
    });

    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (search) {
      where.content = { contains: search };
    }

    const [reviews, total] = await Promise.all([
      prisma.merchantReview.findMany({
        where,
        skip,
        take: limit,
        include: {
          merchant: {
            select: { id: true, name: true },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          images: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.merchantReview.count({ where }),
    ]);

    return NextResponse.json({
      reviews,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching admin reviews:", error);
    return NextResponse.json({ error: "获取列表失败" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST - 批量审核
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.role || session.user.role !== "admin") {
      return NextResponse.json({ error: "无权限" }, { status: 403 });
    }

    const body = await request.json();
    const { reviewIds, action, reason } = auditSchema.parse(body);

    await prisma.merchantReview.updateMany({
      where: { id: { in: reviewIds } },
      data: {
        status: action,
      },
    });

    // 更新商家评分（重新计算所有已通过的点评）
    const reviews = await prisma.merchantReview.findMany({
      where: { id: { in: reviewIds } },
      select: { merchantId: true },
    });

    const merchantIds = [...new Set(reviews.map((r) => r.merchantId))];
    for (const merchantId of merchantIds) {
      const stats = await prisma.merchantReview.aggregate({
        where: { merchantId, status: "approved" },
        _avg: { rating: true },
        _count: true,
      });

      await prisma.merchant.update({
        where: { id: merchantId },
        data: {
          rating: stats._avg.rating || 0,
          reviewCount: stats._count,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error auditing reviews:", error);
    return NextResponse.json({ error: "审核失败" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
```

---

## 第五步：管理后台

### 文件：`src/app/admin/merchant-reviews/page.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";

interface Review {
  id: string;
  content: string;
  rating: number;
  status: string;
  createdAt: string;
  merchant: {
    name: string | null;
  };
  user: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  images: { id: string; url: string }[];
}

const STATUS_TABS = [
  { value: "pending", label: "待审核" },
  { value: "approved", label: "已通过" },
  { value: "rejected", label: "已拒绝" },
];

export default function AdminMerchantReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditAction, setAuditAction] = useState<"approved" | "rejected">("approved");

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "100",
        status: selectedStatus,
      });

      const response = await fetch(`/api/admin/merchant-reviews?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setReviews(data.reviews);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [selectedStatus]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReviews(reviews.map((r) => r.id));
    } else {
      setSelectedReviews([]);
    }
  };

  const handleSelectReview = (id: string) => {
    setSelectedReviews((prev) =>
      prev.includes(id) ? prev.filter((rid) => rid !== id) : [...prev, id]
    );
  };

  const handleBatchAudit = (action: "approved" | "rejected") => {
    setAuditAction(action);
    setShowAuditModal(true);
  };

  const confirmBatchAudit = async () => {
    try {
      const response = await fetch("/api/admin/merchant-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewIds: selectedReviews,
          action: auditAction,
        }),
      });

      if (response.ok) {
        alert("审核成功");
        setShowAuditModal(false);
        setSelectedReviews([]);
        fetchReviews();
      } else {
        const data = await response.json();
        alert(data.error || "审核失败");
      }
    } catch (error) {
      console.error("Audit error:", error);
      alert("网络错误，请稍后重试");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">商家点评审核</h1>
        <p className="text-gray-500 mt-1">审核用户提交的商家点评</p>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2 mb-4">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedStatus(tab.value)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedStatus === tab.value
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 批量操作 */}
      {selectedReviews.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between">
          <span className="text-blue-700">已选择 {selectedReviews.length} 条</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBatchAudit("approved")}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              批量通过
            </button>
            <button
              onClick={() => handleBatchAudit("rejected")}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              批量拒绝
            </button>
          </div>
        </div>
      )}

      {/* 列表 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500">暂无数据</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    checked={selectedReviews.length === reviews.length && reviews.length > 0}
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">内容</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">评分</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">商家</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">用户</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">时间</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">状态</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedReviews.includes(review.id)}
                      onChange={() => handleSelectReview(review.id)}
                    />
                  </td>
                  <td className="px-4 py-3 max-w-md">
                    <div>
                      <p className="text-gray-900 line-clamp-2">{review.content}</p>
                      {review.images.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {review.images.map((img) => (
                            <img
                              key={img.id}
                              src={img.url}
                              alt="点评图片"
                              className="w-12 h-12 object-cover rounded"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex text-yellow-500">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < review.rating ? "text-yellow-500" : "text-gray-300"}>
                          ★
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{review.merchant.name}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-gray-900">{review.user.name || "匿名用户"}</p>
                      <p className="text-sm text-gray-500">{review.user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        review.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : review.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {review.status === "approved" ? "已通过" : review.status === "rejected" ? "已拒绝" : "待审核"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 审核弹窗 */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">
              {auditAction === "approved" ? "通过审核" : "拒绝审核"}
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAuditModal(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={confirmBatchAudit}
                className={`flex-1 py-2 text-white rounded-lg ${
                  auditAction === "approved"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 第六步：点评组件

### 文件：`src/components/merchant/ReviewCard.tsx`

```tsx
interface ReviewCardProps {
  review: {
    id: string;
    content: string;
    rating: number;
    createdAt: string;
    helpful: number;
    user: {
      name: string | null;
      avatar: string | null;
    } | null;
    images: { id: string; url: string }[];
  };
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="border rounded-lg p-4 mb-4 bg-white">
      {/* 头部：用户信息 + 评分 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {review.user?.avatar ? (
            <img src={review.user.avatar} className="w-8 h-8 rounded-full" alt="" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
              {review.user?.name?.charAt(0) || "匿"}
            </div>
          )}
          <span className="font-medium text-gray-900">{review.user?.name || "匿名用户"}</span>
        </div>
        <div className="flex text-yellow-500">
          {[...Array(5)].map((_, i) => (
            <span key={i} className={i < review.rating ? "text-yellow-500" : "text-gray-300"}>
              ★
            </span>
          ))}
        </div>
      </div>

      {/* 内容 */}
      <p className="text-gray-700 mb-3">{review.content}</p>

      {/* 图片 */}
      {review.images?.length > 0 && (
        <div className="flex gap-2 mb-3 overflow-x-auto">
          {review.images.map((img) => (
            <img
              key={img.id}
              src={img.url}
              className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
              alt="点评图片"
            />
          ))}
        </div>
      )}

      {/* 底部：时间 + 有用数 + 举报 */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{new Date(review.createdAt).toLocaleDateString("zh-CN")}</span>
        <div className="flex gap-4">
          <button className="hover:text-blue-600 flex items-center gap-1">
            <span>👍</span>
            <span>有用 ({review.helpful})</span>
          </button>
          <button className="hover:text-red-600 flex items-center gap-1">
            <span>⚠️</span>
            <span>举报</span>
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 验收标准

### 功能验收
- [ ] 商家详情页有点评入口
- [ ] 用户可提交点评（含评分、内容、图片）
- [ ] 点评提交后进入待审核状态
- [ ] 无敏感词自动通过
- [ ] 有敏感词转人工审核
- [ ] 管理后台可批量审核
- [ ] 点评列表只显示已审核通过的

### 体验验收
- [ ] 评分组件交互流畅
- [ ] 图片上传有预览
- [ ] 提交成功有提示
- [ ] 审核状态可查询

---

## 预计工作量
- 数据库变更：0.5 小时
- API 开发：2 小时
- 前端页面：3 小时
- 组件封装：1 小时
- 联调测试：1.5 小时
- **总计：8 小时**

## 依赖项
- 敏感词检测功能

## 优先级
🔥 高优先级 - 用户需求

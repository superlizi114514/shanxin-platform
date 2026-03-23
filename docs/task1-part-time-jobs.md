# 任务一：山信兼职功能模块

## 任务概述
创建完整的兼职功能模块，包含用户发布兼职、申请兼职、管理审核等功能。

## 功能范围
- ✅ 兼职列表页面（支持搜索、筛选、排序）
- ✅ 发布兼职（学生/老师/商家均可发布）
- ✅ 申请兼职（在线提交申请）
- ✅ 收藏兼职
- ✅ 举报兼职
- ✅ 管理后台审核（自动审核 + 人工审核）

---

## 第一步：数据库 Schema 设计

### 文件：`prisma/schema.prisma`

在现有 Schema 中添加以下模型：

```prisma
// PartTimeJob (兼职信息)
model PartTimeJob {
  id           String   @id @default(cuid())
  title        String   // 职位名称
  description  String   // 工作描述（Markdown）
  salary       String   // 薪资描述（如：150 元/天）
  salaryMin    Float?   // 最低薪资（用于筛选）
  salaryMax    Float?   // 最高薪资（用于筛选）
  salaryUnit   String?  // 薪资单位：day/month/hour
  location     String   // 工作地点
  category     String   // 分类：家教/促销/服务员/文员/其他
  requirements String?  // 工作要求
  workTime     String   // 工作时段（如：周一至周五 9:00-18:00）
  startTime    DateTime? // 开始日期
  endTime      DateTime? // 结束日期
  deadline     DateTime? // 报名截止

  // 发布者信息
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // 商家信息（可选，如果是商家发布）
  merchantId   String?
  merchant     Merchant? @relation(fields: [merchantId], references: [id])

  // 状态
  status       String   @default("active") // active/closed/filled/expired
  views        Int      @default(0) // 浏览量
  applyCount   Int      @default(0) // 申请数

  // 审核
  autoCheck    Boolean  @default(true) // 是否通过自动审核
  checkReason  String?  // 审核原因（敏感词等）

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // 关联
  applications JobApplication[]
  images       PartTimeJobImage[]
  reports      JobReport[]

  @@index([status])
  @@index([userId])
  @@index([category])
  @@index([createdAt])
}

// PartTimeJobImage (兼职图片)
model PartTimeJobImage {
  id        String   @id @default(cuid())
  url       String
  jobId     String
  createdAt DateTime @default(now())

  job       PartTimeJob @relation(fields: [jobId], references: [id], onDelete: Cascade)
}

// JobApplication (兼职申请)
model JobApplication {
  id        String   @id @default(cuid())
  jobId     String
  job       PartTimeJob @relation(fields: [jobId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  status    String   @default("pending") // pending/accepted/rejected
  message   String?  // 申请备注
  resume    String?  // 简历 URL（可选）
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([jobId, userId]) // 同一用户不能重复申请同一职位
  @@index([status])
  @@index([userId])
}

// JobReport (兼职举报)
model JobReport {
  id        String   @id @default(cuid())
  jobId     String
  job       PartTimeJob @relation(fields: [jobId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  reason    String   // 举报原因
  status    String   @default("pending") // pending/resolved/rejected
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([status])
}
```

### 执行迁移
```bash
npx prisma migrate dev --name add_part_time_jobs
npx prisma generate
```

---

## 第二步：API 路由实现

### 目录结构
```
src/app/api/
├── part-time-jobs/
│   ├── route.ts              # GET 列表，POST 发布
│   ├── [id]/
│   │   ├── route.ts          # GET 详情，PATCH 更新，DELETE 删除
│   │   └── apply/route.ts    # POST 申请
│   ├── categories/route.ts   # GET 分类列表
│   └── report/route.ts       # POST 举报
└── admin/part-time-jobs/
    ├── route.ts              # 管理列表，批量审核
    └── [id]/
        ├── route.ts          # 管理详情
        └── audit/route.ts    # 审核操作
```

---

### 文件：`src/app/api/part-time-jobs/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { checkSensitiveWords } from "@/lib/sensitive-words";
import { paginationSchema } from "@/lib/validators";

const createJobSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(100, "标题不能超过 100 字"),
  description: z.string().min(10, "描述不能少于 10 字"),
  salary: z.string().min(1, "请输入薪资信息"),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  salaryUnit: z.enum(["day", "month", "hour"]).optional(),
  location: z.string().min(1, "请输入工作地点"),
  category: z.enum(["家教", "促销", "服务员", "文员", "其他"]),
  requirements: z.string().optional(),
  workTime: z.string().min(1, "请输入工作时段"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  deadline: z.string().optional(),
  merchantId: z.string().optional(),
  images: z.array(z.string()).optional(),
});

const querySchema = paginationSchema.extend({
  category: z.string().optional(),
  search: z.string().optional(),
  salaryUnit: z.string().optional(),
});

// GET - 获取兼职列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const { page, limit, category, search, salaryUnit } = querySchema.parse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      category: searchParams.get("category"),
      search: searchParams.get("search"),
      salaryUnit: searchParams.get("salaryUnit"),
    });

    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {
      status: "active", // 只显示有效的
    };

    // 分类筛选
    if (category && category !== "all") {
      where.category = category;
    }

    // 薪资类型筛选
    if (salaryUnit) {
      where.salaryUnit = salaryUnit;
    }

    // 搜索
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { location: { contains: search } },
      ];
    }

    // 并行查询
    const [jobs, total] = await Promise.all([
      prisma.partTimeJob.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              isTeacher: true,
            },
          },
          merchant: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
          _count: {
            select: {
              applications: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.partTimeJob.count({ where }),
    ]);

    return NextResponse.json({
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e) => e.message).join(", ");
      return NextResponse.json({ error: messages }, { status: 400 });
    }
    console.error("Error fetching jobs:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST - 发布兼职
export async function POST(request: NextRequest) {
  try {
    // 1. 验证登录
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    // 2. 验证请求体
    const body = await request.json();
    const validatedData = createJobSchema.parse(body);

    // 3. 敏感词检测（自动审核）
    const hasSensitiveWord = checkSensitiveWords(validatedData.title) ||
                            checkSensitiveWords(validatedData.description) ||
                            checkSensitiveWords(validatedData.requirements || "");

    const autoCheck = !hasSensitiveWord;
    const checkReason = hasSensitiveWord ? "包含敏感词，需要人工审核" : null;

    // 4. 创建兼职
    const job = await prisma.partTimeJob.create({
      data: {
        ...validatedData,
        userId: session.user.id,
        autoCheck,
        checkReason,
        status: autoCheck ? "active" : "pending", // 有敏感词转待审核
        images: validatedData.images
          ? { create: validatedData.images.map((url) => ({ url })) }
          : undefined,
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e) => e.message).join(", ");
      return NextResponse.json({ error: messages }, { status: 400 });
    }
    console.error("Error creating job:", error);
    return NextResponse.json({ error: "发布失败" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
```

---

### 文件：`src/app/api/part-time-jobs/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const paramsSchema = z.object({
  id: z.string(),
});

// GET - 获取兼职详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = paramsSchema.parse(params);

    const job = await prisma.partTimeJob.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            phone: true,
            isTeacher: true,
          },
        },
        merchant: {
          select: {
            id: true,
            name: true,
            logo: true,
            phone: true,
            address: true,
          },
        },
        images: true,
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "兼职不存在" }, { status: 404 });
    }

    // 增加浏览量
    await prisma.partTimeJob.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return NextResponse.json({ job });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e) => e.message).join(", ");
      return NextResponse.json({ error: messages }, { status: 400 });
    }
    console.error("Error fetching job:", error);
    return NextResponse.json({ error: "获取详情失败" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// PATCH - 更新兼职（仅发布者或管理员）
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = paramsSchema.parse(params);
    const body = await request.json();

    // 验证是否是发布者或管理员
    const existingJob = await prisma.partTimeJob.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingJob) {
      return NextResponse.json({ error: "兼职不存在" }, { status: 404 });
    }

    if (existingJob.userId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "无权限修改" }, { status: 403 });
    }

    const updatedJob = await prisma.partTimeJob.update({
      where: { id },
      data: body,
    });

    return NextResponse.json({ job: updatedJob });
  } catch (error) {
    console.error("Error updating job:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - 删除兼职
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = paramsSchema.parse(params);

    // 验证是否是发布者或管理员
    const existingJob = await prisma.partTimeJob.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingJob) {
      return NextResponse.json({ error: "兼职不存在" }, { status: 404 });
    }

    if (existingJob.userId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "无权限删除" }, { status: 403 });
    }

    await prisma.partTimeJob.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting job:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
```

---

### 文件：`src/app/api/part-time-jobs/[id]/apply/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const paramsSchema = z.object({
  id: z.string(),
});

const applySchema = z.object({
  message: z.string().optional(),
  resume: z.string().optional(),
});

// POST - 申请兼职
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { id } = paramsSchema.parse(params);
    const body = await request.json();
    const { message, resume } = applySchema.parse(body);

    // 检查兼职是否存在
    const job = await prisma.partTimeJob.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json({ error: "兼职不存在" }, { status: 404 });
    }

    // 检查是否已申请
    const existing = await prisma.jobApplication.findUnique({
      where: {
        jobId_userId: {
          jobId: id,
          userId: session.user.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "您已经申请过该职位" }, { status: 400 });
    }

    // 创建申请
    const application = await prisma.jobApplication.create({
      data: {
        jobId: id,
        userId: session.user.id,
        message,
        resume,
      },
    });

    // 更新申请数
    await prisma.partTimeJob.update({
      where: { id },
      data: { applyCount: { increment: 1 } },
    });

    // 发送通知给发布者
    await prisma.notification.create({
      data: {
        userId: job.userId,
        type: "message",
        title: "收到新的兼职申请",
        content: `用户${session.user.name || "匿名用户"}申请了您的兼职"${job.title}"`,
        link: `/part-time-jobs/${id}`,
      },
    });

    return NextResponse.json({ success: true, application });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e) => e.message).join(", ");
      return NextResponse.json({ error: messages }, { status: 400 });
    }
    console.error("Error applying job:", error);
    return NextResponse.json({ error: "申请失败" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
```

---

### 文件：`src/app/api/part-time-jobs/report/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const reportSchema = z.object({
  jobId: z.string(),
  reason: z.string().min(1, "请输入举报原因"),
});

// POST - 举报兼职
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const { jobId, reason } = reportSchema.parse(body);

    // 检查是否已举报
    const existing = await prisma.jobReport.findFirst({
      where: {
        jobId,
        userId: session.user.id,
      },
    });

    if (existing) {
      return NextResponse.json({ error: "请勿重复举报" }, { status: 400 });
    }

    const report = await prisma.jobReport.create({
      data: {
        jobId,
        userId: session.user.id,
        reason,
      },
    });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error("Error reporting job:", error);
    return NextResponse.json({ error: "举报失败" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
```

---

### 文件：`src/app/api/admin/part-time-jobs/route.ts`

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

// GET - 管理后台获取兼职列表
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
      status: searchParams.get("status"),
      search: searchParams.get("search"),
    });

    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [jobs, total] = await Promise.all([
      prisma.partTimeJob.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          merchant: {
            select: { id: true, name: true },
          },
          _count: {
            select: { applications: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.partTimeJob.count({ where }),
    ]);

    return NextResponse.json({
      jobs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching admin jobs:", error);
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
    const { jobIds, action, reason } = z.object({
      jobIds: z.array(z.string()),
      action: z.enum(["active", "rejected"]),
      reason: z.string().optional(),
    }).parse(body);

    await prisma.partTimeJob.updateMany({
      where: { id: { in: jobIds } },
      data: {
        status: action,
        checkReason: reason,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error auditing jobs:", error);
    return NextResponse.json({ error: "审核失败" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
```

---

## 第三步：前端页面实现

### 目录结构
```
src/app/
├── part-time-jobs/
│   ├── page.tsx            # 兼职列表页
│   ├── [id]/
│   │   └── page.tsx        # 兼职详情页
│   ├── new/
│   │   └── page.tsx        # 发布兼职
│   └── my/
│       ├── page.tsx        # 我的发布
│       └── applied/
│           └── page.tsx    # 我的申请
└── admin/part-time-jobs/
    └── page.tsx            # 管理后台 - 兼职审核
```

---

### 文件：`src/app/part-time-jobs/page.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface Job {
  id: string;
  title: string;
  salary: string;
  location: string;
  category: string;
  workTime: string;
  status: string;
  applyCount: number;
  _count: {
    applications: number;
  };
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    avatar: string | null;
    isTeacher: boolean;
  };
  merchant: {
    id: string;
    name: string | null;
    logo: string | null;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const CATEGORIES = ["全部", "家教", "促销", "服务员", "文员", "其他"];
const SALARY_UNITS = ["全部", "day", "month", "hour"];

export default function PartTimeJobsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // 筛选状态
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "全部"
  );
  const [selectedSalaryUnit, setSelectedSalaryUnit] = useState(
    searchParams.get("salaryUnit") || "全部"
  );
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );

  const fetchJobs = async (page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(selectedCategory !== "全部" && { category: selectedCategory }),
        ...(selectedSalaryUnit !== "全部" && { salaryUnit: selectedSalaryUnit }),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/part-time-jobs?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setJobs(data.jobs);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs(1);
  }, [selectedCategory, selectedSalaryUnit]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">兼职信息</h1>
            <p className="text-gray-500 mt-1">
              发现适合你的兼职机会
            </p>
          </div>
          <Link
            href="/part-time-jobs/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            发布兼职
          </Link>
        </div>

        {/* 筛选栏 */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            {/* 搜索框 */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索职位名称、地点..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 分类筛选 */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat === "全部" ? "" : cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* 薪资类型 */}
            <select
              value={selectedSalaryUnit}
              onChange={(e) => setSelectedSalaryUnit(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {SALARY_UNITS.map((unit) => (
                <option key={unit} value={unit === "全部" ? "" : unit}>
                  {unit === "day" ? "日结" : unit === "month" ? "月结" : unit === "hour" ? "时薪" : "全部"}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              搜索
            </button>
          </form>
        </div>

        {/* 兼职列表 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent" />
            <p className="text-gray-500 mt-4">加载中...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-gray-500 mt-4">暂无兼职信息</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/part-time-jobs/${job.id}`}
                className="block bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {job.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="text-green-600 font-medium">
                        {job.salary}
                      </span>
                      <span>{job.location}</span>
                      <span>{job.category}</span>
                      <span>{job.workTime}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      {job.merchant?.logo ? (
                        <img
                          src={job.merchant.logo}
                          alt={job.merchant.name || ""}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-200" />
                      )}
                      <span className="text-sm text-gray-600">
                        {job.merchant?.name || job.user.name || "匿名用户"}
                      </span>
                      <span className="text-xs text-gray-400">
                        已申请 {job._count.applications} 人
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-400">
                      {new Date(job.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* 分页 */}
        {!loading && jobs.length > 0 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => fetchJobs(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              上一页
            </button>
            <span className="text-gray-600">
              第 {pagination.page} / {pagination.totalPages} 页
            </span>
            <button
              onClick={() => fetchJobs(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### 文件：`src/app/part-time-jobs/[id]/page.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface JobDetail {
  id: string;
  title: string;
  description: string;
  salary: string;
  location: string;
  category: string;
  workTime: string;
  requirements?: string;
  startTime?: string;
  endTime?: string;
  deadline?: string;
  status: string;
  views: number;
  applyCount: number;
  _count: {
    applications: number;
  };
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    avatar: string | null;
    phone: string | null;
    isTeacher: boolean;
  };
  merchant: {
    id: string;
    name: string | null;
    logo: string | null;
    phone: string | null;
    address: string | null;
  } | null;
  images: { id: string; url: string }[];
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyMessage, setApplyMessage] = useState("");

  const fetchJob = async () => {
    try {
      const response = await fetch(`/api/part-time-jobs/${params.id}`);
      const data = await response.json();
      if (response.ok) {
        setJob(data.job);
      }
    } catch (error) {
      console.error("Failed to fetch job:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchJob();
    }
  }, [params.id]);

  const handleApply = async () => {
    if (!session) {
      router.push("/login");
      return;
    }

    setApplying(true);
    try {
      const response = await fetch(`/api/part-time-jobs/${params.id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: applyMessage }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("申请成功！");
        setShowApplyModal(false);
        fetchJob();
      } else {
        alert(data.error || "申请失败");
      }
    } catch (error) {
      console.error("Apply error:", error);
      alert("网络错误，请稍后重试");
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent" />
          <p className="text-gray-500 mt-4">加载中...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">兼职不存在</p>
          <Link href="/part-time-jobs" className="text-blue-600 hover:underline mt-2 block">
            返回列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 返回按钮 */}
        <Link
          href="/part-time-jobs"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          返回
        </Link>

        {/* 职位详情卡片 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="text-green-600 font-medium text-base">
                  {job.salary}
                </span>
                <span>{job.location}</span>
                <span>{job.category}</span>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm ${
                job.status === "active"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {job.status === "active" ? "招聘中" : "已结束"}
            </span>
          </div>

          {/* 公司信息 */}
          <div className="flex items-center gap-3 py-4 border-t border-b border-gray-100">
            {job.merchant?.logo ? (
              <img
                src={job.merchant.logo}
                alt={job.merchant.name || ""}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200" />
            )}
            <div>
              <p className="font-medium text-gray-900">
                {job.merchant?.name || job.user.name || "匿名用户"}
              </p>
              {job.merchant?.address && (
                <p className="text-sm text-gray-500">{job.merchant.address}</p>
              )}
            </div>
          </div>

          {/* 工作内容 */}
          <div className="py-4">
            <h3 className="font-semibold text-gray-900 mb-2">工作描述</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
          </div>

          {/* 工作要求 */}
          {job.requirements && (
            <div className="py-4">
              <h3 className="font-semibold text-gray-900 mb-2">工作要求</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{job.requirements}</p>
            </div>
          )}

          {/* 工作时段 */}
          <div className="py-4">
            <h3 className="font-semibold text-gray-900 mb-2">工作时段</h3>
            <p className="text-gray-700">{job.workTime}</p>
          </div>

          {/* 图片 */}
          {job.images && job.images.length > 0 && (
            <div className="py-4">
              <h3 className="font-semibold text-gray-900 mb-2">工作图片</h3>
              <div className="flex gap-2">
                {job.images.map((img) => (
                  <img
                    key={img.id}
                    src={img.url}
                    alt="工作图片"
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          {job.status === "active" && (
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowApplyModal(true)}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                立即申请
              </button>
              <button className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                收藏
              </button>
              <button className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors">
                举报
              </button>
            </div>
          )}
        </div>

        {/* 统计信息 */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{job.views}</p>
              <p className="text-sm text-gray-500">浏览量</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{job._count.applications}</p>
              <p className="text-sm text-gray-500">申请数</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {new Date(job.createdAt).toLocaleDateString("zh-CN")}
              </p>
              <p className="text-sm text-gray-500">发布时间</p>
            </div>
          </div>
        </div>
      </div>

      {/* 申请弹窗 */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">申请职位</h3>
            <textarea
              value={applyMessage}
              onChange={(e) => setApplyMessage(e.target.value)}
              placeholder="请输入申请备注（可选）"
              className="w-full border border-gray-300 rounded-lg p-3 h-32 mb-4 focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowApplyModal(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleApply}
                disabled={applying}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {applying ? "提交中..." : "提交申请"}
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

### 文件：`src/app/part-time-jobs/new/page.tsx`

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const CATEGORIES = ["家教", "促销", "服务员", "文员", "其他"];
const SALARY_UNITS = ["day", "month", "hour"];

export default function NewJobPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    salary: "",
    salaryMin: "",
    salaryMax: "",
    salaryUnit: "day",
    location: "",
    category: "家教",
    requirements: "",
    workTime: "",
    startTime: "",
    endTime: "",
    deadline: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/part-time-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          salaryMin: formData.salaryMin ? parseFloat(formData.salaryMin) : undefined,
          salaryMax: formData.salaryMax ? parseFloat(formData.salaryMax) : undefined,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(
          data.autoCheck
            ? "发布成功！"
            : "发布成功，等待审核后显示"
        );
        router.push(`/part-time-jobs/${data.id}`);
      } else {
        alert(data.error || "发布失败");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">发布兼职</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          {/* 职位名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              职位名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              maxLength={100}
              placeholder="如：周末促销员"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 薪资信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                薪资描述 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                required
                placeholder="如：150 元/天"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                薪资类型
              </label>
              <select
                name="salaryUnit"
                value={formData.salaryUnit}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {SALARY_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit === "day" ? "日结" : unit === "month" ? "月结" : "时薪"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 分类和地点 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                分类 <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                工作地点 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                placeholder="如：奎文校区食堂"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 工作描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              工作描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={5}
              placeholder="详细描述工作内容、职责等"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 工作要求 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              工作要求
            </label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              rows={3}
              placeholder="如：沟通能力好，有相关经验者优先"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 工作时段 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              工作时段 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="workTime"
              value={formData.workTime}
              onChange={handleChange}
              required
              placeholder="如：周一至周五 9:00-18:00"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 时间选择 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                开始日期
              </label>
              <input
                type="date"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                结束日期
              </label>
              <input
                type="date"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                报名截止
              </label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "发布中..." : "立即发布"}
            </button>
          </div>

          <p className="text-sm text-gray-500 text-center">
            {formData.description.length >= 10 && formData.title.length > 0
              ? "✓ 内容符合发布要求"
              : "请确保标题不为空，描述不少于 10 字"}
          </p>
        </form>
      </div>
    </div>
  );
}
```

---

### 文件：`src/app/admin/part-time-jobs/page.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Job {
  id: string;
  title: string;
  salary: string;
  location: string;
  status: string;
  autoCheck: boolean;
  checkReason?: string;
  applyCount: number;
  views: number;
  createdAt: string;
  user: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  merchant: {
    name: string | null;
  } | null;
}

const STATUS_TABS = [
  { value: "all", label: "全部" },
  { value: "pending", label: "待审核" },
  { value: "active", label: "已通过" },
  { value: "rejected", label: "已拒绝" },
];

export default function AdminPartTimeJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("pending");
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [auditReason, setAuditReason] = useState("");
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditAction, setAuditAction] = useState<"active" | "rejected">("active");

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "100",
        ...(selectedStatus !== "all" && { status: selectedStatus }),
      });

      const response = await fetch(`/api/admin/part-time-jobs?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setJobs(data.jobs);
      }
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [selectedStatus]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedJobs(jobs.map((j) => j.id));
    } else {
      setSelectedJobs([]);
    }
  };

  const handleSelectJob = (id: string) => {
    setSelectedJobs((prev) =>
      prev.includes(id) ? prev.filter((jid) => jid !== id) : [...prev, id]
    );
  };

  const handleBatchAudit = (action: "active" | "rejected") => {
    setAuditAction(action);
    setShowAuditModal(true);
  };

  const confirmBatchAudit = async () => {
    try {
      const response = await fetch("/api/admin/part-time-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobIds: selectedJobs,
          action: auditAction,
          reason: auditReason,
        }),
      });

      if (response.ok) {
        alert("审核成功");
        setShowAuditModal(false);
        setSelectedJobs([]);
        setAuditReason("");
        fetchJobs();
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
        <h1 className="text-2xl font-bold text-gray-900">兼职管理</h1>
        <p className="text-gray-500 mt-1">审核和管理用户发布的兼职信息</p>
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
      {selectedJobs.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between">
          <span className="text-blue-700">已选择 {selectedJobs.length} 条</span>
          <div className="flex gap-2">
            <button
              onClick={() => handleBatchAudit("active")}
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
      ) : jobs.length === 0 ? (
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
                    checked={selectedJobs.length === jobs.length && jobs.length > 0}
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">标题</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">薪资</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">地点</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">发布者</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">申请/浏览</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">状态</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">审核</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedJobs.includes(job.id)}
                      onChange={() => handleSelectJob(job.id)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{job.title}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(job.createdAt).toLocaleDateString("zh-CN")}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{job.salary}</td>
                  <td className="px-4 py-3 text-gray-600">{job.location}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-gray-900">{job.user.name || "匿名用户"}</p>
                      <p className="text-sm text-gray-500">{job.user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {job.applyCount} / {job.views}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        job.status === "active"
                          ? "bg-green-100 text-green-700"
                          : job.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {job.status === "active" ? "已通过" : job.status === "rejected" ? "已拒绝" : "待审核"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {!job.autoCheck && job.checkReason && (
                      <span className="text-sm text-red-600" title={job.checkReason}>
                        ⚠️ 敏感词
                      </span>
                    )}
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
              {auditAction === "active" ? "通过审核" : "拒绝审核"}
            </h3>
            <textarea
              value={auditReason}
              onChange={(e) => setAuditReason(e.target.value)}
              placeholder={auditAction === "active" ? "审核备注（可选）" : "拒绝原因"}
              className="w-full border border-gray-300 rounded-lg p-3 h-24 mb-4"
            />
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
                  auditAction === "active"
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

## 第四步：组件封装

### 文件：`src/components/part-time-jobs/JobCard.tsx`

```tsx
import Link from "next/link";

interface JobCardProps {
  job: {
    id: string;
    title: string;
    salary: string;
    location: string;
    category: string;
    workTime: string;
    status: string;
    _count: {
      applications: number;
    };
    createdAt: string;
    user: {
      name: string | null;
      avatar: string | null;
    };
    merchant: {
      name: string | null;
      logo: string | null;
    } | null;
  };
}

export function JobCard({ job }: JobCardProps) {
  return (
    <Link
      href={`/part-time-jobs/${job.id}`}
      className="block bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="text-green-600 font-medium">{job.salary}</span>
            <span>{job.location}</span>
            <span>{job.category}</span>
          </div>
          <div className="flex items-center gap-2 mt-3">
            {job.merchant?.logo ? (
              <img src={job.merchant.logo} alt="" className="w-6 h-6 rounded-full" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-200" />
            )}
            <span className="text-sm text-gray-600">
              {job.merchant?.name || job.user.name || "匿名用户"}
            </span>
            <span className="text-xs text-gray-400">
              已申请 {job._count.applications} 人
            </span>
          </div>
        </div>
        <div className="text-right">
          <span
            className={`px-2 py-1 rounded text-xs ${
              job.status === "active"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {job.status === "active" ? "招聘中" : "已结束"}
          </span>
          <p className="text-xs text-gray-400 mt-2">
            {new Date(job.createdAt).toLocaleDateString("zh-CN")}
          </p>
        </div>
      </div>
    </Link>
  );
}
```

---

## 第五步：验收标准

### 功能验收
- [ ] 用户可发布兼职（需登录）
- [ ] 发布后自动审核（无敏感词直接通过）
- [ ] 含敏感词转人工审核
- [ ] 用户可申请兼职（不能重复申请）
- [ ] 用户可查看兼职列表和详情
- [ ] 管理员可批量审核兼职
- [ ] 管理员可查看待审核/已通过/已拒绝状态

### 性能验收
- [ ] 列表页加载 < 1s
- [ ] 支持分页（每页 20 条）
- [ ] 搜索结果准确

### 体验验收
- [ ] 发布表单有验证提示
- [ ] 申请成功有反馈
- [ ] 审核状态清晰展示
- [ ] 敏感词有高亮提示

---

## 第六步：部署配置

### Vercel 环境变量
在 Vercel 项目设置中添加以下环境变量：
```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://your-project.vercel.app
NEXTAUTH_SECRET=your-secret
```

### API 部署
所有 API 路由自动部署到 Vercel Edge Functions，无需额外配置。

---

## 预计工作量
- 数据库迁移：0.5 小时
- API 开发：3 小时
- 前端页面：4 小时
- 组件封装：1 小时
- 联调测试：1.5 小时
- **总计：10 小时**

## 依赖项
- 无（独立模块）

## 优先级
🔥 高优先级 - 用户需求

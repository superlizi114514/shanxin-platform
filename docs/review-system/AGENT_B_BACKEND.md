# Agent B - 后端 API 开发

## 任务范围

负责用户点评商家系统的所有后端 API 开发，包括点评 CRUD、审核接口、举报处理、权限控制、中间件等。

---

## 任务清单

| ID | 任务 | 文件路径 | 状态 | 优先级 |
|----|------|---------|------|--------|
| B-01 | 创建点评 Schema 和 Model | `prisma/schema.prisma` | ⏳ | P0 |
| B-02 | 数据库迁移 | `prisma/migrations/` | ⏳ | P0 |
| B-03 | POST /api/reviews | `src/app/api/reviews/route.ts` | ⏳ | P0 |
| B-04 | GET /api/reviews | `src/app/api/reviews/route.ts` | ⏳ | P0 |
| B-05 | GET/DELETE /api/reviews/[id] | `src/app/api/reviews/[id]/route.ts` | ⏳ | P0 |
| B-06 | POST /api/reviews/[id]/helpful | `src/app/api/reviews/[id]/helpful/route.ts` | ⏳ | P1 |
| B-07 | POST /api/reviews/[id]/reply | `src/app/api/reviews/[id]/reply/route.ts` | ⏳ | P1 |
| B-08 | POST /api/reviews/[id]/report | `src/app/api/reviews/[id]/report/route.ts` | ⏳ | P1 |
| B-09 | 敏感词过滤中间件 | `src/middleware/sensitive-words.ts` | ⏳ | P0 |
| B-10 | 速率限制中间件 | `src/middleware/rate-limit.ts` | ⏳ | P0 |

---

## 数据库 Schema 设计

### Prisma Schema

**文件:** `prisma/schema.prisma`

```prisma
// 点评表
model Review {
  id           String    @id @default(cuid())
  userId       String    // 用户 ID
  merchantId   String    // 商家 ID
  content      String    // 点评内容
  rating       Int       // 评分 1-5
  images       String[]  // 图片 URL 数组
  status       String    // pending/approved/rejected/hidden
  isVerified   Boolean   @default(false)  // 是否实名认证后点评
  helpfulCount Int       @default(0)      // 点赞数
  reportCount  Int       @default(0)      // 举报数
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  user         User      @relation(fields: [userId], references: [id])
  merchant     Merchant  @relation(fields: [merchantId], references: [id])
  replies      ReviewReply[]
  reports      ReviewReport[]
  auditLogs    ReviewAuditLog[]
  helpfulUsers ReviewHelpful[]

  @@index([merchantId])
  @@index([userId])
  @@index([status])
  @@index([createdAt])
}

// 点评回复表
model ReviewReply {
  id         String   @id @default(cuid())
  reviewId   String
  userId     String   // 回复者 ID (商家或管理员)
  content    String
  createdAt  DateTime @default(now())

  review     Review   @relation(fields: [reviewId], references: [id], onDelete: Cascade)

  @@index([reviewId])
}

// 点评举报表
model ReviewReport {
  id         String   @id @default(cuid())
  reviewId   String
  userId     String   // 举报者 ID
  reason     String   // 举报原因
  status     String   @default("pending") // pending/resolved/ignored
  createdAt  DateTime @default(now())

  review     Review   @relation(fields: [reviewId], references: [id], onDelete: Cascade)

  @@index([reviewId])
  @@index([status])
  @@unique([reviewId, userId]) // 同一用户不能重复举报
}

// 审核日志表
model ReviewAuditLog {
  id         String   @id @default(cuid())
  reviewId   String
  adminId    String
  action     String   // approve/reject/hide/delete
  reason     String?
  createdAt  DateTime @default(now())

  review     Review   @relation(fields: [reviewId], references: [id], onDelete: Cascade)

  @@index([reviewId])
  @@index([adminId])
  @@index([createdAt])
}

// 点赞记录表 (防止重复点赞)
model ReviewHelpful {
  id         String   @id @default(cuid())
  reviewId   String
  userId     String

  review     Review   @relation(fields: [reviewId], references: [id], onDelete: Cascade)

  @@unique([reviewId, userId]) // 同一用户不能重复点赞
  @@index([reviewId])
  @@index([userId])
}

// User 和 Merchant 模型扩展 (在现有 schema 上添加)
model User {
  // ... 现有字段
  reviews        Review[]
  reviewReplies  ReviewReply[]
  reviewReports  ReviewReport[]
  reviewHelpfuls ReviewHelpful[]
}

model Merchant {
  // ... 现有字段
  reviews Review[]
}
```

---

## 数据库迁移

**文件:** `prisma/migrations/YYYYMMDDHHMMSS_add_review_system/migration.sql`

执行命令:
```bash
npx prisma migrate dev --name add_review_system
```

**验证迁移:**
```bash
npx prisma db push
npx prisma generate
```

---

## API 路由实现

### B-03/B-04: POST & GET /api/reviews

**文件:** `src/app/api/reviews/route.ts`

#### POST /api/reviews - 创建点评

**请求:**
```typescript
interface CreateReviewRequest {
  merchantId: string;
  content: string;      // 10-1000 字
  rating: number;       // 1-5
  images?: string[];    // 图片 URL 数组
}
```

**响应:**
```typescript
// 201 Created
{
  success: true;
  data: {
    id: string;
    status: 'pending' | 'approved';
    createdAt: string;
  };
}

// 400 Bad Request
{
  success: false;
  error: '验证失败信息';
}

// 401 Unauthorized
{
  success: false;
  error: '请先登录';
}

// 429 Too Many Requests
{
  success: false;
  error: '操作过于频繁，请稍后再试';
}
```

**业务逻辑:**
```typescript
async function POST(request: Request) {
  try {
    // 1. 验证用户登录
    const session = await auth();
    if (!session?.user?.id) {
      return json({ success: false, error: '请先登录' }, { status: 401 });
    }

    // 2. 验证输入 (Zod)
    const body = await request.json();
    const schema = z.object({
      merchantId: z.string().cuid(),
      content: z.string().min(10).max(1000),
      rating: z.number().min(1).max(5),
      images: z.array(z.string().url()).optional().default([]),
    });
    const parsed = schema.parse(body);

    // 3. 验证商家存在
    const merchant = await db.merchant.findUnique({
      where: { id: parsed.merchantId },
    });
    if (!merchant) {
      return json({ success: false, error: '商家不存在' }, { status: 404 });
    }

    // 4. 检查每日点评限制 (10 条/日)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await db.review.count({
      where: {
        userId: session.user.id,
        createdAt: { gte: today },
      },
    });
    if (todayCount >= 10) {
      return json({
        success: false,
        error: '今日点评已达上限 (10 条)'
      }, { status: 429 });
    }

    // 5. 敏感词检测
    const hasSensitiveWords = await checkSensitiveWords(parsed.content);

    // 6. 确定审核状态
    let status: 'pending' | 'approved' = 'approved';

    // 新用户 (注册<7 天) 或 未实名认证 → 待审核
    const userAge = Date.now() - new Date(session.user.createdAt).getTime();
    const isNewUser = userAge < 7 * 24 * 60 * 60 * 1000;
    const isVerified = session.user.isVerified ?? false;

    if (hasSensitiveWords || isNewUser || !isVerified) {
      status = 'pending';
    }

    // 7. 创建点评
    const review = await db.review.create({
      data: {
        ...parsed,
        userId: session.user.id,
        status,
      },
    });

    return json({
      success: true,
      data: {
        id: review.id,
        status: review.status,
        createdAt: review.createdAt,
      }
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return json({
        success: false,
        error: error.errors[0].message
      }, { status: 400 });
    }
    console.error('创建点评失败:', error);
    return json({
      success: false,
      error: '服务器错误'
    }, { status: 500 });
  }
}
```

#### GET /api/reviews - 获取点评列表

**请求参数:**
```typescript
interface GetReviewsQuery {
  merchantId?: string;   // 按商家筛选
  userId?: string;       // 按用户筛选
  status?: 'approved' | 'pending' | 'rejected' | 'hidden'; // 默认 'approved'
  page?: number;         // 默认 1
  pageSize?: number;     // 默认 20, 最大 100
  sortBy?: 'newest' | 'highest' | 'lowest' | 'helpful'; // 默认 'newest'
}
```

**响应:**
```typescript
{
  success: true;
  data: {
    reviews: ReviewWithUser[];
    total: number;
    page: number;
    pageSize: number;
    averageRating: number;
  };
}
```

**业务逻辑:**
```typescript
async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status') || 'approved';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 100);
    const sortBy = searchParams.get('sortBy') || 'newest';

    // 构建查询条件
    const where: Prisma.ReviewWhereInput = { status };
    if (merchantId) where.merchantId = merchantId;
    if (userId) where.userId = userId;

    // 排序
    const orderBy: Prisma.ReviewOrderByWithRelationInput = {};
    switch (sortBy) {
      case 'newest':
        orderBy.createdAt = 'desc';
        break;
      case 'highest':
        orderBy.rating = 'desc';
        break;
      case 'lowest':
        orderBy.rating = 'asc';
        break;
      case 'helpful':
        orderBy.helpfulCount = 'desc';
        break;
    }

    // 分页
    const skip = (page - 1) * pageSize;

    // 并行查询
    const [reviews, total, ratingStats] = await Promise.all([
      db.review.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              isVerified: true,
            },
          },
        },
      }),
      db.review.count({ where }),
      db.review.aggregate({
        where,
        _avg: { rating: true },
      }),
    ]);

    return json({
      success: true,
      data: {
        reviews,
        total,
        page,
        pageSize,
        averageRating: ratingStats._avg.rating || 0,
      },
    });

  } catch (error) {
    console.error('获取点评列表失败:', error);
    return json({
      success: false,
      error: '服务器错误'
    }, { status: 500 });
  }
}
```

---

### B-05: GET & DELETE /api/reviews/[id]

**文件:** `src/app/api/reviews/[id]/route.ts`

#### GET /api/reviews/[id]

```typescript
async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const review = await db.review.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, avatar: true, isVerified: true },
      },
      replies: {
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
        },
      },
    },
  });

  if (!review) {
    return json({ success: false, error: '点评不存在' }, { status: 404 });
  }

  return json({ success: true, data: review });
}
```

#### DELETE /api/reviews/[id]

**权限:** 仅作者或管理员可删除

```typescript
async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return json({ success: false, error: '请先登录' }, { status: 401 });
  }

  const { id } = await params;

  const review = await db.review.findUnique({ where: { id } });
  if (!review) {
    return json({ success: false, error: '点评不存在' }, { status: 404 });
  }

  // 权限检查：作者或管理员
  const isAdmin = session.user.role === 'admin';
  const isAuthor = review.userId === session.user.id;

  if (!isAdmin && !isAuthor) {
    return json({ success: false, error: '无权限删除' }, { status: 403 });
  }

  await db.review.delete({ where: { id } });

  return json({ success: true, data: { id } });
}
```

---

### B-06: POST /api/reviews/[id]/helpful

**文件:** `src/app/api/reviews/[id]/helpful/route.ts`

**功能:** 点赞点评 (不能重复点赞)

```typescript
async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return json({ success: false, error: '请先登录' }, { status: 401 });
  }

  const { id } = await params;

  // 检查点评存在
  const review = await db.review.findUnique({ where: { id } });
  if (!review) {
    return json({ success: false, error: '点评不存在' }, { status: 404 });
  }

  try {
    // 尝试创建点赞记录 (唯一索引防止重复)
    await db.reviewHelpful.create({
      data: {
        reviewId: id,
        userId: session.user.id,
      },
    });

    // 增加点赞数
    await db.review.update({
      where: { id },
      data: { helpfulCount: { increment: 1 } },
    });

    return json({ success: true, data: { helpfulCount: review.helpfulCount + 1 } });

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return json({ success: false, error: '已点赞过' }, { status: 400 });
    }
    throw error;
  }
}
```

---

### B-07: POST /api/reviews/[id]/reply

**文件:** `src/app/api/reviews/[id]/reply/route.ts`

**权限:** 仅商家或管理员可回复

```typescript
async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return json({ success: false, error: '请先登录' }, { status: 401 });
  }

  const { id } = await params;
  const { content } = await request.json();

  // 验证输入
  const schema = z.object({
    content: z.string().min(1).max(500),
  });
  const parsed = schema.parse({ content });

  // 检查点评存在
  const review = await db.review.findUnique({
    where: { id },
    include: { merchant: true },
  });
  if (!review) {
    return json({ success: false, error: '点评不存在' }, { status: 404 });
  }

  // 权限检查：管理员 或 商家 owner
  const isAdmin = session.user.role === 'admin';
  const isMerchantOwner = review.merchant.ownerId === session.user.id;

  if (!isAdmin && !isMerchantOwner) {
    return json({ success: false, error: '无权限回复' }, { status: 403 });
  }

  const reply = await db.reviewReply.create({
    data: {
      reviewId: id,
      userId: session.user.id,
      content: parsed.content,
    },
  });

  return json({ success: true, data: reply });
}
```

---

### B-08: POST /api/reviews/[id]/report

**文件:** `src/app/api/reviews/[id]/report/route.ts`

**功能:** 举报点评

```typescript
async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return json({ success: false, error: '请先登录' }, { status: 401 });
  }

  const { id } = await params;
  const { reason } = await request.json();

  // 验证输入
  const schema = z.object({
    reason: z.enum(['虚假广告', '恶意诋毁', '不当内容', '其他']),
  });
  const parsed = schema.parse({ reason });

  // 检查点评存在
  const review = await db.review.findUnique({ where: { id } });
  if (!review) {
    return json({ success: false, error: '点评不存在' }, { status: 404 });
  }

  try {
    // 创建举报记录
    await db.reviewReport.create({
      data: {
        reviewId: id,
        userId: session.user.id,
        reason: parsed.reason,
      },
    });

    // 增加举报数
    const updatedReview = await db.review.update({
      where: { id },
      data: { reportCount: { increment: 1 } },
    });

    // 自动隐藏逻辑：举报数 >= 5 且 review 状态为 approved
    if (updatedReview.reportCount >= 5 && updatedReview.status === 'approved') {
      await db.review.update({
        where: { id },
        data: { status: 'hidden' },
      });
      // TODO: 发送通知给管理员
    }

    return json({
      success: true,
      data: {
        reportCount: updatedReview.reportCount + 1,
        status: updatedReview.status,
      }
    });

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return json({ success: false, error: '已举报过' }, { status: 400 });
    }
    throw error;
  }
}
```

---

## 中间件实现

### B-09: 敏感词过滤中间件

**文件:** `src/middleware/sensitive-words.ts`

```typescript
import { sensitiveWords as sensitiveWordsList } from '@/lib/sensitive-words';

export class SensitiveWordFilter {
  private trie: Map<string, any> = new Map();

  constructor(words: string[]) {
    this.buildTrie(words);
  }

  private buildTrie(words: string[]) {
    for (const word of words) {
      let node = this.trie;
      for (const char of word) {
        if (!node.has(char)) {
          node.set(char, new Map());
        }
        node = node.get(char);
      }
      node.set('__END__', true);
    }
  }

  hasSensitiveWord(text: string): boolean {
    for (let i = 0; i < text.length; i++) {
      let node = this.trie;
      for (let j = i; j < text.length; j++) {
        if (!node.has(text[j])) break;
        node = node.get(text[j]);
        if (node.get('__END__')) return true;
      }
    }
    return false;
  }

  filter(text: string, replacement = '*'): string {
    let result = text;
    for (const word of sensitiveWordsList) {
      const regex = new RegExp(word, 'g');
      result = result.replace(regex, replacement.repeat(word.length));
    }
    return result;
  }
}

// 导出单例
const sensitiveWordList = await import('@/lib/sensitive-words')
  .then(m => m.sensitiveWords);
export const sensitiveWordFilter = new SensitiveWordFilter(sensitiveWordList);

// 辅助函数
export async function checkSensitiveWords(text: string): Promise<boolean> {
  return sensitiveWordFilter.hasSensitiveWord(text);
}
```

**敏感词库:** `src/lib/sensitive-words.ts`
```typescript
export const sensitiveWords = [
  // 从数据库或配置文件加载
  // 示例：['赌博', '彩票', ' ...']
];

// 从数据库动态加载
export async function loadSensitiveWords(): Promise<string[]> {
  // 从数据库或缓存加载
  return [];
}
```

---

### B-10: 速率限制中间件

**文件:** `src/middleware/rate-limit.ts`

```typescript
import { kv } from '@vercel/kv';

interface RateLimitConfig {
  keyPrefix: string;
  limit: number;
  windowMs: number;
}

const rateLimitConfigs = {
  // 每 IP 每小时 20 条点评
  reviewPerIp: {
    keyPrefix: 'rate_limit:review:ip:',
    limit: 20,
    windowMs: 60 * 60 * 1000, // 1 小时
  },
  // 每用户每日 10 条点评
  reviewPerUser: {
    keyPrefix: 'rate_limit:review:user:',
    limit: 10,
    windowMs: 24 * 60 * 60 * 1000, // 24 小时
  },
};

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const key = `${config.keyPrefix}${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // 使用 Redis/Zod 实现滑动窗口
  // 简化版本：固定窗口计数
  const current = await kv.get<number>(key) || 0;

  if (current >= config.limit) {
    const ttl = await kv.ttl(key);
    return {
      allowed: false,
      remaining: 0,
      resetAt: now + ttl * 1000,
    };
  }

  // 增加计数
  await kv.incr(key);
  await kv.expire(key, Math.ceil(config.windowMs / 1000));

  return {
    allowed: true,
    remaining: config.limit - current - 1,
    resetAt: now + config.windowMs,
  };
}

// API 路由中使用
export async function validateReviewRateLimit(
  userId: string,
  ip: string
): Promise<{ allowed: boolean; error?: string }> {
  const [userLimit, ipLimit] = await Promise.all([
    checkRateLimit(userId, rateLimitConfigs.reviewPerUser),
    checkRateLimit(ip, rateLimitConfigs.reviewPerIp),
  ]);

  if (!userLimit.allowed) {
    return { allowed: false, error: '今日点评已达上限 (10 条)' };
  }

  if (!ipLimit.allowed) {
    return { allowed: false, error: '操作过于频繁，请稍后再试' };
  }

  return { allowed: true };
}
```

---

## API 响应格式规范

所有 API 响应遵循统一格式:

```typescript
// 成功响应
{
  success: true;
  data: T;
}

// 错误响应
{
  success: false;
  error: string;
  code?: string; // 可选的错误码
}

// 分页响应
{
  success: true;
  data: {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
  };
}
```

---

## 验收标准

### 功能验收
- [ ] 所有 API 通过 Zod 验证输入
- [ ] 错误处理完善，返回 appropriate HTTP 状态码
- [ ] 权限验证正确 (登录检查、角色检查、资源所有权检查)
- [ ] 速率限制生效 (KV 存储正常工作)
- [ ] 敏感词过滤正常工作

### 性能验收
- [ ] 点评列表 API < 100ms (P95)
- [ ] 点评创建 API < 200ms (P95)
- [ ] 数据库查询有合适索引
- [ ] N+1 查询问题已解决

### 安全验收
- [ ] SQL 注入防护 (Prisma 参数化查询)
- [ ] XSS 防护 (内容转义)
- [ ] CSRF 保护 (NextAuth 内置)
- [ ] 不泄漏敏感信息 (错误消息)

---

## 依赖关系

### 需要 Agent A 协调
- API 响应格式确认
- 错误码统一规范

### 需要 Agent C 协调
- 管理员专用 API 接口
- 批量操作接口设计

### 需要 Agent D 配合
- 提供测试数据
- 性能测试反馈

---

## 开发提示

1. **数据库操作:** 使用 Prisma，注意事务处理
2. **错误处理:** 统一使用 try-catch，返回标准错误格式
3. **日志:** 关键操作记录日志 (审核、删除、举报处理)
4. **环境变量:** 确保 `DATABASE_URL` 和 `KV_REST_API_URL` 配置正确

---

## 开始指令

Agent B 收到任务后，请执行:

```bash
# 1. 更新 Prisma Schema
# 2. 执行数据库迁移
npx prisma migrate dev --name add_review_system

# 3. 按优先级开发 API
# P0: Schema → 迁移 → POST /reviews → GET /reviews
# P1: 其他 CRUD → 中间件
```

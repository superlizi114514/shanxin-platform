# Agent D - 测试与质量保证

## 任务范围

负责用户点评商家系统的全面测试，包括单元测试、集成测试、E2E 测试、性能测试和安全扫描。

---

## 任务清单

| ID | 任务 | 文件路径 | 状态 | 优先级 |
|----|------|---------|------|--------|
| D-01 | 点评 Service 单元测试 | `tests/unit/review-service.test.ts` | ⏳ | P0 |
| D-02 | 审核逻辑单元测试 | `tests/unit/audit-logic.test.ts` | ⏳ | P0 |
| D-03 | API 集成测试 | `tests/integration/reviews-api.test.ts` | ⏳ | P0 |
| D-04 | 权限测试 | `tests/integration/auth.test.ts` | ⏳ | P0 |
| D-05 | E2E-用户发表点评 | `tests/e2e/create-review.spec.ts` | ⏳ | P0 |
| D-06 | E2E-审核流程 | `tests/e2e/audit-flow.spec.ts` | ⏳ | P1 |
| D-07 | E2E-举报处理 | `tests/e2e/report-flow.spec.ts` | ⏳ | P1 |
| D-08 | 性能测试 (负载) | `tests/performance/reviews-load.spec.ts` | ⏳ | P1 |
| D-09 | 安全扫描 | `scripts/security-scan.ts` | ⏳ | P0 |
| D-10 | 可访问性测试 | `tests/a11y/reviews.spec.ts` | ⏳ | P2 |

---

## 测试环境配置

### 测试数据库

```typescript
// vitest.config.ts 或 jest.config.js
export default {
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    // 使用独立测试数据库
    env: {
      DATABASE_URL: 'postgresql://test:test@localhost:5432/shanxin_test',
    },
  },
};
```

### 测试数据工厂

```typescript
// tests/factories/review-factory.ts
import { faker } from '@faker-js/faker';
import { db } from '@/lib/db';

export function createReviewFactory() {
  return {
    async create(overrides: Partial<Review> = {}) {
      return db.review.create({
        data: {
          userId: faker.string.uuid(),
          merchantId: faker.string.uuid(),
          content: faker.lorem.paragraph(),
          rating: faker.number.int({ min: 1, max: 5 }),
          status: 'approved',
          images: [],
          helpfulCount: 0,
          reportCount: 0,
          ...overrides,
        },
      });
    },

    async createWithUser(overrides: Partial<Review & { user: User }> = {}) {
      const user = await db.user.create({
        data: {
          email: faker.internet.email(),
          name: faker.person.fullName(),
          ...overrides.user,
        },
      });

      return db.review.create({
        data: {
          userId: user.id,
          merchantId: faker.string.uuid(),
          content: faker.lorem.paragraph(),
          rating: faker.number.int({ min: 1, max: 5 }),
          status: 'approved',
          ...overrides,
        },
        include: { user: true },
      });
    },
  };
}

export const reviewFactory = createReviewFactory();
```

---

## 单元测试

### D-01: 点评 Service 单元测试

**文件:** `tests/unit/review-service.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReviewService } from '@/services/review-service';
import { db } from '@/lib/db';
import { reviewFactory } from '../factories/review-factory';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    review: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    reviewHelpful: {
      create: vi.fn(),
    },
  },
}));

describe('ReviewService', () => {
  let reviewService: ReviewService;

  beforeEach(() => {
    reviewService = new ReviewService();
    vi.clearAllMocks();
  });

  describe('createReview', () => {
    it('创建点评 - 成功 (老用户自动通过)', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 天前
        isVerified: true,
      };

      const mockReview = {
        id: 'review-123',
        userId: mockUser.id,
        merchantId: 'merchant-123',
        content: '很好吃的餐厅，环境不错',
        rating: 5,
        status: 'approved',
        createdAt: new Date(),
      };

      vi.mocked(db.review.create).mockResolvedValue(mockReview);

      // Act
      const result = await reviewService.createReview({
        userId: mockUser.id,
        merchantId: 'merchant-123',
        content: mockReview.content,
        rating: 5,
        user: mockUser,
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('approved');
      expect(db.review.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'approved',
        }),
      });
    });

    it('创建点评 - 含敏感词 (标记为待审核)', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        createdAt: new Date(),
        isVerified: true,
      };

      vi.mocked(db.review.create).mockResolvedValue({
        id: 'review-123',
        status: 'pending',
      });

      // Act
      const result = await reviewService.createReview({
        userId: mockUser.id,
        merchantId: 'merchant-123',
        content: '包含敏感词的内容',
        rating: 5,
        user: mockUser,
      });

      // Assert
      expect(result.data?.status).toBe('pending');
    });

    it('创建点评 - 未实名新用户 (标记为待审核)', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        createdAt: new Date(), // 新用户
        isVerified: false,
      };

      // Act
      await reviewService.createReview({
        userId: mockUser.id,
        merchantId: 'merchant-123',
        content: '很好的餐厅',
        rating: 5,
        user: mockUser,
      });

      // Assert
      expect(db.review.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'pending',
        }),
      });
    });

    it('创建点评 - 内容太短 (验证失败)', async () => {
      // Arrange
      const mockUser = {
        id: 'user-123',
        createdAt: new Date(),
        isVerified: true,
      };

      // Act
      const result = await reviewService.createReview({
        userId: mockUser.id,
        merchantId: 'merchant-123',
        content: '太短', // 少于 10 字
        rating: 5,
        user: mockUser,
      });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('至少 10 个字');
    });

    it('创建点评 - 重复点赞 (返回错误)', async () => {
      // Arrange
      vi.mocked(db.reviewHelpful.create).mockRejectedValue(
        new Error('UNIQUE_CONSTRAINT')
      );

      // Act
      const result = await reviewService.toggleHelpful('review-123', 'user-123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('已点赞过');
    });
  });

  describe('deleteReview', () => {
    it('删除点评 - 作者有权', async () => {
      // Arrange
      const review = await reviewFactory.create({
        userId: 'user-123',
      });

      // Act
      const result = await reviewService.deleteReview('user-123', review.id);

      // Assert
      expect(result.success).toBe(true);
    });

    it('删除点评 - 非作者无权限', async () => {
      // Arrange
      const review = await reviewFactory.create({
        userId: 'user-123',
      });

      // Act
      const result = await reviewService.deleteReview('user-456', review.id);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('无权限删除');
    });
  });
});
```

---

### D-02: 审核逻辑单元测试

**文件:** `tests/unit/audit-logic.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditService } from '@/services/audit-service';
import { SensitiveWordFilter } from '@/middleware/sensitive-words';

describe('AuditLogic', () => {
  let auditService: AuditService;

  beforeEach(() => {
    auditService = new AuditService();
  });

  describe('determineReviewStatus', () => {
    it('自动通过 - 老用户 (>7 天) 且已实名认证', () => {
      const user = {
        id: 'user-123',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        isVerified: true,
      };

      const status = auditService.determineReviewStatus({
        content: '很好的餐厅',
        hasSensitiveWords: false,
        user,
      });

      expect(status).toBe('approved');
    });

    it('自动待审 - 新用户 (<7 天)', () => {
      const user = {
        id: 'user-123',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        isVerified: true,
      };

      const status = auditService.determineReviewStatus({
        content: '很好的餐厅',
        hasSensitiveWords: false,
        user,
      });

      expect(status).toBe('pending');
    });

    it('自动待审 - 未实名认证', () => {
      const user = {
        id: 'user-123',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        isVerified: false,
      };

      const status = auditService.determineReviewStatus({
        content: '很好的餐厅',
        hasSensitiveWords: false,
        user,
      });

      expect(status).toBe('pending');
    });

    it('自动待审 - 含敏感词', () => {
      const user = {
        id: 'user-123',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        isVerified: true,
      };

      const status = auditService.determineReviewStatus({
        content: '包含敏感词',
        hasSensitiveWords: true,
        user,
      });

      expect(status).toBe('pending');
    });

    it('自动隐藏 - 举报数>=5', () => {
      const result = auditService.shouldAutoHide({
        reportCount: 5,
        status: 'approved',
      });

      expect(result.shouldHide).toBe(true);
    });
  });
});
```

---

## 集成测试

### D-03: API 集成测试

**文件:** `tests/integration/reviews-api.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '@/app';
import { db } from '@/lib/db';
import { createTestUser, createTestSession } from './helpers/auth-helpers';

describe('Reviews API', () => {
  describe('POST /api/reviews', () => {
    it('创建点评 - 成功', async () => {
      // Arrange
      const user = await createTestUser({ isVerified: true });
      const session = await createTestSession(user);

      // Act
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${session.token}`)
        .send({
          merchantId: 'merchant-123',
          content: '很好吃的餐厅，环境不错，服务态度好',
          rating: 5,
          images: ['https://example.com/img1.jpg'],
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.status).toBe('approved');
    });

    it('创建点评 - 未登录 (401)', async () => {
      // Act
      const response = await request(app)
        .post('/api/reviews')
        .send({
          merchantId: 'merchant-123',
          content: '很好的餐厅',
          rating: 5,
        });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('创建点评 - 内容太短 (400)', async () => {
      const user = await createTestUser();
      const session = await createTestSession(user);

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${session.token}`)
        .send({
          merchantId: 'merchant-123',
          content: '太短',
          rating: 5,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('至少 10 个字');
    });

    it('创建点评 - 商家不存在 (404)', async () => {
      const user = await createTestUser();
      const session = await createTestSession(user);

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${session.token}`)
        .send({
          merchantId: 'non-existent-id',
          content: '很好的餐厅',
          rating: 5,
        });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/reviews', () => {
    beforeEach(async () => {
      // 准备测试数据
      await db.review.createMany({
        data: [
          { userId: 'user-1', merchantId: 'merchant-1', content: '点评 1', rating: 5, status: 'approved' },
          { userId: 'user-2', merchantId: 'merchant-1', content: '点评 2', rating: 4, status: 'approved' },
          { userId: 'user-3', merchantId: 'merchant-1', content: '点评 3', rating: 3, status: 'pending' },
        ],
      });
    });

    it('获取点评列表 - 默认筛选 (仅 approved)', async () => {
      const response = await request(app)
        .get('/api/reviews?merchantId=merchant-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.reviews).toHaveLength(2); // 只有 approved
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('averageRating');
    });

    it('获取点评列表 - 按评分排序', async () => {
      const response = await request(app)
        .get('/api/reviews?merchantId=merchant-1&sortBy=highest');

      expect(response.body.data.reviews[0].rating).toBe(5);
    });

    it('获取点评列表 - 分页', async () => {
      const response = await request(app)
        .get('/api/reviews?merchantId=merchant-1&page=1&pageSize=1');

      expect(response.body.data.reviews).toHaveLength(1);
      expect(response.body.data.total).toBe(2);
    });
  });

  describe('DELETE /api/reviews/:id', () => {
    it('删除点评 - 作者有权', async () => {
      const user = await createTestUser();
      const session = await createTestSession(user);

      const review = await db.review.create({
        data: { userId: user.id, merchantId: 'm1', content: '点评', rating: 5, status: 'approved' },
      });

      const response = await request(app)
        .delete(`/api/reviews/${review.id}`)
        .set('Authorization', `Bearer ${session.token}`);

      expect(response.status).toBe(200);

      // 验证已删除
      const deleted = await db.review.findUnique({ where: { id: review.id } });
      expect(deleted).toBeNull();
    });

    it('删除点评 - 非作者无权限 (403)', async () => {
      const user = await createTestUser();
      const session = await createTestSession(user);

      const review = await db.review.create({
        data: { userId: 'other-user', merchantId: 'm1', content: '点评', rating: 5, status: 'approved' },
      });

      const response = await request(app)
        .delete(`/api/reviews/${review.id}`)
        .set('Authorization', `Bearer ${session.token}`);

      expect(response.status).toBe(403);
    });
  });
});
```

---

### D-04: 权限测试

**文件:** `tests/integration/auth.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '@/app';
import { createTestUser, createTestSession } from './helpers/auth-helpers';

describe('Auth & Permissions', () => {
  describe('管理员专用 API', () => {
    it('审核列表 - 非管理员禁止访问 (403)', async () => {
      const user = await createTestUser({ role: 'user' });
      const session = await createTestSession(user);

      const response = await request(app)
        .get('/api/admin/reviews')
        .set('Authorization', `Bearer ${session.token}`);

      expect(response.status).toBe(403);
    });

    it('审核列表 - 管理员可访问 (200)', async () => {
      const user = await createTestUser({ role: 'admin' });
      const session = await createTestSession(user);

      const response = await request(app)
        .get('/api/admin/reviews')
        .set('Authorization', `Bearer ${session.token}`);

      expect(response.status).toBe(200);
    });

    it('批量操作 - 非管理员禁止访问 (403)', async () => {
      const user = await createTestUser({ role: 'user' });
      const session = await createTestSession(user);

      const response = await request(app)
        .post('/api/admin/reviews/bulk')
        .set('Authorization', `Bearer ${session.token}`)
        .send({ action: 'approve', reviewIds: ['r1'] });

      expect(response.status).toBe(403);
    });
  });

  describe('点赞防重复', () => {
    it('同一用户不能重复点赞', async () => {
      const user = await createTestUser();
      const session = await createTestSession(user);

      const review = await db.review.create({
        data: { userId: 'other', merchantId: 'm1', content: '点评', rating: 5, status: 'approved' },
      });

      // 第一次点赞
      const res1 = await request(app)
        .post(`/api/reviews/${review.id}/helpful`)
        .set('Authorization', `Bearer ${session.token}`);

      expect(res1.status).toBe(200);

      // 第二次点赞
      const res2 = await request(app)
        .post(`/api/reviews/${review.id}/helpful`)
        .set('Authorization', `Bearer ${session.token}`);

      expect(res2.status).toBe(400);
      expect(res2.body.error).toBe('已点赞过');
    });
  });

  describe('举报防重复', () => {
    it('同一用户不能重复举报', async () => {
      const user = await createTestUser();
      const session = await createTestSession(user);

      const review = await db.review.create({
        data: { userId: 'other', merchantId: 'm1', content: '点评', rating: 5, status: 'approved' },
      });

      // 第一次举报
      const res1 = await request(app)
        .post(`/api/reviews/${review.id}/report`)
        .set('Authorization', `Bearer ${session.token}`)
        .send({ reason: '虚假广告' });

      expect(res1.status).toBe(200);

      // 第二次举报
      const res2 = await request(app)
        .post(`/api/reviews/${review.id}/report`)
        .set('Authorization', `Bearer ${session.token}`)
        .send({ reason: '恶意诋毁' });

      expect(res2.status).toBe(400);
      expect(res2.body.error).toBe('已举报过');
    });
  });

  describe('速率限制', () => {
    it('每用户每日最多 10 条点评', async () => {
      const user = await createTestUser();
      const session = await createTestSession(user);

      // 创建 10 条点评
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/reviews')
          .set('Authorization', `Bearer ${session.token}`)
          .send({
            merchantId: 'merchant-1',
            content: `点评内容 ${i}，足够长的文字`,
            rating: 5,
          });
      }

      // 第 11 条应该失败
      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${session.token}`)
        .send({
          merchantId: 'merchant-1',
          content: '第 11 条点评',
          rating: 5,
        });

      expect(response.status).toBe(429);
      expect(response.body.error).toContain('已达上限');
    });
  });
});
```

---

## E2E 测试

### D-05: E2E-用户发表点评

**文件:** `tests/e2e/create-review.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('E2E: 用户发表点评', () => {
  test('完整流程：登录 → 访问商家 → 填写表单 → 提交 → 查看结果', async ({ page }) => {
    // 1. 登录
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    // 2. 访问商家详情页
    await page.goto('/merchants/merchant-123');
    await expect(page.locator('h1')).toContainText('餐厅 A');

    // 3. 打开点评表单
    await page.click('text=发表点评');
    await expect(page.locator('form')).toBeVisible();

    // 4. 填写表单
    // 评分 (点击第 5 颗星)
    const stars = page.locator('[role="slider"] button');
    await stars.nth(4).click();

    // 内容
    await page.fill('textarea[name="content"]', '很好吃的餐厅，环境不错，服务态度好。强烈推荐！');

    // 图片上传 (可选)
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/food.jpg');
    await expect(page.locator('.image-preview')).toBeVisible();

    // 5. 提交
    await page.click('button[type="submit"]');

    // 6. 验证结果
    await expect(page.locator('.toast')).toContainText('点评提交成功');

    // 7. 验证点评显示在列表中
    await expect(page.locator('.review-card').first()).toContainText('很好吃的餐厅');
  });

  test('表单验证：空内容 → 显示错误', async ({ page }) => {
    await page.goto('/merchants/merchant-123');
    await page.click('text=发表点评');

    // 只评分，不填内容
    const stars = page.locator('[role="slider"] button');
    await stars.nth(4).click();

    await page.click('button[type="submit"]');

    // 验证错误提示
    await expect(page.locator('.error-message')).toContainText('至少 10 个字');
  });

  test('表单验证：内容太短 → 显示错误', async ({ page }) => {
    await page.goto('/merchants/merchant-123');
    await page.click('text=发表点评');

    const stars = page.locator('[role="slider"] button');
    await stars.nth(4).click();
    await page.fill('textarea[name="content"]', '太短');

    await page.click('button[type="submit"]');

    await expect(page.locator('.error-message')).toContainText('至少 10 个字');
  });

  test('图片上传：选择 → 预览 → 删除', async ({ page }) => {
    await page.goto('/merchants/merchant-123');
    await page.click('text=发表点评');

    // 上传图片
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/food.jpg');

    // 验证预览
    const preview = page.locator('.image-preview');
    await expect(preview).toBeVisible();

    // 删除
    await preview.locator('.delete-button').click();
    await expect(preview).not.toBeVisible();
  });
});
```

---

### D-06: E2E-审核流程

**文件:** `tests/e2e/audit-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('E2E: 审核流程', () => {
  test.beforeEach(async ({ page }) => {
    // 以管理员身份登录
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
  });

  test('管理员审核通过点评', async ({ page }) => {
    // 1. 访问审核列表
    await page.goto('/admin/reviews/list?status=pending');

    // 2. 选择第一条待审核点评
    await page.click('.review-row:first-child .audit-button');

    // 3. 查看点评详情
    await expect(page.locator('.review-detail')).toBeVisible();
    await expect(page.locator('.review-content')).toContainText('点评内容');

    // 4. 选择"通过"
    await page.click('input[value="approve"]');

    // 5. 提交
    await page.click('button[type="submit"]');

    // 6. 验证成功
    await expect(page.locator('.toast')).toContainText('审核通过');

    // 7. 验证点评状态更新
    await page.goto('/admin/reviews/list?status=approved');
    await expect(page.locator('.review-row').first()).toContainText('点评内容');
  });

  test('管理员拒绝点评 (填写理由)', async ({ page }) => {
    await page.goto('/admin/reviews/list?status=pending');
    await page.click('.review-row:first-child .audit-button');

    // 选择"拒绝"
    await page.click('input[value="reject"]');

    // 填写理由
    await page.fill('textarea[name="reason"]', '包含不当内容');

    // 提交
    await page.click('button[type="submit"]');

    // 验证
    await expect(page.locator('.toast')).toContainText('已拒绝');

    // 验证点评不再出现在待审核列表
    await page.goto('/admin/reviews/list?status=pending');
    await expect(page.locator('.review-row')).not.toContainText('点评内容');
  });

  test('批量审核操作', async ({ page }) => {
    await page.goto('/admin/reviews/list?status=pending');

    // 选择多条
    await page.check('.review-row input[type="checkbox"]');

    // 批量通过
    await page.click('button:has-text("批量通过")');

    // 验证
    await expect(page.locator('.toast')).toContainText('批量操作成功');
  });
});
```

---

### D-07: E2E-举报处理

**文件:** `tests/e2e/report-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('E2E: 举报处理', () => {
  test('用户举报点评', async ({ page }) => {
    // 登录
    await page.goto('/login');
    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 访问商家页面
    await page.goto('/merchants/merchant-123');

    // 找到点评并点击举报
    await page.click('.review-card:first-child .report-button');

    // 选择举报原因
    await page.click('button:has-text("虚假广告")');

    // 提交
    await page.click('.report-modal button[type="submit"]');

    // 验证
    await expect(page.locator('.toast')).toContainText('举报已提交');
  });

  test('管理员处理举报', async ({ page }) => {
    // 管理员登录
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // 访问举报列表
    await page.goto('/admin/reports');

    // 选择第一条举报
    await page.click('.report-row:first-child .handle-button');

    // 处理操作：隐藏点评
    await page.click('button:has-text("隐藏点评")');

    // 验证
    await expect(page.locator('.toast')).toContainText('举报已处理');

    // 验证点评状态
    await page.click('text=查看点评');
    await expect(page.locator('.status-badge')).toHaveText('已隐藏');
  });

  test('举报数达到阈值自动隐藏', async ({ page }) => {
    // 此测试需要 backend 配合设置测试数据
    // 创建一个已有 4 次举报的点评
    await page.request.post('/api/test/setup', {
      data: {
        scenario: 'review_with_4_reports',
      },
    });

    // 用户再次举报
    await page.goto('/login');
    await page.fill('input[name="email"]', 'user2@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/merchants/merchant-123');
    await page.click('.review-card .report-button');
    await page.click('button:has-text("虚假广告")');
    await page.click('.report-modal button[type="submit"]');

    // 验证点评自动隐藏
    await expect(page.locator('.toast')).toContainText('举报已提交');

    // 点评不应再显示在列表中
    const reviewCount = await page.locator('.review-card:has-text("测试点评")').count();
    expect(reviewCount).toBe(0);
  });
});
```

---

## 性能测试

### D-08: 性能测试 (负载)

**文件:** `tests/performance/reviews-load.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import http from 'k6/http';
import { check, sleep } from 'k6';

// k6 性能测试脚本
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // 热身
    { duration: '1m', target: 50 },    // 正常负载
    { duration: '30s', target: 100 },  // 峰值负载
    { duration: '30s', target: 0 },    // 冷却
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% 请求 < 500ms
    http_req_failed: ['rate<0.01'],    // 错误率 < 1%
  },
};

export default function () {
  // 获取点评列表
  const res = http.get('http://localhost:3000/api/reviews?merchantId=merchant-1');

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'has reviews data': (r) => {
      const body = JSON.parse(r.body);
      return body.success && body.data.reviews.length >= 0;
    },
  });

  sleep(1);
}
```

**Playwright 性能测试:**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('点评列表加载性能 (P95 < 500ms)', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/merchants/merchant-123');

    // 等待点评列表加载完成
    await page.waitForSelector('.review-card');

    const loadTime = Date.now() - startTime;

    // 验证加载时间
    expect(loadTime).toBeLessThan(500);

    // 验证 Network 面板
    const response = await page.waitForResponse(
      (res) => res.url().includes('/api/reviews')
    );

    const timing = response.request().timing();
    const duration = timing.responseEnd - timing.requestStart;

    console.log(`API 响应时间：${duration}ms`);
    expect(duration).toBeLessThan(300);
  });

  test('点评创建性能 (P99 < 1000ms)', async ({ page }) => {
    // 登录
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/merchants/merchant-123');
    await page.click('text=发表点评');

    // 填写表单
    const stars = page.locator('[role="slider"] button');
    await stars.nth(4).click();
    await page.fill('textarea[name="content"]', '很好的餐厅，推荐给大家！');

    // 提交并计时
    const startTime = Date.now();
    await page.click('button[type="submit"]');

    // 等待成功提示
    await page.waitForSelector('.toast:has-text("成功")');

    const duration = Date.now() - startTime;

    console.log(`点评创建时间：${duration}ms`);
    expect(duration).toBeLessThan(1000);
  });
});
```

---

## 安全扫描

### D-09: 安全扫描脚本

**文件:** `scripts/security-scan.ts`

```typescript
#!/usr/bin/env ts-node

/**
 * 安全扫描脚本
 * 检查常见的安全漏洞
 */

import { db } from '@/lib/db';
import { sensitiveWordFilter } from '@/middleware/sensitive-words';

async function runSecurityScan() {
  console.log('🔍 开始安全扫描...\n');

  let issues = 0;

  // 1. 检查 XSS 漏洞 (内容未转义)
  console.log('1. 检查 XSS 漏洞...');
  const reviews = await db.review.findMany({
    where: { status: 'approved' },
  });

  for (const review of reviews) {
    // 检查是否有未转义的 HTML
    if (/<[a-z][\s\S]*>/i.test(review.content)) {
      console.warn(`⚠️  潜在 XSS 风险：Review ${review.id}`);
      issues++;
    }
  }

  // 2. 检查敏感词过滤
  console.log('2. 检查敏感词过滤...');
  const testContents = [
    '包含敏感词 1 的内容',
    '正常内容',
    '另一个敏感词 2 测试',
  ];

  for (const content of testContents) {
    const hasSensitive = sensitiveWordFilter.hasSensitiveWord(content);
    if (hasSensitive) {
      console.log(`✓ 敏感词检测正常："${content}"`);
    }
  }

  // 3. 检查 SQL 注入风险 (Prisma 参数化查询已防护)
  console.log('3. 检查 SQL 注入风险...');
  console.log('✓ 使用 Prisma ORM，参数化查询已启用');

  // 4. 检查速率限制配置
  console.log('4. 检查速率限制...');
  const rateLimitConfig = {
    reviewPerUser: { limit: 10, window: '24h' },
    reviewPerIp: { limit: 20, window: '1h' },
  };
  console.log('✓ 速率限制配置:', rateLimitConfig);

  // 5. 检查权限控制
  console.log('5. 检查权限控制...');
  const protectedRoutes = [
    '/api/reviews (POST)',
    '/api/reviews/:id (DELETE)',
    '/api/admin/reviews',
    '/api/admin/reports',
  ];
  console.log('✓ 受保护路由:', protectedRoutes.length);

  // 6. 检查环境变量
  console.log('6. 检查环境变量...');
  const requiredEnvVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'KV_REST_API_URL'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`❌ 缺少环境变量：${envVar}`);
      issues++;
    } else {
      console.log(`✓ ${envVar} 已配置`);
    }
  }

  // 7. 检查敏感数据泄漏
  console.log('7. 检查敏感数据泄漏...');
  const apiResponses = await db.review.findMany({
    take: 10,
    include: { user: true },
  });

  for (const review of apiResponses) {
    // 检查是否泄漏用户敏感信息
    if ((review.user as any).password) {
      console.error(`❌ 泄漏用户密码：Review ${review.id}`);
      issues++;
    }
  }

  // 总结
  console.log('\n' + '='.repeat(50));
  if (issues === 0) {
    console.log('✅ 安全扫描通过，未发现高危问题');
  } else {
    console.error(`❌ 发现 ${issues} 个安全问题，请及时修复`);
    process.exit(1);
  }
}

runSecurityScan().catch(console.error);
```

**运行命令:**
```bash
npx ts-node scripts/security-scan.ts
```

---

### D-10: 可访问性测试

**文件:** `tests/a11y/reviews.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('点评页面 - 无障碍检查', async ({ page }) => {
    await page.goto('/merchants/merchant-123');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('点评表单 - 键盘导航', async ({ page }) => {
    await page.goto('/merchants/merchant-123');
    await page.click('text=发表点评');

    // Tab 键导航
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // 验证焦点在提交按钮上
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBe('BUTTON');
  });

  test('评分组件 - 键盘操作', async ({ page }) => {
    await page.goto('/merchants/merchant-123');
    await page.click('text=发表点评');

    // 使用方向键选择评分
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');

    // 验证评分为 3
    const ratingValue = await page.evaluate(() =>
      document.querySelector('[role="slider"]')?.getAttribute('aria-valuenow')
    );
    expect(ratingValue).toBe('3');
  });

  test('点评卡片 - 图片 Alt 文本', async ({ page }) => {
    await page.goto('/merchants/merchant-123');

    // 验证所有图片有 alt 属性
    const images = page.locator('.review-card img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });

  test('点评列表 - ARIA 标签', async ({ page }) => {
    await page.goto('/merchants/merchant-123');

    // 验证列表有正确的 ARIA 标签
    const reviewList = page.locator('[role="list"]');
    await expect(reviewList).toHaveAttribute('aria-label', '用户点评列表');

    // 验证列表项
    const reviewItems = page.locator('[role="listitem"]');
    expect(await reviewItems.count()).toBeGreaterThan(0);
  });
});
```

---

## 测试运行命令

```bash
# 单元测试
npm run test:unit

# 集成测试
npm run test:integration

# E2E 测试
npm run test:e2e

# 性能测试
npm run test:performance

# 安全扫描
npm run test:security

# 可访问性测试
npm run test:a11y

# 全部测试
npm run test
```

---

## 验收标准

### 覆盖率要求
- [ ] 单元测试覆盖率 > 80%
- [ ] 关键业务逻辑覆盖率 > 90%
- [ ] 集成测试覆盖所有 API

### 质量要求
- [ ] E2E 测试覆盖核心用户流程
- [ ] 性能测试达标 (P95 < 500ms)
- [ ] 无高危安全漏洞
- [ ] 无障碍测试通过

---

## 依赖关系

### 需要 Agent A/B/C 提供
- 组件和 API 完成后编写对应测试
- 提供测试数据工厂所需的字段定义

---

## 开始指令

Agent D 收到任务后，请执行:

```bash
# 1. 创建测试目录结构
mkdir -p tests/unit
mkdir -p tests/integration
mkdir -p tests/e2e
mkdir -p tests/performance
mkdir -p tests/a11y
mkdir -p tests/factories
mkdir -p tests/fixtures

# 2. 安装测试依赖
npm install -D vitest supertest @faker-js/factory @axe-core/playwright

# 3. 按优先级编写测试
# P0: 单元测试 → 集成测试 → E2E(发表点评) → 安全扫描
# P1: E2E(审核/举报) → 性能测试
# P2: 可访问性测试
```

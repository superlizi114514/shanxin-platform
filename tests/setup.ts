import { vi } from 'vitest';

// 模拟环境变量
process.env.DATABASE_URL = 'file:./test.db';
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-only';
process.env.NEXTAUTH_URL = 'http://localhost:3017';

// 全局 Mock
vi.mock('@/lib/db', () => ({
  db: {
    review: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    reviewReply: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    reviewReport: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    reviewAuditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    reviewHelpful: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    merchant: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// 模拟 auth
vi.mock('next-auth', () => ({
  auth: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('@/auth', () => ({
  auth: vi.fn(() => Promise.resolve(null)),
}));

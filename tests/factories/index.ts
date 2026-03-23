import { faker } from '@faker-js/faker';

/**
 * 测试数据工厂 - 创建模拟数据
 */

export interface MockUser {
  id: string;
  email: string;
  name: string;
  role?: string;
  isVerified?: boolean;
  createdAt?: Date;
}

export interface MockReview {
  id: string;
  userId: string;
  merchantId: string;
  content: string;
  rating: number;
  status: 'pending' | 'approved' | 'rejected' | 'hidden';
  images?: string[];
  helpfulCount?: number;
  reportCount?: number;
  createdAt?: Date;
}

export interface MockMerchant {
  id: string;
  name: string;
  address: string;
  category: string;
}

export const userFactory = {
  create: (overrides: Partial<MockUser> = {}): MockUser => ({
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    role: 'user',
    isVerified: false,
    createdAt: new Date(),
    ...overrides,
  }),

  createAdmin: (overrides: Partial<MockUser> = {}): MockUser => ({
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    role: 'admin',
    isVerified: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    ...overrides,
  }),

  createVerified: (overrides: Partial<MockUser> = {}): MockUser => ({
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    role: 'user',
    isVerified: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    ...overrides,
  }),

  createNewUser: (overrides: Partial<MockUser> = {}): MockUser => ({
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    role: 'user',
    isVerified: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 天前
    ...overrides,
  }),
};

export const reviewFactory = {
  create: (overrides: Partial<MockReview> = {}): MockReview => ({
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    merchantId: faker.string.uuid(),
    content: faker.lorem.paragraph({ min: 3, max: 10 }),
    rating: faker.number.int({ min: 1, max: 5 }),
    status: 'approved',
    images: [],
    helpfulCount: 0,
    reportCount: 0,
    createdAt: new Date(),
    ...overrides,
  }),

  createPending: (overrides: Partial<MockReview> = {}): MockReview => ({
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    merchantId: faker.string.uuid(),
    content: faker.lorem.paragraph(),
    rating: faker.number.int({ min: 1, max: 5 }),
    status: 'pending',
    ...overrides,
  }),

  createWithSensitiveWords: (overrides: Partial<MockReview> = {}): MockReview => ({
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    merchantId: faker.string.uuid(),
    content: '这个餐厅太差了，简直是垃圾，骗子的店',
    rating: 1,
    status: 'pending',
    ...overrides,
  }),

  createReported: (overrides: Partial<MockReview> = {}): MockReview => ({
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    merchantId: faker.string.uuid(),
    content: faker.lorem.paragraph(),
    rating: faker.number.int({ min: 1, max: 5 }),
    status: 'approved',
    reportCount: 5,
    ...overrides,
  }),
};

export const merchantFactory = {
  create: (overrides: Partial<MockMerchant> = {}): MockMerchant => ({
    id: faker.string.uuid(),
    name: faker.company.name(),
    address: faker.location.streetAddress(),
    category: faker.helpers.arrayElement(['餐厅', '咖啡厅', '书店', '超市', '健身房']),
    ...overrides,
  }),
};

/**
 * 辅助函数：生成认证用户
 */
export function createTestUser(overrides: Partial<MockUser> = {}) {
  return userFactory.create(overrides);
}

/**
 * 辅助函数：生成测试 session
 */
export function createTestSession(user: MockUser) {
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    },
    token: faker.string.alphanumeric(32),
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
}

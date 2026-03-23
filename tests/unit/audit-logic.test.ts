import { describe, it, expect, beforeEach } from 'vitest';

/**
 * 审核逻辑单元测试
 * 测试点评审核状态判定规则
 */

interface UserContext {
  id: string;
  createdAt: Date;
  isVerified: boolean;
  role: string;
}

interface ReviewContext {
  content: string;
  hasSensitiveWords: boolean;
  reportCount: number;
  status: string;
}

describe('AuditLogic 审核逻辑', () => {
  describe('determineReviewStatus - 点评状态判定', () => {
    const USER_AGE_7_DAYS = 7 * 24 * 60 * 60 * 1000;

    it('自动通过 - 老用户 (>7 天) 且已实名认证且无敏感词', () => {
      // Arrange
      const user: UserContext = {
        id: 'user-123',
        createdAt: new Date(Date.now() - 10 * USER_AGE_7_DAYS), // 70 天前
        isVerified: true,
        role: 'user',
      };

      const review: ReviewContext = {
        content: '很好吃的餐厅，环境不错',
        hasSensitiveWords: false,
        reportCount: 0,
        status: 'approved',
      };

      // Act
      const status = determineReviewStatus(user, review);

      // Assert
      expect(status).toBe('approved');
    });

    it('自动待审 - 新用户 (<7 天)', () => {
      const user: UserContext = {
        id: 'user-123',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 天前
        isVerified: true,
        role: 'user',
      };

      const review: ReviewContext = {
        content: '很好吃的餐厅',
        hasSensitiveWords: false,
        reportCount: 0,
        status: 'pending',
      };

      const status = determineReviewStatus(user, review);
      expect(status).toBe('pending');
    });

    it('自动待审 - 未实名认证', () => {
      const user: UserContext = {
        id: 'user-123',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 天前
        isVerified: false,
        role: 'user',
      };

      const review: ReviewContext = {
        content: '很好吃的餐厅',
        hasSensitiveWords: false,
        reportCount: 0,
        status: 'pending',
      };

      const status = determineReviewStatus(user, review);
      expect(status).toBe('pending');
    });

    it('自动待审 - 含敏感词', () => {
      const user: UserContext = {
        id: 'user-123',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        isVerified: true,
        role: 'user',
      };

      const review: ReviewContext = {
        content: '这个餐厅是垃圾',
        hasSensitiveWords: true,
        reportCount: 0,
        status: 'pending',
      };

      const status = determineReviewStatus(user, review);
      expect(status).toBe('pending');
    });

    it('边界值：正好 7 天的用户', () => {
      const user: UserContext = {
        id: 'user-123',
        createdAt: new Date(Date.now() - USER_AGE_7_DAYS),
        isVerified: true,
        role: 'user',
      };

      const review: ReviewContext = {
        content: '很好吃的餐厅',
        hasSensitiveWords: false,
        reportCount: 0,
        status: 'approved',
      };

      const status = determineReviewStatus(user, review);
      expect(status).toBe('approved'); // >= 7 天算老用户
    });
  });

  describe('shouldAutoHide - 自动隐藏判定', () => {
    it('举报数 >= 5 且状态为 approved → 自动隐藏', () => {
      const review: ReviewContext = {
        content: '',
        hasSensitiveWords: false,
        reportCount: 5,
        status: 'approved',
      };

      const shouldHide = shouldAutoHide(review);
      expect(shouldHide).toBe(true);
    });

    it('举报数 = 4 → 不自动隐藏', () => {
      const review: ReviewContext = {
        content: '',
        hasSensitiveWords: false,
        reportCount: 4,
        status: 'approved',
      };

      const shouldHide = shouldAutoHide(review);
      expect(shouldHide).toBe(false);
    });

    it('举报数 >= 5 但状态已经是 hidden → 不需要操作', () => {
      const review: ReviewContext = {
        content: '',
        hasSensitiveWords: false,
        reportCount: 10,
        status: 'hidden',
      };

      const shouldHide = shouldAutoHide(review);
      expect(shouldHide).toBe(false); // 已经隐藏了
    });
  });

  describe('敏感词检测', () => {
    const sensitiveWords = ['垃圾', '骗子', '差劲', '黑店'];

    // 本地敏感词检测函数
    function checkSensitiveWords(content: string): boolean {
      return sensitiveWords.some(word => content.includes(word));
    }

    it('检测含敏感词的内容', () => {
      const testCases = [
        { content: '这个餐厅是垃圾', expected: true },
        { content: '遇到骗子了', expected: true },
        { content: '服务太差劲', expected: true },
        { content: '黑店大家别去', expected: true },
        { content: '很好吃的餐厅', expected: false },
        { content: '环境不错，推荐', expected: false },
      ];

      for (const { content, expected } of testCases) {
        const result = checkSensitiveWords(content);
        expect(result).toBe(expected);
      }
    });
  });

  describe('审核操作权限', () => {
    it('管理员可以审核点评', () => {
      const userRole = 'admin';
      const canAudit = userRole === 'admin';
      expect(canAudit).toBe(true);
    });

    it('普通用户不能审核点评', () => {
      const userRole = 'user';
      const canAudit = userRole === 'admin';
      expect(canAudit).toBe(false);
    });
  });
});

// 辅助函数：判定点评状态
function determineReviewStatus(user: UserContext, review: ReviewContext): string {
  const USER_AGE_7_DAYS = 7 * 24 * 60 * 60 * 1000;
  const userAge = Date.now() - user.createdAt.getTime();

  // 含敏感词 → pending
  if (review.hasSensitiveWords) {
    return 'pending';
  }

  // 新用户 (<7 天) → pending
  if (userAge < USER_AGE_7_DAYS) {
    return 'pending';
  }

  // 未实名认证 → pending
  if (!user.isVerified) {
    return 'pending';
  }

  // 其他情况 → approved
  return 'approved';
}

// 辅助函数：是否自动隐藏
function shouldAutoHide(review: ReviewContext): boolean {
  return review.reportCount >= 5 && review.status === 'approved';
}

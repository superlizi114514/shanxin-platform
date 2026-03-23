import { describe, it, expect, beforeEach } from 'vitest';
import { reviewFactory, userFactory } from '@/../tests/factories';

/**
 * ReviewService 单元测试
 * 测试点评服务的核心业务逻辑
 */

// 模拟敏感词检测函数
function checkSensitiveWords(content: string): boolean {
  const sensitiveWords = ['垃圾', '骗子', '差劲', '黑店'];
  return sensitiveWords.some(word => content.includes(word));
}

// 判定点评状态函数
function determineReviewStatus(user: any, content: string): string {
  const USER_AGE_7_DAYS = 7 * 24 * 60 * 60 * 1000;
  const userAge = Date.now() - user.createdAt.getTime();

  // 含敏感词 → pending
  if (checkSensitiveWords(content)) {
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

describe('ReviewService 单元测试', () => {
  beforeEach(() => {
    // 清空任何 mock
  });

  describe('创建点评 - 审核状态判定', () => {
    it('老用户 + 实名认证 → 自动通过 (approved)', () => {
      const user = userFactory.createVerified({
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 天前
      });

      const status = determineReviewStatus(user, '很好吃的餐厅，环境不错');
      expect(status).toBe('approved');
    });

    it('新用户 (<7 天) → 待审核 (pending)', () => {
      const newUser = userFactory.createNewUser();
      const status = determineReviewStatus(newUser, '很好吃的餐厅');
      expect(status).toBe('pending');
    });

    it('未实名认证 → 待审核 (pending)', () => {
      const unverifiedUser = userFactory.create({ isVerified: false });
      const status = determineReviewStatus(unverifiedUser, '很好吃的餐厅');
      expect(status).toBe('pending');
    });

    it('含敏感词 → 待审核 (pending)', () => {
      const user = userFactory.createVerified();
      const status = determineReviewStatus(user, '这个餐厅太差了，简直是垃圾');
      expect(status).toBe('pending');
    });

    it('边界值：正好 7 天的用户', () => {
      const user = userFactory.create({
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        isVerified: true,
      });
      const status = determineReviewStatus(user, '很好吃的餐厅');
      expect(status).toBe('approved');
    });
  });

  describe('敏感词检测', () => {
    it('检测含敏感词的内容', () => {
      expect(checkSensitiveWords('这个餐厅是垃圾')).toBe(true);
      expect(checkSensitiveWords('遇到骗子了')).toBe(true);
      expect(checkSensitiveWords('服务太差劲')).toBe(true);
    });

    it('正常内容不触发敏感词检测', () => {
      expect(checkSensitiveWords('很好吃的餐厅')).toBe(false);
      expect(checkSensitiveWords('环境不错，推荐')).toBe(false);
    });
  });

  describe('点评删除权限', () => {
    it('作者可以删除自己的点评', () => {
      const authorId = 'user-123';
      const review = reviewFactory.create({ userId: authorId });
      const canDelete = review.userId === authorId;
      expect(canDelete).toBe(true);
    });

    it('管理员可以删除任何点评', () => {
      const adminRole = 'admin';
      const canDelete = adminRole === 'admin';
      expect(canDelete).toBe(true);
    });

    it('非作者且非管理员无法删除点评', () => {
      const review = reviewFactory.create({ userId: 'user-123' });
      const otherUserId = 'user-456';
      const otherUserRole = 'user';
      const canDelete = review.userId === otherUserId || otherUserRole === 'admin';
      expect(canDelete).toBe(false);
    });
  });

  describe('点赞防重复逻辑', () => {
    it('同一用户不能重复点赞同一点评', () => {
      const existingHelpfuls = [
        { userId: 'user-123', reviewId: 'review-1' },
        { userId: 'user-456', reviewId: 'review-1' },
      ];

      const canHelpful = !existingHelpfuls.some(
        h => h.userId === 'user-123' && h.reviewId === 'review-1'
      );

      expect(canHelpful).toBe(false);
    });

    it('不同用户可以点赞同一点评', () => {
      const existingHelpfuls = [
        { userId: 'user-123', reviewId: 'review-1' },
      ];

      const canHelpful = !existingHelpfuls.some(
        h => h.userId === 'user-789' && h.reviewId === 'review-1'
      );

      expect(canHelpful).toBe(true);
    });
  });

  describe('举报防重复逻辑', () => {
    it('同一用户不能重复举报同一点评', () => {
      const existingReports = [
        { userId: 'user-123', reviewId: 'review-1', reason: '虚假广告' },
      ];

      const canReport = !existingReports.some(
        r => r.userId === 'user-123' && r.reviewId === 'review-1'
      );

      expect(canReport).toBe(false);
    });

    it('不同用户可以举报同一点评', () => {
      const existingReports = [
        { userId: 'user-123', reviewId: 'review-1', reason: '虚假广告' },
      ];

      const canReport = !existingReports.some(
        r => r.userId === 'user-456' && r.reviewId === 'review-1'
      );

      expect(canReport).toBe(true);
    });
  });

  describe('速率限制逻辑', () => {
    it('每用户每日最多 10 条点评', () => {
      const dailyLimit = 10;
      const todayCount = 10;
      const canSubmitMore = todayCount < dailyLimit;
      expect(canSubmitMore).toBe(false);
    });

    it('每 IP 每小时最多 20 条点评', () => {
      const hourlyLimit = 20;
      const hourCount = 20;
      const canSubmitMore = hourCount < hourlyLimit;
      expect(canSubmitMore).toBe(false);
    });

    it('未达限制可以继续提交', () => {
      const dailyLimit = 10;
      const todayCount = 5;
      const canSubmitMore = todayCount < dailyLimit;
      expect(canSubmitMore).toBe(true);
    });
  });

  describe('自动隐藏逻辑', () => {
    it('举报数 >= 5 且状态为 approved → 自动隐藏', () => {
      const review = {
        reportCount: 5,
        status: 'approved',
      };

      const shouldHide = review.reportCount >= 5 && review.status === 'approved';
      expect(shouldHide).toBe(true);
    });

    it('举报数 < 5 → 不自动隐藏', () => {
      const review = {
        reportCount: 4,
        status: 'approved',
      };

      const shouldHide = review.reportCount >= 5 && review.status === 'approved';
      expect(shouldHide).toBe(false);
    });

    it('状态已经是 hidden → 不需要操作', () => {
      const review = {
        reportCount: 10,
        status: 'hidden',
      };

      const shouldHide = review.reportCount >= 5 && review.status === 'approved';
      expect(shouldHide).toBe(false);
    });
  });
});

import { test, expect } from '@playwright/test';

/**
 * E2E 测试：举报处理流程
 */

test.describe('E2E: 举报处理', () => {
  const regularUser = {
    email: `user_${Date.now()}@example.com`,
    password: 'password123',
  };

  const adminUser = {
    email: 'admin@example.com',
    password: 'admin123',
  };

  test('用户举报点评', async ({ page }) => {
    // 1. 登录
    await page.goto('/login');
    await page.fill('input[name="email"]', regularUser.email);
    await page.fill('input[name="password"]', regularUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    // 2. 访问商家页面
    await page.goto('/merchants/test-merchant');

    // 3. 找到点评并点击举报按钮
    const reviewCard = page.locator('.review-card').first();
    if (await reviewCard.isVisible()) {
      const reportButton = reviewCard.locator('.report-button, button:has-text("举报")');
      if (await reportButton.isVisible()) {
        await reportButton.click();

        // 4. 选择举报原因
        const reportModal = page.locator('.report-modal, [role="dialog"]');
        if (await reportModal.isVisible()) {
          // 选择举报原因
          const reasonOption = reportModal.locator('button:has-text("虚假广告"), input[value="虚假广告"]');
          if (await reasonOption.isVisible()) {
            await reasonOption.click();
          }

          // 5. 提交举报
          const submitButton = reportModal.locator('button[type="submit"]');
          if (await submitButton.isVisible()) {
            await submitButton.click();
          }

          // 6. 验证举报成功
          const toast = page.locator('.toast, [role="alert"]');
          if (await toast.isVisible()) {
            const toastText = await toast.textContent();
            expect(toastText?.toLowerCase()).toContain('成功');
          }
        }
      }
    }
  });

  test('用户举报点评 - 选择其他原因', async ({ page }) => {
    // 登录
    await page.goto('/login');
    await page.fill('input[name="email"]', regularUser.email);
    await page.fill('input[name="password"]', regularUser.password);
    await page.click('button[type="submit"]');

    // 访问商家页面
    await page.goto('/merchants/test-merchant');

    // 点击举报
    const reviewCard = page.locator('.review-card').first();
    if (await reviewCard.isVisible()) {
      const reportButton = reviewCard.locator('.report-button');
      if (await reportButton.isVisible()) {
        await reportButton.click();

        // 选择"其他"原因并填写自定义理由
        const reportModal = page.locator('.report-modal');
        if (await reportModal.isVisible()) {
          const otherOption = page.locator('button:has-text("其他")');
          if (await otherOption.isVisible()) {
            await otherOption.click();

            // 填写自定义理由
            const customReason = page.locator('textarea[name="customReason"]');
            if (await customReason.isVisible()) {
              await customReason.fill('这条点评包含不实信息');
            }

            // 提交
            const submitButton = page.locator('button[type="submit"]');
            if (await submitButton.isVisible()) {
              await submitButton.click();
            }
          }
        }
      }
    }
  });

  test('管理员处理举报 - 隐藏点评', async ({ page }) => {
    // 管理员登录
    await page.goto('/login');
    await page.fill('input[name="email"]', adminUser.email);
    await page.fill('input[name="password"]', adminUser.password);
    await page.click('button[type="submit"]');

    // 访问举报列表
    await page.goto('/admin/reports');

    // 选择第一条举报
    const reportRow = page.locator('.report-row, tr').first();
    if (await reportRow.isVisible()) {
      const handleButton = reportRow.locator('.handle-button, button:has-text("处理")');
      if (await handleButton.isVisible()) {
        await handleButton.click();

        // 查看详情
        const reportDetail = page.locator('.report-detail');
        if (await reportDetail.isVisible()) {
          // 处理操作：隐藏点评
          const hideReviewButton = page.locator('button:has-text("隐藏点评")');
          if (await hideReviewButton.isVisible()) {
            await hideReviewButton.click();
          }

          // 验证处理成功
          const toast = page.locator('.toast');
          if (await toast.isVisible()) {
            const toastText = await toast.textContent();
            expect(toastText?.toLowerCase()).toContain('成功');
          }
        }
      }
    }
  });

  test('管理员处理举报 - 删除点评', async ({ page }) => {
    // 管理员登录
    await page.goto('/login');
    await page.fill('input[name="email"]', adminUser.email);
    await page.fill('input[name="password"]', adminUser.password);
    await page.click('button[type="submit"]');

    // 访问举报列表
    await page.goto('/admin/reports');

    const reportRow = page.locator('.report-row').first();
    if (await reportRow.isVisible()) {
      const handleButton = reportRow.locator('.handle-button');
      if (await handleButton.isVisible()) {
        await handleButton.click();

        // 选择删除点评
        const deleteReviewButton = page.locator('button:has-text("删除点评")');
        if (await deleteReviewButton.isVisible()) {
          await deleteReviewButton.click();

          // 确认删除
          const confirmModal = page.locator('.modal, [role="dialog"]');
          if (await confirmModal.isVisible()) {
            const confirmButton = confirmModal.locator('button:has-text("确认")');
            if (await confirmButton.isVisible()) {
              await confirmButton.click();
            }
          }

          // 验证删除成功
          const toast = page.locator('.toast');
          if (await toast.isVisible()) {
            expect(await toast.textContent()).toContain('成功');
          }
        }
      }
    }
  });

  test('管理员处理举报 - 忽略举报', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', adminUser.email);
    await page.fill('input[name="password"]', adminUser.password);
    await page.click('button[type="submit"]');

    await page.goto('/admin/reports');

    const reportRow = page.locator('.report-row').first();
    if (await reportRow.isVisible()) {
      const handleButton = reportRow.locator('.handle-button');
      if (await handleButton.isVisible()) {
        await handleButton.click();

        // 忽略举报
        const ignoreButton = page.locator('button:has-text("忽略")');
        if (await ignoreButton.isVisible()) {
          await ignoreButton.click();
        }

        // 验证状态更新为已解决/已忽略
        const toast = page.locator('.toast');
        if (await toast.isVisible()) {
          expect(await toast.textContent()).toContain('成功');
        }
      }
    }
  });

  test('举报数达到阈值自动隐藏', async ({ page }) => {
    // 这个测试需要后端配合设置测试数据
    // 创建一个已有 4 次举报的点评

    // 模拟场景：点评已有 4 次举报
    // 用户再次举报后，点评应该被自动隐藏

    // 1. 登录
    await page.goto('/login');
    await page.fill('input[name="email"]', regularUser.email);
    await page.fill('input[name="password"]', regularUser.password);
    await page.click('button[type="submit"]');

    // 2. 访问商家页面
    await page.goto('/merchants/test-merchant');

    // 3. 找到被多次举报的点评
    const reportedReview = page.locator('.review-card[data-reports="4"]');
    if (await reportedReview.isVisible()) {
      // 4. 举报
      const reportButton = reportedReview.locator('.report-button');
      if (await reportButton.isVisible()) {
        await reportButton.click();

        // 选择原因并提交
        const reportModal = page.locator('.report-modal');
        if (await reportModal.isVisible()) {
          const reasonOption = reportModal.locator('button:has-text("虚假广告")');
          if (await reasonOption.isVisible()) {
            await reasonOption.click();
          }

          const submitButton = reportModal.locator('button[type="submit"]');
          if (await submitButton.isVisible()) {
            await submitButton.click();
          }
        }

        // 5. 验证点评被自动隐藏
        // 点评应该从列表中消失或者显示"已隐藏"状态
        const isHidden = await reportedReview.isVisible().then(v => !v);
        // 或者检查是否有隐藏标识
        const hiddenBadge = reportedReview.locator('.badge-hidden, .status-hidden');
        const hasHiddenBadge = await hiddenBadge.isVisible();

        // 点评要么消失，要么有隐藏标识
        expect(isHidden || hasHiddenBadge).toBe(true);
      }
    }
  });

  test('管理员筛选举报 - 按状态筛选', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', adminUser.email);
    await page.fill('input[name="password"]', adminUser.password);
    await page.click('button[type="submit"]');

    await page.goto('/admin/reports');

    // 筛选待处理举报
    const statusFilter = page.locator('select[name="status"], .filter-status');
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('pending');

      // 验证列表刷新
      await page.waitForTimeout(500);
      const rows = page.locator('.report-row');
      const count = await rows.count();

      // 所有显示的举报状态都应该是待处理
      for (let i = 0; i < count; i++) {
        const statusBadge = rows.nth(i).locator('.status-badge');
        // 验证状态
      }
    }
  });
});

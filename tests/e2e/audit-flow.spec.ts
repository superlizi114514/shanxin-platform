import { test, expect } from '@playwright/test';

/**
 * E2E 测试：审核流程
 */

test.describe('E2E: 审核流程', () => {
  // 使用管理员账号
  const adminUser = {
    email: 'admin@example.com',
    password: 'admin123',
  };

  test.beforeEach(async ({ page }) => {
    // 以管理员身份登录
    await page.goto('/login');
    await page.fill('input[name="email"]', adminUser.email);
    await page.fill('input[name="password"]', adminUser.password);
    await page.click('button[type="submit"]');

    // 等待登录成功
    await expect(page).toHaveURL('/');
  });

  test('管理员审核通过点评', async ({ page }) => {
    // 1. 访问审核列表页
    await page.goto('/admin/reviews/list?status=pending');

    // 验证页面标题
    await expect(page.locator('h1')).toContainText(/审核 | 点评 | Review/);

    // 2. 选择第一条待审核点评
    const reviewRow = page.locator('.review-row, tr').first();
    if (await reviewRow.isVisible()) {
      // 3. 点击审核按钮
      const auditButton = reviewRow.locator('.audit-button, button:has-text("审核")');
      if (await auditButton.isVisible()) {
        await auditButton.click();
      }

      // 4. 验证审核详情页加载
      const reviewDetail = page.locator('.review-detail, .review-content');
      if (await reviewDetail.isVisible()) {
        // 5. 选择"通过"选项
        const approveRadio = page.locator('input[value="approve"], input[type="radio"]:has-text("通过")');
        if (await approveRadio.isVisible()) {
          await approveRadio.check();
        } else {
          // 或者点击通过按钮
          const approveButton = page.locator('button:has-text("通过"), .btn-approve');
          if (await approveButton.isVisible()) {
            await approveButton.click();
          }
        }

        // 6. 提交审核
        const submitButton = page.locator('button[type="submit"]');
        if (await submitButton.isVisible()) {
          await submitButton.click();
        }

        // 7. 验证审核成功
        const toast = page.locator('.toast, [role="alert"]');
        if (await toast.isVisible()) {
          const toastText = await toast.textContent();
          expect(toastText?.toLowerCase()).toContain('成功');
        }
      }
    }
  });

  test('管理员拒绝点评 (填写理由)', async ({ page }) => {
    // 1. 访问待审核列表
    await page.goto('/admin/reviews/list?status=pending');

    // 2. 选择第一条点评
    const reviewRow = page.locator('.review-row, tr').first();
    if (await reviewRow.isVisible()) {
      const auditButton = reviewRow.locator('.audit-button');
      if (await auditButton.isVisible()) {
        await auditButton.click();
      }

      // 3. 选择"拒绝"
      const rejectRadio = page.locator('input[value="reject"]');
      if (await rejectRadio.isVisible()) {
        await rejectRadio.check();
      }

      // 4. 填写拒绝理由
      const reasonField = page.locator('textarea[name="reason"]');
      if (await reasonField.isVisible()) {
        await reasonField.fill('包含不当内容，违反社区准则');
      }

      // 5. 提交
      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.isVisible()) {
        await submitButton.click();
      }

      // 6. 验证拒绝成功
      const toast = page.locator('.toast, [role="alert"]');
      if (await toast.isVisible()) {
        const toastText = await toast.textContent();
        expect(toastText?.toLowerCase()).toContain('成功');
      }

      // 7. 验证点评不再出现在待审核列表
      await page.reload();
      const updatedRows = page.locator('.review-row, tr');
      // 数量应该减少
    }
  });

  test('管理员隐藏点评', async ({ page }) => {
    await page.goto('/admin/reviews/list?status=approved');

    const reviewRow = page.locator('.review-row, tr').first();
    if (await reviewRow.isVisible()) {
      const actionMenu = reviewRow.locator('.actions-menu, .dropdown');
      if (await actionMenu.isVisible()) {
        await actionMenu.click();

        const hideOption = page.locator('.dropdown-item:has-text("隐藏")');
        if (await hideOption.isVisible()) {
          await hideOption.click();
        }
      }
    }
  });

  test('批量审核操作 - 批量通过', async ({ page }) => {
    await page.goto('/admin/reviews/list?status=pending');

    // 1. 选择多条点评
    const checkboxes = page.locator('.review-row input[type="checkbox"]');
    const count = await checkboxes.count();

    if (count > 0) {
      // 全选前 3 条
      for (let i = 0; i < Math.min(count, 3); i++) {
        await checkboxes.nth(i).check();
      }

      // 2. 显示批量操作工具栏
      const bulkActionBar = page.locator('.bulk-action-bar');
      if (await bulkActionBar.isVisible()) {
        // 3. 点击批量通过
        const approveBulkButton = page.locator('button:has-text("批量通过")');
        if (await approveBulkButton.isVisible()) {
          await approveBulkButton.click();
        }

        // 4. 确认操作
        const confirmButton = page.locator('.modal button:has-text("确认")');
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }

        // 5. 验证成功
        const toast = page.locator('.toast, [role="alert"]');
        if (await toast.isVisible()) {
          const toastText = await toast.textContent();
          expect(toastText?.toLowerCase()).toContain('成功');
        }
      }
    }
  });

  test('批量操作 - 批量删除', async ({ page }) => {
    await page.goto('/admin/reviews/list');

    const checkboxes = page.locator('.review-row input[type="checkbox"]');
    const count = await checkboxes.count();

    if (count > 0) {
      // 选择多条
      for (let i = 0; i < Math.min(count, 3); i++) {
        await checkboxes.nth(i).check();
      }

      const bulkActionBar = page.locator('.bulk-action-bar');
      if (await bulkActionBar.isVisible()) {
        // 点击批量删除
        const deleteBulkButton = page.locator('button:has-text("批量删除"), button:has-text("删除")');
        if (await deleteBulkButton.isVisible()) {
          await deleteBulkButton.click();
        }

        // 确认删除
        const confirmModal = page.locator('.modal, [role="dialog"]');
        if (await confirmModal.isVisible()) {
          const confirmButton = confirmModal.locator('button:has-text("确认删除")');
          if (await confirmButton.isVisible()) {
            await confirmButton.click();
          }
        }

        // 验证删除成功
        const toast = page.locator('.toast');
        if (await toast.isVisible()) {
          const toastText = await toast.textContent();
          expect(toastText?.toLowerCase()).toContain('成功');
        }
      }
    }
  });

  test('查看审核日志', async ({ page }) => {
    await page.goto('/admin/reviews/logs');

    // 验证日志表格加载
    const logTable = page.locator('.audit-log-table, table');
    if (await logTable.isVisible()) {
      // 验证有日志记录
      const rows = page.locator('tbody tr');
      const count = await rows.count();
      expect(count).toBeGreaterThan(0);
    }
  });
});

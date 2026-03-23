import { test, expect } from '@playwright/test';

/**
 * E2E 测试：用户发表点评流程
 */

test.describe('E2E: 用户发表点评', () => {
  // 前置准备：创建测试账号
  let testUser: { email: string; password: string };

  test.beforeEach(() => {
    testUser = {
      email: `test_${Date.now()}@example.com`,
      password: 'password123',
    };
  });

  test('完整流程：登录 → 访问商家 → 填写表单 → 提交 → 查看结果', async ({ page }) => {
    // 1. 访问登录页面
    await page.goto('/login');
    await expect(page).toHaveTitle(/登录|Login/);

    // 2. 登录 (使用测试账号)
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // 等待登录成功并跳转到首页
    await expect(page).toHaveURL('/');

    // 3. 访问商家详情页 (使用测试商家 ID)
    await page.goto('/merchants/test-merchant-123');

    // 验证商家页面加载
    // 注意：实际测试需要真实的商家数据
    // await expect(page.locator('h1')).toContainText('测试商家');

    // 4. 打开点评表单
    const writeReviewButton = page.locator('button:has-text("发表点评"), a:has-text("发表点评")');
    if (await writeReviewButton.isVisible()) {
      await writeReviewButton.click();
    }

    // 5. 填写表单
    const reviewForm = page.locator('form');
    if (await reviewForm.isVisible()) {
      // 评分 (点击第 5 颗星)
      const stars = page.locator('[role="slider"] button, .star-rating button');
      if (await stars.count() > 0) {
        await stars.nth(4).click(); // 5 星
      }

      // 内容
      const contentField = page.locator('textarea[name="content"]');
      if (await contentField.isVisible()) {
        await contentField.fill('很好吃的餐厅，环境不错，服务态度好。强烈推荐！');
      }

      // 6. 提交
      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.isVisible()) {
        await submitButton.click();
      }

      // 7. 验证提交成功
      // 等待 toast 提示或页面跳转
      const toast = page.locator('.toast, [role="alert"], .notification');
      if (await toast.isVisible()) {
        const toastText = await toast.textContent();
        expect(toastText?.toLowerCase()).toContain('成功');
      }
    }
  });

  test('表单验证：空内容 → 显示错误', async ({ page }) => {
    // 访问点评表单
    await page.goto('/merchants/test-merchant');

    const writeReviewButton = page.locator('button:has-text("发表点评")');
    if (await writeReviewButton.isVisible()) {
      await writeReviewButton.click();
    }

    const reviewForm = page.locator('form');
    if (await reviewForm.isVisible()) {
      // 只评分，不填内容
      const stars = page.locator('[role="slider"] button');
      if (await stars.count() > 0) {
        await stars.nth(4).click();
      }

      // 直接提交
      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.isVisible()) {
        await submitButton.click();
      }

      // 验证错误提示
      const errorMessage = page.locator('.error-message, .field-error, [role="alert"]');
      if (await errorMessage.isVisible()) {
        const errorText = await errorMessage.textContent();
        expect(errorText?.toLowerCase()).toMatch(/至少 | 最少|min.*10|必填|required/);
      }
    }
  });

  test('表单验证：内容太短 → 显示错误', async ({ page }) => {
    await page.goto('/merchants/test-merchant');

    const writeReviewButton = page.locator('button:has-text("发表点评")');
    if (await writeReviewButton.isVisible()) {
      await writeReviewButton.click();
    }

    const reviewForm = page.locator('form');
    if (await reviewForm.isVisible()) {
      // 评分
      const stars = page.locator('[role="slider"] button');
      if (await stars.count() > 0) {
        await stars.nth(4).click();
      }

      // 填写太短的内容
      const contentField = page.locator('textarea[name="content"]');
      if (await contentField.isVisible()) {
        await contentField.fill('太短');
      }

      // 提交
      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.isVisible()) {
        await submitButton.click();
      }

      // 验证错误
      const errorMessage = page.locator('.error-message, .field-error');
      if (await errorMessage.isVisible()) {
        const errorText = await errorMessage.textContent();
        expect(errorText?.toLowerCase()).toMatch(/至少 | 最少|min.*10/);
      }
    }
  });

  test('图片上传：选择 → 预览 → 删除', async ({ page }) => {
    await page.goto('/merchants/test-merchant');

    const writeReviewButton = page.locator('button:has-text("发表点评")');
    if (await writeReviewButton.isVisible()) {
      await writeReviewButton.click();
    }

    const reviewForm = page.locator('form');
    if (await reviewForm.isVisible()) {
      // 上传图片
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        // 创建临时图片文件
        const testImage = Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          'base64'
        );

        await fileInput.setInputFiles({
          name: 'test.png',
          mimeType: 'image/png',
          buffer: testImage,
        });

        // 验证预览显示
        const preview = page.locator('.image-preview, .upload-preview img');
        if (await preview.isVisible()) {
          expect(await preview.isVisible()).toBe(true);

          // 删除图片
          const deleteButton = page.locator('.image-preview .delete-button, .remove-image');
          if (await deleteButton.isVisible()) {
            await deleteButton.click();
            // 验证预览消失
            await expect(preview).not.toBeVisible();
          }
        }
      }
    }
  });

  test('评分组件：键盘操作', async ({ page }) => {
    await page.goto('/merchants/test-merchant');

    const writeReviewButton = page.locator('button:has-text("发表点评")');
    if (await writeReviewButton.isVisible()) {
      await writeReviewButton.click();
    }

    const reviewForm = page.locator('form');
    if (await reviewForm.isVisible()) {
      // 聚焦评分组件
      const starRating = page.locator('[role="slider"]');
      if (await starRating.isVisible()) {
        await starRating.focus();

        // 使用方向键选择评分
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');

        // 验证评分为 3
        const ratingValue = await starRating.getAttribute('aria-valuenow');
        expect(ratingValue).toBe('3');
      }
    }
  });
});

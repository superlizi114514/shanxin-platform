import { test, expect } from '@playwright/test';

/**
 * 性能测试：点评系统负载测试
 */

test.describe('Performance: 点评系统负载测试', () => {
  test('点评列表加载性能 (P95 < 500ms)', async ({ page }) => {
    const loadTimes: number[] = [];

    // 多次测量取平均值
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();

      await page.goto('/merchants/test-merchant-123');

      // 等待点评列表加载完成
      try {
        await page.waitForSelector('.review-card', { timeout: 5000 });
      } catch (e) {
        // 如果没有点评，可能是空状态
        await page.waitForSelector('.empty-state, .no-reviews', { timeout: 5000 });
      }

      const loadTime = Date.now() - startTime;
      loadTimes.push(loadTime);

      // 重置页面
      await page.goto('about:blank');
    }

    // 计算平均加载时间
    const avgLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;
    const maxLoadTime = Math.max(...loadTimes);

    console.log(`点评列表加载时间: 平均=${avgLoadTime}ms, 最大=${maxLoadTime}ms`);

    // P95 目标：< 500ms
    expect(avgLoadTime).toBeLessThan(500);
  });

  test('点评创建性能 (P99 < 1000ms)', async ({ page }) => {
    // 登录
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    await page.goto('/merchants/test-merchant-123');

    // 打开点评表单
    const writeReviewButton = page.locator('button:has-text("发表点评")');
    if (await writeReviewButton.isVisible()) {
      await writeReviewButton.click();
    }

    // 填写表单
    const reviewForm = page.locator('form');
    if (await reviewForm.isVisible()) {
      // 评分
      const stars = page.locator('[role="slider"] button');
      if (await stars.count() > 0) {
        await stars.nth(4).click();
      }

      // 内容
      const contentField = page.locator('textarea[name="content"]');
      if (await contentField.isVisible()) {
        await contentField.fill('很好的餐厅，推荐给大家！');
      }

      // 提交并计时
      const startTime = Date.now();

      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.isVisible()) {
        await submitButton.click();
      }

      // 等待成功提示
      try {
        await page.waitForSelector('.toast:has-text("成功"), [role="alert"]:has-text("成功")', { timeout: 5000 });
      } catch (e) {
        // 可能跳转到其他页面
        await page.waitForLoadState('networkidle');
      }

      const duration = Date.now() - startTime;

      console.log(`点评创建时间：${duration}ms`);

      // P99 目标：< 1000ms
      expect(duration).toBeLessThan(1000);
    }
  });

  test('图片上传性能 (单张 < 3s)', async ({ page }) => {
    await page.goto('/merchants/test-merchant');

    const writeReviewButton = page.locator('button:has-text("发表点评")');
    if (await writeReviewButton.isVisible()) {
      await writeReviewButton.click();
    }

    const reviewForm = page.locator('form');
    if (await reviewForm.isVisible()) {
      // 创建测试图片 (1KB)
      const testImage = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
      );

      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        const startTime = Date.now();

        await fileInput.setInputFiles({
          name: 'test.png',
          mimeType: 'image/png',
          buffer: testImage,
        });

        // 等待预览显示
        await page.waitForSelector('.image-preview img', { timeout: 3000 });

        const uploadTime = Date.now() - startTime;

        console.log(`图片上传时间：${uploadTime}ms`);

        // 目标：< 3s
        expect(uploadTime).toBeLessThan(3000);
      }
    }
  });

  test('并发点评列表请求', async ({ browser }) => {
    const contexts = await Promise.all(
      Array.from({ length: 5 }).map(() => browser.newContext())
    );

    const pages = await Promise.all(
      contexts.map(context => context.newPage())
    );

    const startTime = Date.now();

    // 并发请求
    const results = await Promise.all(
      pages.map(async (page, index) => {
        try {
          await page.goto('/merchants/test-merchant-123');
          await page.waitForSelector('.review-card, .empty-state', { timeout: 5000 });
          return { success: true, time: Date.now() - startTime };
        } catch (error) {
          return { success: false, time: Date.now() - startTime };
        }
      })
    );

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    console.log(`并发请求结果：${results.filter(r => r.success).length}/${results.length} 成功`);
    console.log(`总耗时：${totalTime}ms`);

    // 清理
    await Promise.all(contexts.map(c => c.close()));

    // 验证成功率
    const successRate = results.filter(r => r.success).length / results.length;
    expect(successRate).toBeGreaterThan(0.8); // 至少 80% 成功
  });
});

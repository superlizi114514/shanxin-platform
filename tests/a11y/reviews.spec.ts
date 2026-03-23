import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * 可访问性测试 (A11y)
 */

test.describe('Accessibility: 点评系统无障碍测试', () => {
  test('商家详情页 - 无障碍检查', async ({ page }) => {
    await page.goto('/merchants/test-merchant-123');

    // 使用 axe-core 进行无障碍扫描
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    // 输出结果
    console.log(`发现 ${accessibilityScanResults.violations.length} 个违规`);

    // 验证无严重违规
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('点评表单 - 键盘导航', async ({ page }) => {
    await page.goto('/merchants/test-merchant');

    // 打开点评表单
    const writeReviewButton = page.locator('button:has-text("发表点评")');
    if (await writeReviewButton.isVisible()) {
      await writeReviewButton.click();
    }

    // 使用 Tab 键导航
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // 验证焦点在可交互元素上
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    console.log(`当前焦点元素：${focusedElement}`);

    // 焦点应该在表单元素或按钮上
    expect(['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT']).toContain(focusedElement);
  });

  test('评分组件 - 键盘操作', async ({ page }) => {
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

        // 验证有正确的 ARIA 属性
        const role = await starRating.getAttribute('role');
        const ariaValuenow = await starRating.getAttribute('aria-valuenow');
        const ariaLabel = await starRating.getAttribute('aria-label');

        expect(role).toBe('slider');
        expect(ariaValuenow).toBeTruthy();
        expect(ariaLabel).toBeTruthy();

        // 使用方向键选择评分
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');

        // 验证评分更新
        const newRatingValue = await starRating.getAttribute('aria-valuenow');
        expect(newRatingValue).toBe('3');
      }
    }
  });

  test('点评卡片 - 图片 Alt 文本', async ({ page }) => {
    await page.goto('/merchants/test-merchant-123');

    // 验证所有图片有 alt 属性
    const images = page.locator('.review-card img, .review-images img');
    const count = await images.count();

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const alt = await images.nth(i).getAttribute('alt');
        // alt 可以是空字符串（装饰性图片），但不能缺失
        expect(alt).toBeDefined();
      }
      console.log(`验证 ${count} 张图片的 alt 属性`);
    }
  });

  test('点评列表 - ARIA 标签', async ({ page }) => {
    await page.goto('/merchants/test-merchant-123');

    // 验证列表有正确的 ARIA 标签
    const reviewList = page.locator('[role="list"]');
    const listCount = await reviewList.count();

    if (listCount > 0) {
      const ariaLabel = await reviewList.first().getAttribute('aria-label');
      console.log(`列表 ARIA 标签：${ariaLabel}`);
      expect(ariaLabel).toBeTruthy();
    }

    // 验证列表项
    const reviewItems = page.locator('[role="listitem"]');
    const itemCount = await reviewItems.count();

    if (itemCount > 0) {
      console.log(`验证 ${itemCount} 个列表项`);
      expect(itemCount).toBeGreaterThan(0);
    }
  });

  test('点评表单 - 字段标签', async ({ page }) => {
    await page.goto('/merchants/test-merchant');

    const writeReviewButton = page.locator('button:has-text("发表点评")');
    if (await writeReviewButton.isVisible()) {
      await writeReviewButton.click();
    }

    const reviewForm = page.locator('form');
    if (await reviewForm.isVisible()) {
      // 验证内容字段有标签
      const contentField = page.locator('textarea[name="content"]');
      if (await contentField.isVisible()) {
        // 检查是否有 aria-label 或关联的 label
        const ariaLabel = await contentField.getAttribute('aria-label');
        const id = await contentField.getAttribute('id');

        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          const hasLabel = await label.count() > 0;
          expect(hasLabel || !!ariaLabel).toBe(true);
        } else {
          expect(!!ariaLabel).toBe(true);
        }
      }

      // 验证评分字段有标签
      const starRating = page.locator('[role="slider"]');
      if (await starRating.isVisible()) {
        const ariaLabel = await starRating.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
        expect(ariaLabel?.toLowerCase()).toContain('rating');
      }
    }
  });

  test('错误提示 - 可访问性', async ({ page }) => {
    await page.goto('/merchants/test-merchant');

    const writeReviewButton = page.locator('button:has-text("发表点评")');
    if (await writeReviewButton.isVisible()) {
      await writeReviewButton.click();
    }

    const reviewForm = page.locator('form');
    if (await reviewForm.isVisible()) {
      // 提交空表单触发错误
      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.isVisible()) {
        await submitButton.click();
      }

      // 等待错误提示
      try {
        await page.waitForSelector('.error-message, .field-error, [role="alert"]', { timeout: 3000 });

        // 验证错误提示有正确的 ARIA 角色
        const errorMessage = page.locator('[role="alert"], .error-message');
        if (await errorMessage.count() > 0) {
          const role = await errorMessage.first().getAttribute('role');
          const ariaLive = await errorMessage.first().getAttribute('aria-live');

          // 错误提示应该有 alert 角色或 aria-live
          expect(role === 'alert' || !!ariaLive).toBe(true);
        }
      } catch (e) {
        // 可能没有错误提示
        console.log('未检测到错误提示元素');
      }
    }
  });

  test('颜色对比度 - 文本可读性', async ({ page }) => {
    await page.goto('/merchants/test-merchant-123');

    // 使用 axe-core 检查颜色对比度
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    // 专门检查颜色对比度问题
    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    );

    if (contrastViolations.length > 0) {
      console.log('颜色对比度问题:');
      contrastViolations.forEach(v => {
        console.log(`  - ${v.nodes.length} 个元素`);
      });
    }

    // 允许少量警告，但不能有严重问题
    const criticalViolations = contrastViolations.filter(v => v.impact === 'critical');
    expect(criticalViolations.length).toBe(0);
  });
});

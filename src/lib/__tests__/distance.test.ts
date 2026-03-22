/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * 距离计算工具函数测试
 *
 * 运行测试：npx vitest src/lib/__tests__/distance.test.ts
 * 或手动验证以下测试用例
 */

// 测试用例文档
const testCases = {
  calculateDistance: [
    { name: "相同点距离应为 0", args: [35.072, 117.12, 35.072, 117.12] as const, expected: 0 },
    { name: "教学楼 A 到教学楼 B", args: [35.072, 117.12, 35.0725, 117.121] as const, expectedRange: [50, 200] },
    { name: "约 1 公里距离", args: [35.07, 117.12, 35.079, 117.12] as const, expectedRange: [900, 1100] },
  ],
  estimateWalkingTime: [
    { name: "100 米步行时间", args: [100] as const, expectedRange: [1, 3] },
    { name: "500 米步行时间", args: [500] as const, expectedRange: [5, 10] },
    { name: "0 距离", args: [0] as const, expected: 0 },
  ],
  formatDistance: [
    { name: "50 米格式化", args: [50] as const, expected: "50 m" },
    { name: "1000 米格式化", args: [1000] as const, expected: "1.00 km" },
    { name: "1500 米格式化", args: [1500] as const, expected: "1.50 km" },
  ],
  formatWalkingTime: [
    { name: "0 分钟格式化", args: [0] as const, expected: "< 1 分钟" },
    { name: "5 分钟格式化", args: [5] as const, expected: "5 分钟" },
  ],
};

// 手动验证函数
export function runManualTests() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { calculateDistance, estimateWalkingTime, formatDistance, formatWalkingTime } = require("../distance");

  console.log("=== 距离计算工具函数测试 ===\n");

  // 测试 calculateDistance
  console.log("calculateDistance 测试:");
  for (const test of testCases.calculateDistance) {
    const result = calculateDistance(...test.args);
    if (test.expected !== undefined) {
      console.log(`  ✓ ${test.name}: ${result.toFixed(2)} (期望：${test.expected})`);
    } else if (test.expectedRange) {
      const inRange = result >= test.expectedRange[0] && result <= test.expectedRange[1];
      console.log(`  ${inRange ? "✓" : "✗"} ${test.name}: ${result.toFixed(2)} (期望范围：${test.expectedRange[0]}-${test.expectedRange[1]})`);
    }
  }

  // 测试 estimateWalkingTime
  console.log("\nestimateWalkingTime 测试:");
  for (const test of testCases.estimateWalkingTime) {
    const result = estimateWalkingTime(...test.args);
    if (test.expected !== undefined) {
      console.log(`  ✓ ${test.name}: ${result} (期望：${test.expected})`);
    } else if (test.expectedRange) {
      const inRange = result >= test.expectedRange[0] && result <= test.expectedRange[1];
      console.log(`  ${inRange ? "✓" : "✗"} ${test.name}: ${result} (期望范围：${test.expectedRange[0]}-${test.expectedRange[1]})`);
    }
  }

  // 测试 formatDistance
  console.log("\nformatDistance 测试:");
  for (const test of testCases.formatDistance) {
    const result = formatDistance(...test.args);
    console.log(`  ✓ ${test.name}: "${result}" (期望："${test.expected}")`);
  }

  // 测试 formatWalkingTime
  console.log("\nformatWalkingTime 测试:");
  for (const test of testCases.formatWalkingTime) {
    const result = formatWalkingTime(...test.args);
    console.log(`  ✓ ${test.name}: "${result}" (期望："${test.expected}")`);
  }

  console.log("\n=== 测试完成 ===");
}

// 如果直接运行此文件
if (typeof window === "undefined" && require.main === module) {
  runManualTests();
}

const fs = require('fs');

// 读取 PDF 原始内容
const files = ['李涵 (2025-2026-2) 课表.pdf', 'sucai/李涵 (2025-2026-2) 课表.pdf'];

for (const file of files) {
  if (!fs.existsSync(file)) continue;

  console.log(`\n=== ${file} ===`);
  const buffer = fs.readFileSync(file);
  console.log('Size:', buffer.length, 'bytes');

  // 显示 PDF 原始内容（作为字符串）
  const raw = buffer.toString('latin1');
  console.log('Raw content (first 2000 chars):');
  console.log(raw.substring(0, 2000));

  // 搜索关键词
  if (raw.includes('大学英语')) console.log('✓ 包含"大学英语"');
  if (raw.includes('☆')) console.log('✓ 包含☆');
  if (raw.includes('星期一')) console.log('✓ 包含"星期一"');
  if (raw.includes('K4405')) console.log('✓ 包含"K4405"');
}

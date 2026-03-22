const fs = require('fs');

// 直接读取根目录的 PDF
const pdfPath = './李涵 (2025-2026-2) 课表.pdf';
console.log('Checking:', pdfPath);
console.log('Exists:', fs.existsSync(pdfPath));

if (fs.existsSync(pdfPath)) {
  const buffer = fs.readFileSync(pdfPath);
  console.log('Size:', buffer.length, 'bytes');

  // 转为字符串搜索
  const content = buffer.toString('utf-8');

  // 搜索关键内容
  const keywords = ['大学英语', '☆', '星期一', 'K4405', '课表', '2025', 'pdf'];
  for (const kw of keywords) {
    const idx = content.indexOf(kw);
    if (idx >= 0) {
      console.log(`✓ Found "${kw}" at position ${idx}`);
    } else {
      console.log(`✗ Not found "${kw}"`);
    }
  }

  // 显示前 500 字符
  console.log('\nFirst 500 chars:');
  console.log(content.substring(0, 500));
}

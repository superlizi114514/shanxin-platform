// 检查隐藏字符

const testText = `2025-2026 学年第 2 学期 李涵课表 学号：2025010437
时间段 节次 星期一 星期二 星期三 星期四 星期五 星期六 星期日
上午
1 大学英语 D2☆
(1-2 节)1-2 周，4-6 周 (双),7-8 周，10-14 周/K4405 教室/赵海清
`;

// 检查☆周围的字符代码
const starIndex = testText.indexOf('☆');
console.log('☆位置:', starIndex);
console.log('☆周围字符代码:');
for (let i = Math.max(0, starIndex - 5); i < Math.min(testText.length, starIndex + 10); i++) {
  const char = testText[i];
  const code = testText.charCodeAt(i);
  console.log(` [${i}] '${char}' = ${code} (0x${code.toString(16)})`);
}

// 检查是否有零宽字符
const zeroWidthChars = [0x200B, 0x200C, 0x200D, 0xFEFF];
const foundZeroWidth = [];
for (let i = 0; i < testText.length; i++) {
  const code = testText.charCodeAt(i);
  if (zeroWidthChars.includes(code)) {
    foundZeroWidth.push({ position: i, code });
  }
}

if (foundZeroWidth.length > 0) {
  console.log('\n发现零宽字符:', foundZeroWidth);
} else {
  console.log('\n未发现零宽字符');
}

// 用 Unicode 转义显示
console.log('\nUnicode 转义显示:');
console.log(testText.split('').map(c => {
  const code = c.charCodeAt(0);
  return code > 127 ? `\\u${code.toString(16).padStart(4, '0')}` : c;
}).join('').substring(0, 200));

// 测试去除空白后的匹配
const trimmed = testText.trim().replace(/\r/g, '');
console.log('\n清理后测试:');
const regex = /D2☆\n/g;
console.log('清理后匹配:', regex.test(trimmed));

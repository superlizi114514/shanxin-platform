const fs = require('fs');
const path = require('path');

// 读取 PDF 原始数据并分析
const baseDir = path.join(process.cwd(), 'sucai/');
const files = fs.readdirSync(baseDir);
const pdfFile = files.find(f => f.endsWith('.pdf'));
const data = fs.readFileSync(baseDir + pdfFile);

console.log('=== PDF 文件分析 ===');
console.log('文件:', pdfFile);
console.log('大小:', data.length, 'bytes');

// 查找关键对象
const content = data.toString('binary');

// 检查是否有文本内容流
const streamMatches = [...content.matchAll(/stream/g)];
console.log('\nstream 对象数量:', streamMatches.length);

// 检查是否有 TJ 或 Tj 操作符 (PDF 文本显示操作)
const tjMatches = [...content.matchAll(/[\[\]]\s*[\d.]+\s*\]/g)];
const tjMatches2 = [...content.matchAll(/\sTj/g)];
const tjMatches3 = [...content.matchAll(/TJ/g)];

console.log('Tj 操作符数量:', tjMatches2.length + tjMatches3.length);
console.log('带参数的 TJ 操作符:', tjMatches.length);

// 检查 ToUnicode
const toUnicodeIndex = content.indexOf('ToUnicode');
if (toUnicodeIndex !== -1) {
  console.log('\n找到 ToUnicode CMap');
  const context = content.substring(toUnicodeIndex, toUnicodeIndex + 500);
  console.log('ToUnicode 内容:', context);
} else {
  console.log('\n未找到 ToUnicode CMap - 这是中文 PDF 无法解析的常见原因');
}

// 检查字体
const fontMatches = [...content.matchAll(/\/Font<</g)];
console.log('\nFont 资源:', fontMatches.length);

// 查找 Font 对象
const fontObjRegex = /(\d+)\s+0\s+obj\s+<<[^>]*\/Type\s*\/Font[^>]*>>/gs;
const fontObjects = [...content.matchAll(fontObjRegex)];
console.log('Font 对象数量:', fontObjects.length);

fontObjects.forEach((match, i) => {
  const fontObj = match[0].substring(0, 300);
  console.log(`\n字体 ${i + 1}:`, fontObj);
});

// 检查 BaseFont
const baseFontRegex = /\/BaseFont\s*\/([A-Za-z0-9\-\+]+)/g;
const baseFonts = [...content.matchAll(baseFontRegex)];
console.log('\n=== BaseFont 列表 ===');
baseFonts.forEach((match, i) => {
  console.log(`${i + 1}: ${match[1]}`);
});

// 检查是否有 Subtype /Type1 或 /TrueType
const subtypeRegex = /\/Subtype\s*\/(\w+)/g;
const subtypes = [...content.matchAll(subtypeRegex)];
console.log('\n=== Subtype 列表 ===');
const subtypeCounts = {};
subtypes.forEach(match => {
  subtypeCounts[match[1]] = (subtypeCounts[match[1]] || 0) + 1;
});
Object.entries(subtypeCounts).forEach(([type, count]) => {
  console.log(`${type}: ${count}`);
});

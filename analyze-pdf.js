const fs = require('fs');
const path = require('path');

// 使用动态查找文件
const baseDir = path.join(process.cwd(), 'sucai/');
const files = fs.readdirSync(baseDir);
const pdfFile = files.find(f => f.endsWith('.pdf'));
const pdfPath = baseDir + pdfFile;

const data = fs.readFileSync(pdfPath);
const header = data.slice(0, 100);
console.log('PDF 头:', header.toString('latin1'));

// 查找 ToUnicode CMap
const toUnicodeIndex = data.indexOf('ToUnicode');
if (toUnicodeIndex !== -1) {
  console.log('找到 ToUnicode CMap，位置:', toUnicodeIndex);
  const context = data.slice(toUnicodeIndex, toUnicodeIndex + 200);
  console.log('ToUnicode 内容:', context.toString('latin1'));
}

// 查找 FontDescriptor
const fontDescIndex = data.indexOf('FontDescriptor');
if (fontDescIndex !== -1) {
  console.log('找到 FontDescriptor，位置:', fontDescIndex);
}

// 检查是否有嵌入字体
const fontIndex = data.indexOf('/Font');
if (fontIndex !== -1) {
  console.log('找到 Font，位置:', fontIndex);
}

// 检查 PDF 版本
console.log('\nPDF 版本信息:');
const versionMatch = data.toString('latin1').match(/%PDF-(\d+\.\d+)/);
if (versionMatch) {
  console.log('PDF 版本:', versionMatch[1]);
}

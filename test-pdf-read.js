const fs = require('fs');
const path = require('path');

// DOMMatrix polyfill for pdfjs-dist
globalThis.DOMMatrix = class DOMMatrix {
  a = 1; b = 0; c = 0; d = 0; e = 0; f = 0;
  m11 = 1; m12 = 0; m13 = 0; m14 = 0;
  m21 = 0; m22 = 1; m23 = 0; m24 = 0;
  m31 = 0; m32 = 0; m33 = 1; m34 = 0;
  m41 = 0; m42 = 0; m43 = 0; m44 = 1;
  multiply() { return this; }
  transformPoint(p) { return { x: p.x, y: p.y }; }
};

const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');

async function testPDF(filePath) {
  console.log('=== 测试 PDF 文件 ===');
  console.log('文件路径:', filePath);

  if (!fs.existsSync(filePath)) {
    console.error('错误：文件不存在');
    return;
  }

  const dataBuffer = fs.readFileSync(filePath);
  console.log('文件大小:', dataBuffer.length, 'bytes');

  // 检查 PDF 签名
  const header = dataBuffer.slice(0, 5);
  console.log('PDF 签名:', header.toString('latin1'));

  const pdf = await pdfjsLib.getDocument({ data: dataBuffer }).promise;
  console.log('页数:', pdf.numPages);

  let totalText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    console.log('\n--- 解析第', i, '页 ---');
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items.map(item => item.str).join(' ');
    totalText += text + '\n';
    console.log('文本长度:', text.length);
    if (text.trim()) {
      console.log('内容预览:');
      console.log(text.substring(0, 800));
    } else {
      console.log('(无文本内容 - 可能是图像型 PDF)');
    }
  }

  console.log('\n=== 总提取文本 ===');
  console.log(totalText || '(无内容)');

  // 检查是否只有页码
  const onlyPageMarkers = /^[\s\n--\dof]*$/.test(totalText.replace(/\n/g, ''));
  if (onlyPageMarkers) {
    console.log('\n⚠️ 警告：PDF 只包含页码标记，可能是图像型 PDF');
  } else {
    console.log('\n✅ PDF 包含有效文本内容');
  }
}

// 查找 PDF 文件
const pdfFiles = [
  'E:/项目总/山信二手平台/shanxin-platform/sucai/李涵 (2025-2026-2) 课表.pdf',
  'E:/项目总/山信二手平台/sucai/李涵 (2025-2026-2) 课表.pdf',
  'E:/项目总/山信二手平台/shanxin-platform/李涵 (2025-2026-2) 课表.pdf',
  './sucai/李涵 (2025-2026-2) 课表.pdf',
  './李涵 (2025-2026-2) 课表.pdf'
];

for (const file of pdfFiles) {
  if (fs.existsSync(file)) {
    console.log('找到 PDF:', file);
    testPDF(file);
    break;
  }
}

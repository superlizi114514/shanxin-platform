// 解析课表 PDF 脚本 - 直接使用完整路径
const fs = require('fs');
const path = require('path');

// 定义 DOMMatrix 必须在导入 pdfjs-dist 之前
globalThis.DOMMatrix = globalThis.DOMMatrix || class DOMMatrix {
  a = 1; b = 0; c = 0; d = 0; e = 0; f = 0;
  m11 = 1; m12 = 0; m13 = 0; m14 = 0;
  m21 = 0; m22 = 1; m23 = 0; m24 = 0;
  m31 = 0; m32 = 0; m33 = 1; m34 = 0;
  m41 = 0; m42 = 0; m43 = 0; m44 = 1;

  constructor() {}
  multiply() { return this; }
  transformPoint(point) { return { x: point.x, y: point.y }; }
};

const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');

async function testPDF(filePath) {
  try {
    console.log('正在读取 PDF 文件:', filePath);

    if (!fs.existsSync(filePath)) {
      console.error('错误：文件不存在:', filePath);
      return null;
    }

    const dataBuffer = fs.readFileSync(filePath);
    console.log('文件大小:', dataBuffer.length, 'bytes');

    // 加载 PDF
    const loadingTask = pdfjsLib.getDocument({
      data: dataBuffer,
      useSystemFonts: true,
      disableFontFace: true,
    });

    const pdf = await loadingTask.promise;
    console.log('PDF 加载成功，页数:', pdf.numPages);

    let fullText = '';

    // 遍历所有页面提取文本
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log(`正在解析第 ${pageNum} 页...`);
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      console.log(`第 ${pageNum} 页提取到 ${pageText.length} 字符`);
      fullText += pageText + '\n';
    }

    console.log('\n========== PDF 解析结果 ==========');
    console.log('总文本长度:', fullText.length, '字符');
    console.log('\n提取的文本内容:');
    console.log('===================================');
    console.log(fullText);
    console.log('===================================\n');

    return fullText;

  } catch (error) {
    console.error('解析失败:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    return null;
  }
}

// 直接使用绝对路径
const files = [
  String.raw`E:\项目总\山信二手平台\shanxin-platform\李涵 (2025-2026-2) 课表.pdf`,
  String.raw`E:\项目总\山信二手平台\shanxin-platform\sucai\李涵 (2025-2026-2) 课表.pdf`,
];

console.log('当前工作目录:', process.cwd());
console.log('要检查的文件:');
files.forEach(f => console.log(' -', f));

// 检查哪个文件存在
const existingFiles = files.filter(f => fs.existsSync(f));
console.log('\n存在的文件:');
existingFiles.forEach(f => console.log(' ✓', f));

if (existingFiles.length === 0) {
  console.log('\n未找到课表 PDF 文件');
  process.exit(1);
}

// 解析第一个存在的文件
(async () => {
  const result = await testPDF(path.resolve(existingFiles[0]));
  if (result) {
    console.log('\n\n解析成功！');
  } else {
    console.log('\n\n解析失败');
    process.exit(1);
  }
})();

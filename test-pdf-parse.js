// 测试 PDF 解析脚本 - 使用 pdfjs-dist
// 使用方法：将 PDF 文件复制到 test.pdf，然后运行 node test-pdf-parse.js

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

const pdfjsLib = require('pdfjs-dist');

async function testPDF(filePath) {
  try {
    console.log('正在读取 PDF 文件:', filePath);

    if (!fs.existsSync(filePath)) {
      console.error('错误：文件不存在:', filePath);
      console.log('请将您的 PDF 文件复制到此目录并重命名为 test.pdf');
      return;
    }

    const dataBuffer = fs.readFileSync(filePath);
    console.log('文件大小:', dataBuffer.length, 'bytes');

    // 验证 PDF 签名
    const header = dataBuffer.slice(0, 5);
    console.log('PDF 签名:', header.toString('latin1'));
    if (header[0] !== 0x25 || header[1] !== 0x50 || header[2] !== 0x44 ||
        header[3] !== 0x46 || header[4] !== 0x2D) {
      console.error('错误：不是有效的 PDF 文件（缺少 %PDF- 签名）');
      return;
    }
    console.log('PDF 签名验证通过');

    console.log('\n开始解析 PDF...');

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
      console.log(`\n正在解析第 ${pageNum} 页...`);
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      console.log(`第 ${pageNum} 页提取到 ${pageText.length} 字符`);
      fullText += pageText + '\n';
    }

    console.log('\n========== PDF 解析结果 ==========');
    console.log('总文本长度:', fullText.length, '字符');
    console.log('\n提取的文本内容:');
    console.log('-----------------------------------');
    console.log(fullText.substring(0, 2000) || '(无内容)');
    console.log('-----------------------------------');

    // 检查是否只有页码标记
    const onlyPageMarkers = /^[\s\n--\dof]*$/.test(fullText.replace(/\n/g, ''));
    if (onlyPageMarkers) {
      console.log('\n警告：PDF 似乎只包含页码标记，可能是图像型 PDF 或加密文件');
    } else {
      console.log('\nPDF 包含有效的文本内容');
    }

  } catch (error) {
    console.error('\n解析失败:', error.message);
    console.error(error.stack);
  }
}

// 查找测试文件
const testFiles = ['test.pdf', '课表.pdf', 'schedule.pdf', 'course.pdf'];
let foundFile = null;

for (const file of testFiles) {
  if (fs.existsSync(file)) {
    foundFile = file;
    break;
  }
}

if (foundFile) {
  testPDF(path.resolve(foundFile));
} else {
  console.log('未找到测试 PDF 文件');
  console.log('请将 PDF 文件复制到此目录，命名为以下之一：');
  console.log('  - test.pdf');
  console.log('  - 课表.pdf');
  console.log('  - schedule.pdf');
  console.log('  - course.pdf');
  console.log('\n然后重新运行：node test-pdf-parse.js');
}

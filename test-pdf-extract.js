const fs = require('fs');

// 设置 DOMMatrix
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
  if (!fs.existsSync(filePath)) {
    console.log('文件不存在:', filePath);
    return;
  }

  const dataBuffer = fs.readFileSync(filePath);
  console.log('文件大小:', dataBuffer.length, 'bytes');

  const loadingTask = pdfjsLib.getDocument({
    data: dataBuffer,
    useSystemFonts: true,
    disableFontFace: true,
  });

  const pdf = await loadingTask.promise;
  console.log('页数:', pdf.numPages);

  let fullText = '';
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    console.log('第', pageNum, '页字符:', pageText.length);
    fullText += pageText + '\n';
  }

  console.log('\n========== 提取的文本 ==========');
  console.log(fullText.substring(0, 2000));
  console.log('========== 结束 ==========');
}

const filePath = process.argv[2];
if (filePath) {
  testPDF(filePath).catch(e => console.log('错误:', e.message));
} else {
  console.log('用法：node test-pdf-extract.js <pdf 文件路径>');
}

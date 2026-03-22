// 测试 pdfjs-dist 解析 PDF
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

// 定义 DOMMatrix
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor(init) {
      this.a = 1; this.b = 0; this.c = 0; this.d = 0; this.e = 0; this.f = 0;
      this.m11 = 1; this.m12 = 0; this.m13 = 0; this.m14 = 0;
      this.m21 = 0; this.m22 = 1; this.m23 = 0; this.m24 = 0;
      this.m31 = 0; this.m32 = 0; this.m33 = 1; this.m34 = 0;
      this.m41 = 0; this.m42 = 0; this.m43 = 0; this.m44 = 1;
    }
    multiply() { return this; }
    transformPoint(point) { return { x: point.x, y: point.y }; }
  };
}

const pdfjs = require('pdfjs-dist');
const workerPath = path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
const workerUrl = pathToFileURL(workerPath).href;
console.log('Worker URL:', workerUrl);
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

async function testParse() {
  // 使用短文件名
  const files = fs.readdirSync('.').filter(f => f.includes('李涵') && f.endsWith('.pdf'));
  console.log('PDF files:', files);

  if (files.length === 0) {
    console.log('No PDF files found');
    return;
  }

  const pdfPath = files[0];
  console.log('Reading PDF:', pdfPath);

  const buffer = fs.readFileSync(pdfPath);
  const data = new Uint8Array(buffer);

  console.log('PDF size:', buffer.length, 'bytes');

  try {
    const loadingTask = pdfjs.getDocument({ data });
    const pdf = await loadingTask.promise;

    console.log('PDF loaded:', pdf.numPages, 'pages');

    let pdfText = '';
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      pdfText += pageText + '\n';

      console.log(`Page ${pageNum}: ${textContent.items.length} text items`);
      console.log(`Text preview: ${pageText.substring(0, 200)}`);
    }

    console.log('\n========== 完整文本 ==========');
    console.log(pdfText);
    console.log('============================');
    console.log('总文本长度:', pdfText.length);

    // 测试解析
    if (pdfText.includes('☆')) {
      console.log('\n找到☆标记，可以解析课程表！');
    } else {
      console.log('\n未找到☆标记，可能是图像型 PDF');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testParse();

// 直接使用 pdfjs-dist 测试 - 完整版本
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

// 定义 DOMMatrix
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor() {
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

// 设置 worker
const workerPath = path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
const workerUrl = pathToFileURL(workerPath).href;
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

// 设置 cMap 用于字体解码
const cMapPath = path.join(process.cwd(), 'node_modules/pdfjs-dist/cmaps/');
const cMapUrl = pathToFileURL(cMapPath).href;

async function testParse() {
  const files = fs.readdirSync('.').filter(f => f.includes('李涵') && f.endsWith('.pdf'));

  if (files.length === 0) {
    console.log('No PDF files found');
    return;
  }

  const pdfPath = files[0];
  console.log('Reading PDF:', pdfPath);

  const buffer = fs.readFileSync(pdfPath);
  const data = new Uint8Array(buffer);
  console.log('PDF size:', data.length, 'bytes');

  try {
    const loadingTask = pdfjs.getDocument({
      data: data,
      cMapUrl: cMapUrl,
      cMapPacked: true,
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    console.log('PDF loaded:', pdf.numPages, 'pages');

    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log(`\nParsing page ${pageNum}...`);
      const page = await pdf.getPage(pageNum);
      console.log('Page dimensions:', page.view);

      const textContent = await page.getTextContent();
      console.log(`Found ${textContent.items.length} text items`);

      // 打印每个文本项的详细信息
      textContent.items.forEach((item, i) => {
        console.log(`  Item ${i}: "${item.str}" (${item.transform?.[0]}x${item.transform?.[3]})`);
      });

      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }

    console.log('\n========== 完整文本 ==========');
    console.log(fullText);
    console.log('============================');
    console.log('Total length:', fullText.length);

    if (fullText.includes('☆')) {
      console.log('\n找到☆标记！');
    } else {
      console.log('\n未找到☆标记 - 可能是图像型 PDF');
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

testParse();

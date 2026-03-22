// 完整测试 PDF 文本提取
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

// 定义 DOMMatrix
globalThis.DOMMatrix = class {
  constructor() {
    this.m11 = 1; this.m12 = 0; this.m13 = 0; this.m14 = 0;
    this.m21 = 0; this.m22 = 1; this.m23 = 0; this.m24 = 0;
    this.m31 = 0; this.m32 = 0; this.m33 = 1; this.m34 = 0;
    this.m41 = 0; this.m42 = 0; this.m43 = 0; this.m44 = 1;
  }
  multiply() { return this; }
  transformPoint(p) { return { x: p.x, y: p.y }; }
};

const pdfjs = require('pdfjs-dist');

// 设置 worker
const workerPath = path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
const workerUrl = pathToFileURL(workerPath).href;
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

async function test() {
  // 读取 PDF
  const f = fs.readdirSync('.').find(x => x.includes('李涵') && x.endsWith('.pdf'));
  const buffer = fs.readFileSync(f);
  const data = new Uint8Array(buffer);

  console.log('Loading PDF:', f, 'Size:', data.length);

  // 加载 PDF
  const pdf = await pdfjs.getDocument({ data }).promise;
  console.log('Pages:', pdf.numPages);

  // 遍历所有页面
  for (let i = 1; i <= pdf.numPages; i++) {
    console.log(`\n=== Page ${i} ===`);
    const page = await pdf.getPage(i);

    // 提取文本
    const textContent = await page.getTextContent();
    console.log('Text items:', textContent.items.length);

    for (const item of textContent.items) {
      console.log('  -', JSON.stringify(item.str), 'pos:', item.transform?.[4], item.transform?.[5]);
    }
  }
}

test().catch(console.error);

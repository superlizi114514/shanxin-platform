const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

// 设置全局变量
globalThis.DOMMatrix = class DOMMatrix {
  a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
  constructor() {}
  multiply() { return this; }
  transformPoint(p) { return { x: p.x, y: p.y }; }
  toString() { return [this.a, this.b, this.c, this.d, this.e, this.f].join(','); }
};

// 使用 pdfjs-dist 的 legacy build
async function parsePDF() {
  const pdfjsPath = path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.mjs');
  const workerPath = path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
  const cMapUrl = path.join(process.cwd(), 'node_modules/pdfjs-dist/cmaps/');

  const pdfjsLib = await import(pathToFileURL(pdfjsPath).href);

  // 设置 worker 和 CMap
  pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

  const baseDir = path.join(process.cwd(), 'sucai/');
  const files = fs.readdirSync(baseDir);
  const pdfFile = files.find(f => f.endsWith('.pdf'));
  const data = new Uint8Array(fs.readFileSync(baseDir + pdfFile));

  console.log('加载 PDF...');
  console.log('CMap 路径:', cMapUrl);

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: data,
      cMapUrl: pathToFileURL(cMapUrl).href + '/',
      cMapPacked: true,
      useSystemFonts: true,
      disableFontFace: true,
    });

    const doc = await loadingTask.promise;
    console.log('页数:', doc.numPages);

    for (let i = 1; i <= doc.numPages; i++) {
      console.log('\n=== 第', i, '页 ===');
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();
      console.log('文本项数量:', textContent.items.length);

      textContent.items.forEach((item, idx) => {
        if (item.str.trim()) {
          console.log('  项', idx + 1, ':', JSON.stringify(item.str));
        }
      });

      const fullText = textContent.items.map(item => item.str).join(' ');
      console.log('\n全部文本:', fullText);
    }

  } catch (e) {
    console.error('解析错误:', e.message);
    console.error(e.stack);
  }
}

parsePDF();

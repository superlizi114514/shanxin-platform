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

async function testPDF() {
  const pdfjsPath = path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.mjs');
  const workerPath = path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');

  const pdfjsLib = await import(pathToFileURL(pdfjsPath).href);
  pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

  // 复制 PDF 到无中文路径
  const pdfSrc = path.join(process.cwd(), 'sucai/李涵 (2025-2026-2) 课表.pdf');
  const pdfDest = 'C:/temp/test.pdf';

  // 动态查找 PDF 文件
  const baseDir = path.join(process.cwd(), 'sucai/');
  const files = fs.readdirSync(baseDir);
  const pdfFile = files.find(f => f.endsWith('.pdf'));
  fs.copyFileSync(baseDir + pdfFile, pdfDest);

  const data = new Uint8Array(fs.readFileSync(pdfDest));

  // 使用无中文路径的 CMap
  const cMapUrl = 'file:///C:/temp/cmaps/';

  console.log('PDF 已复制到:', pdfDest);
  console.log('CMap URL:', cMapUrl);

  // 测试 CMap 文件是否可访问
  const testFile = 'C:/temp/cmaps/UniGB-UCS2-H.bcmap';
  console.log('CMap 文件存在:', fs.existsSync(testFile));

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: data,
      cMapUrl,
      cMapPacked: true,
      useSystemFonts: false,
      disableFontFace: true,
    });

    const doc = await loadingTask.promise;
    console.log('\n文档加载成功，页数:', doc.numPages);

    for (let i = 1; i <= doc.numPages; i++) {
      console.log(`\n=== 第 ${i} 页 ===`);
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();
      console.log('文本项数量:', textContent.items.length);

      textContent.items.forEach((item, idx) => {
        if (item.str && item.str.trim()) {
          console.log('  项', idx + 1, ':', item.str);
        }
      });

      const fullText = textContent.items.map(item => item.str).join(' ');
      console.log('\n全部文本:', fullText);
    }

  } catch (e) {
    console.error('错误:', e.message);
    console.error(e.stack);
  }
}

testPDF();

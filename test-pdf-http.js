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

  const baseDir = path.join(process.cwd(), 'sucai/');
  const files = fs.readdirSync(baseDir);
  const pdfFile = files.find(f => f.endsWith('.pdf'));
  const data = new Uint8Array(fs.readFileSync(baseDir + pdfFile));

  console.log('尝试使用系统字体加载...\n');

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: data,
      // 使用系统字体
      useSystemFonts: true,
      disableFontFace: false,
      // 禁用 CMap
      cMapUrl: undefined,
      cMapPacked: false,
      // 尝试使用内置字体
      loadSystemFonts: true,
      maxImageSize: 4096,
    });

    const doc = await loadingTask.promise;
    console.log('文档加载成功，页数:', doc.numPages);

    for (let i = 1; i <= doc.numPages; i++) {
      console.log(`\n=== 第 ${i} 页 ===`);
      const page = await doc.getPage(i);

      // 尝试获取文本
      const textContent = await page.getTextContent();
      console.log('文本项数量:', textContent.items.length);

      if (textContent.items.length === 0) {
        // 尝试使用 getOperatorList 获取原始文本
        const opList = await page.getOperatorList();
        console.log('操作符数量:', opList.fnArray.length);

        // 查找文本操作符 (Fn31 = showText, Fn32 = showSpacedText)
        let textOps = 0;
        for (let j = 0; j < opList.fnArray.length; j++) {
          if (opList.fnArray[j] === 31 || opList.fnArray[j] === 32) {
            textOps++;
            const args = opList.argsArray[j];
            if (args && args[0]) {
              console.log(`  文本操作符 ${j}:`, args[0]);
            }
          }
        }
        console.log('文本操作符数量:', textOps);
      } else {
        textContent.items.forEach((item, idx) => {
          if (item.str && item.str.trim()) {
            console.log('  项', idx + 1, ':', item.str);
          }
        });
      }
    }

  } catch (e) {
    console.error('错误:', e.message);
  }
}

testPDF();

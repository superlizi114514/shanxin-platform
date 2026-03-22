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

async function analyzePDF() {
  const pdfjsPath = path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.mjs');
  const workerPath = path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');

  const pdfjsLib = await import(pathToFileURL(pdfjsPath).href);
  pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

  const baseDir = path.join(process.cwd(), 'sucai/');
  const files = fs.readdirSync(baseDir);
  const pdfFile = files.find(f => f.endsWith('.pdf'));
  const data = new Uint8Array(fs.readFileSync(baseDir + pdfFile));

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: data,
      useSystemFonts: false,
      disableFontFace: true,
      // 不使用 CMap，直接获取原始字符代码
      cMapUrl: undefined,
      cMapPacked: false,
    });

    const doc = await loadingTask.promise;
    console.log('文档加载成功，页数:', doc.numPages);

    for (let i = 1; i <= doc.numPages; i++) {
      console.log(`\n=== 第 ${i} 页 ===`);
      const page = await doc.getPage(i);

      // 获取操作符列表
      const opList = await page.getOperatorList();
      console.log('操作符总数:', opList.fnArray.length);

      // 显示所有操作符
      const fnMap = {};
      opList.fnArray.forEach((fn, idx) => {
        fnMap[fn] = (fnMap[fn] || 0) + 1;
      });

      console.log('操作符分布:');
      Object.entries(fnMap).forEach(([fn, count]) => {
        console.log(`  Fn${fn}: ${count}`);
      });

      // 查找文本相关操作符
      // 31 = showText, 32 = showSpacedText, 33 = showTextLine, etc.
      console.log('\n文本操作符详情:');
      for (let j = 0; j < opList.fnArray.length; j++) {
        const fn = opList.fnArray[j];
        const args = opList.argsArray[j];

        // 文本显示操作符
        if (fn === 31 || fn === 32) {
          console.log(`  Fn${fn}:`, JSON.stringify(args));
        }

        // 字体设置操作符 (34 = setFont)
        if (fn === 34) {
          console.log(`  Fn34 (字体):`, JSON.stringify(args));
        }
      }

    }

  } catch (e) {
    console.error('错误:', e.message);
  }
}

analyzePDF();

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

globalThis.DOMMatrix = class DOMMatrix {
  a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
  constructor() {}
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

  console.log('尝试获取原始字符代码...\n');

  try {
    const loadingTask = pdfjsLib.getDocument({
      data: data,
      useSystemFonts: false,
      disableFontFace: true,
    });

    const doc = await loadingTask.promise;
    console.log('文档加载成功，页数:', doc.numPages);

    for (let i = 1; i <= doc.numPages; i++) {
      console.log(`\n=== 第 ${i} 页 ===`);
      const page = await doc.getPage(i);

      // 获取 operatorList
      const opList = await page.getOperatorList();

      // 查找所有文本相关操作符
      console.log('操作符总数:', opList.fnArray.length);

      // 收集所有字符串参数
      const strings = [];
      for (let j = 0; j < opList.fnArray.length; j++) {
        const fn = opList.fnArray[j];
        const args = opList.argsArray[j];

        // Fn31 = showText, Fn32 = showSpacedText
        if (fn === 31 || fn === 32) {
          if (args && args[0]) {
            const strData = args[0];
            // 可能是 Uint8Array 或字符串
            if (strData instanceof Uint8Array) {
              // 原始字节
              const bytes = Array.from(strData).map(b => b.toString(16).padStart(2, '0')).join(' ');
              strings.push({ type: 'bytes', data: bytes, len: strData.length });

              // 尝试作为 GBK 解码
              try {
                // 简单的 ASCII 范围字符
                const ascii = Array.from(strData).map(b => b >= 32 && b < 127 ? String.fromCharCode(b) : '.').join('');
                if (ascii.includes(/[A-Za-z0-9]/)) {
                  strings.push({ type: 'ascii', data: ascii });
                }
              } catch (e) {}
            } else if (typeof strData === 'string') {
              strings.push({ type: 'string', data: strData });
            } else {
              strings.push({ type: typeof strData, data: JSON.stringify(strData)?.substring(0, 100) });
            }
          }
        }
      }

      console.log('文本操作符参数:', strings.length);
      strings.slice(0, 20).forEach((s, idx) => {
        console.log(`  ${idx + 1} [${s.type}]: ${s.data}`);
      });

      // 获取字体信息
      try {
        const fonts = await page.getFont();
        console.log('字体信息:', fonts);
      } catch (e) {
        console.log('字体信息获取失败:', e.message);
      }
    }

  } catch (e) {
    console.error('错误:', e.message);
  }
}

testPDF();

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { PDFParse, VerbosityLevel } = require('pdf-parse');

// 设置全局变量
globalThis.DOMMatrix = class DOMMatrix {
  a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
  constructor() {}
  multiply() { return this; }
  transformPoint(p) { return { x: p.x, y: p.y }; }
  toString() { return [this.a, this.b, this.c, this.d, this.e, this.f].join(','); }
};

async function parsePDF() {
  const baseDir = path.join(process.cwd(), 'sucai/');
  const files = fs.readdirSync(baseDir);
  const pdfFile = files.find(f => f.endsWith('.pdf'));
  const data = new Uint8Array(fs.readFileSync(baseDir + pdfFile));

  const cMapUrl = pathToFileURL(path.join(process.cwd(), 'node_modules/pdfjs-dist/cmaps/')).href + '/';

  console.log('使用 CMap URL:', cMapUrl);

  try {
    const parser = new PDFParse({
      data,
      verbosity: VerbosityLevel.WARNINGS,
      cMapUrl,
      cMapPacked: true,
      useWorkerFetch: false,
    });

    const result = await parser.getText({
      itemJoiner: ' ',
      lineEnforce: true
    });

    console.log('\n========== 解析结果 ==========');
    console.log('页数:', result.numpages);
    console.log('文本长度:', result.text.length);
    console.log('\n文本内容:');
    console.log(result.text);

  } catch (e) {
    console.error('解析错误:', e.message);
    console.error(e.stack);
  }
}

parsePDF();

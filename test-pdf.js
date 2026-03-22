const { PDFParse, VerbosityLevel } = require('pdf-parse');
const fs = require('fs');

globalThis.DOMMatrix = globalThis.DOMMatrix || class DOMMatrix {
  a = 1; b = 0; c = 0; d = 0; e = 0; f = 0;
  constructor() {}
  multiply() { return this; }
  transformPoint(point) { return { x: point.x, y: point.y }; }
};

const pdfPath = 'sucai/李涵 (2025-2026-2) 课表.pdf';
console.log('PDF 路径:', pdfPath);
console.log('文件存在:', fs.existsSync(pdfPath));

const data = fs.readFileSync(pdfPath);
console.log('文件大小:', data.length, 'bytes');

const parser = new PDFParse({
  data,
  verbosity: VerbosityLevel.ERRORS,
});

parser.getText({
  itemJoiner: '',
  lineEnforce: true,
}).then(result => {
  console.log('\n========== PDF 提取的原始文本 ==========');
  console.log(result.text);
  console.log('\n========== 包含"节"的行 ==========');
  const lines = result.text.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('节') || line.includes('周') || line.includes('星期')) {
      console.log('行', i + 1, ':', line);
    }
  });
  console.log('\n========== 包含☆的行 ==========');
  lines.forEach((line, i) => {
    if (line.includes('☆')) {
      console.log('行', i + 1, ':', line);
    }
  });
  fs.writeFileSync('parsed-text.txt', result.text, 'utf-8');
  console.log('\n已保存到 parsed-text.txt');
}).catch(err => {
  console.error('解析错误:', err);
});

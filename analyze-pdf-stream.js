const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// 分析 PDF 内容流
const baseDir = path.join(process.cwd(), 'sucai/');
const files = fs.readdirSync(baseDir);
const pdfFile = files.find(f => f.endsWith('.pdf'));
const data = fs.readFileSync(baseDir + pdfFile);

const content = data.toString('binary');

// 查找流对象并解压
const streamRegex = /stream\r?\n([\s\S]*?)endstream/g;
let match;
let streamIndex = 0;

console.log('=== PDF 压缩流内容分析 ===\n');

while ((match = streamRegex.exec(content)) !== null) {
  let streamContent = match[1];
  // 去掉末尾的换行
  if (streamContent.endsWith('\r\n')) streamContent = streamContent.slice(0, -2);
  else if (streamContent.endsWith('\n')) streamContent = streamContent.slice(0, -1);

  const prevObj = content.substring(Math.max(0, match.index - 300), match.index);

  console.log(`--- 流 ${++streamIndex} ---`);

  // 检查是否使用了 FlateDecode 压缩
  if (prevObj.includes('FlateDecode')) {
    console.log('压缩方式：FlateDecode');

    try {
      // 将二进制字符串转换为 Buffer
      const buffer = Buffer.from(streamContent, 'binary');
      const uncompressed = zlib.inflateRawSync(buffer);
      const decoded = uncompressed.toString('binary');

      console.log('解压后大小:', uncompressed.length, 'bytes');
      console.log('解压后内容预览:');
      console.log(decoded.substring(0, 1000));

      // 查找文本操作符
      const tjMatches = [...decoded.matchAll(/\[([^\]]+)\]\s*TJ/gi)];
      const tjMatches2 = [...decoded.matchAll(/([\d.]+)\s*Tj/gi)];

      console.log('\nTJ 操作符:', tjMatches.length);
      console.log('Tj 操作符:', tjMatches2.length);

      if (tjMatches.length > 0) {
        console.log('\nTJ 参数:');
        tjMatches.forEach((m, i) => {
          console.log(`  ${i + 1}:`, m[1]);
        });
      }

    } catch (e) {
      console.log('解压失败:', e.message);
    }
  }

  console.log('');
}

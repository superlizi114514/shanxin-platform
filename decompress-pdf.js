const fs = require('fs');
const zlib = require('zlib');

// 读取 PDF
const f = fs.readdirSync('.').find(x => x.includes('李涵') && x.endsWith('.pdf'));
const pdf = fs.readFileSync(f);
console.log('PDF size:', pdf.length);

// 查找 FlateDecode 流
const streamStart = pdf.indexOf('stream');
const streamEnd = pdf.indexOf('endstream');

if (streamStart > 0 && streamEnd > streamStart) {
  console.log('Found stream at', streamStart, 'to', streamEnd);

  // 提取流数据（跳过 "stream\n"）
  const streamData = pdf.slice(streamStart + 8, streamEnd - 1);
  console.log('Stream size:', streamData.length);

  try {
    const decompressed = zlib.inflateSync(streamData);
    const text = decompressed.toString('utf-8');
    console.log('\n=== Decompressed content ===');
    console.log(text);
    console.log('\n=== Keywords ===');
    console.log('Contains 课表:', text.includes('课表'));
    console.log('Contains ☆:', text.includes('☆'));
    console.log('Contains 大学英语:', text.includes('大学英语'));
    console.log('Contains K4405:', text.includes('K4405'));
  } catch (e) {
    console.log('Decompression failed:', e.message);
    console.log('Stream preview (hex):', streamData.slice(0, 50).toString('hex'));
  }
}

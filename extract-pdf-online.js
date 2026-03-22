// 使用免费在线 API 提取 PDF 文本
const fs = require('fs');
const https = require('https');

async function extractPDFText(pdfPath) {
  // 方案 1: 使用 extractpdftext.com (在线工具，需要上传)
  // 方案 2: 使用 pdftextextractor.com

  console.log('Reading PDF...');
  const buffer = fs.readFileSync(pdfPath);
  console.log('PDF size:', buffer.length, 'bytes');

  // 使用 pdftextextractor.com API
  // 注意：这是一个简单的示例，实际 API 可能需要不同的调用方式
  console.log('\n尝试使用在线 API 提取文本...');

  // 由于免费 API 通常需要上传文件，我们使用另一种方法
  // 调用 extractpdftext.com 的在线服务
  console.log('\n建议方案:');
  console.log('1. 访问 https://extractpdftext.com/ 上传 PDF');
  console.log('2. 访问 https://pdftextextractor.com/ 在线提取');
  console.log('3. 使用 iLovePDF API: https://api.ilovepdf.com/');

  // 显示 PDF 文件基本信息
  console.log('\nPDF 文件信息:');
  console.log('- 文件名:', pdfPath);
  console.log('- 大小:', buffer.length, 'bytes');
  console.log('- PDF 签名:', buffer.slice(0, 8).toString('latin1'));
}

// 查找 PDF 文件
const f = fs.readdirSync('.').find(x => x.includes('李涵') && x.endsWith('.pdf'));
if (f) {
  extractPDFText(f).catch(console.error);
} else {
  console.log('未找到 PDF 文件');
}

// 使用 pdf-parse v2.x 测试 - 检查 API
const fs = require('fs');
const { PDFParse } = require('pdf-parse');

async function testParse() {
  const files = fs.readdirSync('.').filter(f => f.includes('李涵') && f.endsWith('.pdf'));

  if (files.length === 0) {
    console.log('No PDF files found');
    return;
  }

  const pdfPath = files[0];
  console.log('Reading PDF:', pdfPath);

  const buffer = fs.readFileSync(pdfPath);
  console.log('PDF size:', buffer.length, 'bytes');

  try {
    const pdfDoc = new PDFParse(buffer);

    // 等待文档加载
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('After wait - pdfDoc.doc:', pdfDoc.doc);
    console.log('After wait - pdfDoc.progress:', pdfDoc.progress);

    // 尝试不同的 API
    if (pdfDoc.doc && pdfDoc.doc.promise) {
      const data = await pdfDoc.doc.promise;
      console.log('Data from doc.promise:', data);
    }

    // 或者直接访问
    console.log('\nChecking for text content...');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testParse();

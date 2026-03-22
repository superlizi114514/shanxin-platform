// 测试 PDF 导入 API
const fs = require('fs');
const path = require('path');

async function testPdfImport() {
  // 查找 PDF 文件
  const pdfFile = fs.readdirSync('.').find(f => f.includes('李涵') && f.endsWith('.pdf'));
  if (!pdfFile) {
    console.log('未找到 PDF 文件');
    return;
  }

  console.log('使用文件:', pdfFile);

  // 读取 PDF
  const pdfBuffer = fs.readFileSync(pdfFile);

  // 创建 FormData
  const formData = new FormData();
  const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
  formData.append('file', blob, pdfFile);

  try {
    console.log('发送请求到 /api/courses/import...');
    const response = await fetch('http://localhost:3016/api/courses/import', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    console.log('响应状态:', response.status);
    console.log('响应结果:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('请求失败:', error.message);
  }
}

testPdfImport();

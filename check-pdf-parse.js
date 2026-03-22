// 检查 pdf-parse 模块导出
const pdfParse = require('pdf-parse');
console.log('pdf-parse exports:', Object.keys(pdfParse));
console.log('pdfParse:', pdfParse);
console.log('typeof pdfParse:', typeof pdfParse);
console.log('pdfParse.default:', pdfParse.default);

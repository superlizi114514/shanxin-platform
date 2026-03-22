const fs = require('fs');
const path = require('path');

const cmapPath = path.join(process.cwd(), 'cmaps/');
console.log('cmapPath:', cmapPath);

// 尝试不同的 URL 格式
const urls = [
  'file:///' + cmapPath.replace(/\\/g, '/'),
  cmapPath.replace(/\\/g, '/') + '/',
  'file://' + cmapPath.replace(/\\/g, '/'),
];

console.log('尝试不同的 URL 格式:');
urls.forEach((url, i) => {
  console.log(i + 1, ':', url);
});

// 检查 CMap 文件
const cmapFile = path.join(cmapPath, 'UniGB-UCS2-H.bcmap');
console.log('CMap 文件路径:', cmapFile);
console.log('CMap 文件存在:', fs.existsSync(cmapFile));
if (fs.existsSync(cmapFile)) {
  const stat = fs.statSync(cmapFile);
  console.log('CMap 文件大小:', stat.size, 'bytes');
}

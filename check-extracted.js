const fs = require('fs');
const path = require('path');

const baseDir = path.join(process.cwd(), 'sucai/');
const files = fs.readdirSync(baseDir);
console.log('文件列表:', files);

// 读取所有 txt 文件
files.filter(f => f.endsWith('.txt')).forEach(f => {
  console.log('\n=== ' + f + ' ===');
  const content = fs.readFileSync(baseDir + f, 'utf-8');
  console.log(content);
});

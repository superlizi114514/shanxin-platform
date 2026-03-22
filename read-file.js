const fs = require('fs');

// 直接读取目录
const files = fs.readdirSync('.').filter(f => f.includes('李涵'));
console.log('Files with 李涵:', files);

// 尝试读取每个文件
for (const file of files) {
  if (file.endsWith('.txt')) {
    console.log(`\n=== ${file} ===`);
    try {
      const content = fs.readFileSync(file, 'utf-8');
      console.log(content.substring(0, 1000));
    } catch (e) {
      console.log('Error:', e.message);
    }
  }
}

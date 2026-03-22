const fs = require('fs');

// 读取 PDF
const f = fs.readdirSync('.').find(x => x.includes('李涵') && x.endsWith('.pdf'));
const pdf = fs.readFileSync(f);

// 查找所有 Tj 操作符（文本显示）
const text = pdf.toString('latin1');
const tjRegex = /\[(.*?)\]\s*Tj/g;
let match;
let found = false;

console.log('Searching for Tj operators...\n');

while ((match = tjRegex.exec(text)) !== null) {
  found = true;
  console.log('Found Tj:', match[1]);
}

if (!found) {
  console.log('No Tj operators found.');
}

// 也查找 BT/ET 块
const btRegex = /BT(.*?)ET/gs;
let btMatch;
let btCount = 0;

console.log('\nSearching for BT/ET blocks...\n');

while ((btMatch = btRegex.exec(text)) !== null) {
  btCount++;
  const content = btMatch[1];
  if (content.length > 10) {
    console.log(`BT block ${btCount}:`, content.substring(0, 200).replace(/\n/g, '\\n'));
  }
}

console.log('\nTotal BT/ET blocks:', btCount);

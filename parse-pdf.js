const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function parsePDF() {
  try {
    const sucaiDir = path.join(__dirname, 'sucai');
    const files = fs.readdirSync(sucaiDir).filter(f => f.endsWith('.pdf'));
    console.log('Files found:', files);

    if (files.length === 0) {
      console.log('No PDF found');
      return;
    }

    const pdfFile = files[0];
    const pdfPath = path.join(sucaiDir, pdfFile);
    const outPath = path.join(__dirname, 'parsed-text-pdftotext.txt');

    console.log('Reading:', pdfFile);

    // 使用 pdftotext 提取文本
    try {
      const result = execSync(`pdftotext -layout "${pdfPath}" "${outPath}"`, {
        encoding: 'utf-8',
        stdio: 'pipe'
      });
      console.log('pdftotext result:', result);
    } catch (e) {
      console.log('pdftotext stderr:', e.message);
    }

    // 读取提取的文本
    if (fs.existsSync(outPath)) {
      const text = fs.readFileSync(outPath, 'utf-8');
      console.log('\n========== 原始文本 ==========');
      console.log(text);

      console.log('\n========== 包含"节"的行 ==========');
      const lines = text.split('\n');
      lines.forEach((line, i) => {
        if (line.includes('节') || line.includes('周') || line.includes('星期')) {
          console.log('Line', i + 1, ':', line);
        }
      });

      console.log('\n========== 包含☆的行 ==========');
      lines.forEach((line, i) => {
        if (line.includes('☆')) {
          console.log('Line', i + 1, ':', line);
        }
      });
    } else {
      console.log('pdftotext output not found');
    }

  } catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
  }
}

parsePDF();

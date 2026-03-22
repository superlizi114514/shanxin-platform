// 详细分析 PDF 文本格式
const { exec } = require('child_process');
const path = require('path');

async function analyzeFormat() {
  const pythonScript = path.join(process.cwd(), 'extract-pdf-json.py');
  const command = `python "${pythonScript}"`;

  const textResult = await new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve(JSON.parse(stdout.trim()));
    });
  });

  const text = textResult.text;
  const lines = text.split('\n');

  console.log('=== 完整文本（带行号）===\n');
  lines.forEach((line, i) => {
    const hasStar = line.includes('☆') ? ' [☆]' : '';
    const hasDay = line.match(/星期 [一二三四五六日]|周一 | 周二 | 周三 | 周四 | 周五 | 周六 | 周日/) ? ' [DAY]' : '';
    console.log(`${i.toString().padStart(2)}${hasDay}${hasStar}: ${line}`);
  });

  // 分析课程块结构
  console.log('\n=== 课程块分析 ===\n');

  // 找到所有带☆的行
  const starLines = [];
  lines.forEach((line, i) => {
    if (line.includes('☆')) {
      starLines.push({ index: i, text: line });
    }
  });

  console.log(`找到 ${starLines.length} 个包含☆的行`);
  starLines.forEach(({ index, text }) => {
    console.log(`\n行${index}: ${text.substring(0, 80)}...`);
    // 查看下一行
    if (lines[index + 1]) {
      console.log(`  下一行${index + 1}: ${lines[index + 1].substring(0, 80)}...`);
    }
  });
}

analyzeFormat().catch(console.error);

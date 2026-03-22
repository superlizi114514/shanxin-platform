// 查看原始文本结构
const { exec } = require('child_process');
const path = require('path');

async function inspectText() {
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

  console.log('=== 查找详情行模式 ===\n');

  // 查找包含 (和/的行
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('(') && line.includes('节') && line.includes('/')) {
      console.log(`行${i}: ${line.substring(0, 100)}`);
    }
  }

  // 查找包含"教室/"的行
  console.log('\n=== 包含"教室/"的行 ===\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('教室/') || line.includes('合堂/')) {
      console.log(`行${i}: ${line.substring(0, 100)}`);
    }
  }

  // 查看包含"周/"的行
  console.log('\n=== 包含"周/"的行 ===\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('周/') && line.length > 20) {
      console.log(`行${i}: ${line.substring(0, 100)}`);
    }
  }
}

inspectText().catch(console.error);

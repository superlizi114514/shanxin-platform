// 测试完整解析流程
const { exec } = require('child_process');
const path = require('path');

async function testFullParse() {
  // 1. 先用 Python 提取文本
  const pythonScript = path.join(process.cwd(), 'extract-pdf-json.py');
  const command = `python "${pythonScript}"`;

  console.log('=== 步骤 1: Python 提取文本 ===');

  const textResult = await new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(JSON.parse(stdout.trim()));
    });
  });

  if (!textResult.success) {
    console.log('Python 提取失败:', textResult.error);
    return;
  }

  const text = textResult.text;
  console.log('提取文本长度:', text.length);
  console.log('文本预览:');
  console.log(text.substring(0, 1000));

  // 2. 测试解析逻辑
  console.log('\n=== 步骤 2: 测试解析课程 ===');

  // 查找所有带☆的课程
  const courseMatches = text.match(/([^\n(]+?) ☆/g);
  console.log('找到☆课程数量:', courseMatches?.length || 0);
  if (courseMatches) {
    console.log('课程列表:');
    courseMatches.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.replace('☆', '').trim()}`);
    });
  }

  // 3. 逐行分析格式
  console.log('\n=== 步骤 3: 分析格式 ===');
  const lines = text.split('\n');
  console.log('总行数:', lines.length);

  // 查找星期几的行
  lines.forEach((line, i) => {
    if (line.includes('星期一') || line.includes('周一')) {
      console.log(`行${i}: 表头 - ${line.substring(0, 100)}`);
    }
  });

  // 查找节次行
  lines.forEach((line, i) => {
    if (line.match(/^\d+$/) || line.includes('节')) {
      console.log(`行${i}: ${line.substring(0, 100)}`);
    }
  });
}

testFullParse().catch(console.error);

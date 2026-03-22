// 测试 Node.js 调用 Python 脚本
const { exec } = require('child_process');
const path = require('path');

const pythonScript = path.join(process.cwd(), 'extract-pdf-json.py');
const command = `python "${pythonScript}"`;

console.log('Running:', command);

exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
  if (error) {
    console.error('Error:', error.message);
    return;
  }

  try {
    const result = JSON.parse(stdout.trim());
    if (result.success) {
      console.log('Success! Text length:', result.text.length);
      console.log('First 200 chars:', result.text.substring(0, 200));
    } else {
      console.error('Python script error:', result.error);
    }
  } catch (e) {
    console.error('JSON parse error:', e.message);
    console.error('stdout:', stdout.substring(0, 500));
  }
});

// 新课程表解析器 - 支持横向表格格式
const { exec } = require('child_process');
const path = require('path');

async function parseSchedule() {
  const pythonScript = path.join(process.cwd(), 'extract-pdf-json.py');
  const command = `python "${pythonScript}"`;

  const textResult = await new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve(JSON.parse(stdout.trim()));
    });
  });

  if (!textResult.success) {
    console.log('Python 提取失败:', textResult.error);
    return;
  }

  const text = textResult.text;
  const lines = text.split('\n');

  console.log('=== 解析山东信息职业技术学院课表 ===\n');

  // 星期映射
  const dayMap = {
    '星期一': 1, '星期二': 2, '星期三': 3, '星期四': 4,
    '星期五': 5, '星期六': 6, '星期日': 7
  };

  const courses = [];

  // 1. 找到表头行（包含星期一、二等）
  let headerLineIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('星期一') && lines[i].includes('节次')) {
      headerLineIndex = i;
      console.log('找到表头行:', i);
      break;
    }
  }

  if (headerLineIndex < 0) {
    console.log('未找到表头行');
    return;
  }

  // 2. 按节次分组解析
  // 格式：节次行 -> 课程名行 -> 详情行（多行）
  let i = headerLineIndex + 1;
  let currentPeriod = null;

  while (i < lines.length) {
    const line = lines[i];

    // 检测节次行（单独的数字 1-10）
    const periodMatch = line.match(/^\s*(\d+)\s*$/);
    if (periodMatch) {
      currentPeriod = periodMatch[1];
      console.log(`\n=== 节次 ${currentPeriod} ===`);
      i++;
      continue;
    }

    // 检测课程名行（包含多个☆，横向排列）
    if (line.includes('☆') && currentPeriod) {
      // 分割课程名
      const courseNames = line.split(/\s+/).filter(s => s.trim());
      console.log(`课程名：${courseNames.length} 个`);

      // 收集详情行（直到下一个节次或空行）
      let detailLines = [];
      let j = i + 1;
      while (j < lines.length && !lines[j].match(/^\s*\d+\s*$/)) {
        // 检查是否下一节课的开始
        if (j > i + 10) break; // 防止收集太多
        detailLines.push(lines[j]);
        j++;
      }

      // 将详情合并
      const fullDetail = detailLines.join(' ');
      console.log(`详情长度：${fullDetail.length}`);

      // 按☆分割课程
      const courseChunks = line.split(/(?=([^\s]+☆))/).filter(s => s.trim() && s.includes('☆'));

      courseChunks.forEach((chunk, idx) => {
        const courseName = chunk.replace('☆', '').trim();
        if (!courseName) return;

        console.log(`  - ${courseName}`);

        // 从详情中提取信息（按列位置）
        // 简单方法：查找包含课程名的详情块
        const detailPattern = new RegExp(`\\((\\d+)-(\\d+) 节\\)([^/]+)\\/([^/]+)\\/([^/\\s]+)`, 'g');
        const matches = [...fullDetail.matchAll(detailPattern)];

        if (matches.length > idx) {
          const m = matches[idx];
          console.log(`    节次：${m[1]}-${m[2]}, 周次：${m[3].substring(0, 20)}, 教室：${m[4]}`);
        }
      });

      i = j;
      continue;
    }

    i++;
  }

  console.log('\n\n解析完成！');
}

parseSchedule().catch(console.error);

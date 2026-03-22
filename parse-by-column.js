// 按列宽解析 - 最终最终版
const { exec } = require('child_process');
const path = require('path');

async function parseByColumnWidth() {
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

  console.log('=== 按列宽解析 ===\n');

  // 观察原始文本：
  // 行 4: 大学英语 D2☆ 高等数学 C2☆ Web前端开发☆ 形势与政策 2☆ 高等数学 C2☆
  // 每列大约占 50-60 字符宽度

  // 策略：对于每个包含多个☆的行，按☆分割后，
  // 对于每个课程，收集它"下方"的详情（同一列位置）

  const courses = [];
  let currentPeriod = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 检测节次行
    if (/^\s*\d+\s*$/.test(line)) {
      currentPeriod = line.trim();
      continue;
    }

    // 课程名行：包含多个☆，但不是详情行
    if (line.includes('☆') && currentPeriod && !line.trim().startsWith('(') && line.split('☆').length <= 7) {
      const courseNames = line.split('☆').filter(p => p.trim());

      console.log(`\n节次${currentPeriod}: ${courseNames.length} 门课程`);

      // 对于每个课程名，收集它"下方"的详情
      courseNames.forEach((namePart, colIdx) => {
        const courseName = namePart.trim();
        if (courseName.length < 2 || courseName.length > 30) return;

        // 收集下方 3-5 行中对应列的内容
        let detailText = '';
        for (let j = 1; j <= 5 && i + j < lines.length; j++) {
          const nextLine = lines[i + j];
          if (/^\s*\d+\s*$/.test(nextLine)) break; // 下一个节次

          // 按大致列宽分割
          const colWidth = Math.floor(nextLine.length / Math.max(courseNames.length, 1));
          const start = colIdx * colWidth;
          const end = Math.min(start + colWidth, nextLine.length);
          detailText += nextLine.substring(start, end) + ' ';
        }

        // 解析详情：(节次) 周次/教室/教师
        const detailMatch = detailText.match(/\((\d+)-(\d+) 节\)([^/]+)\/([^/]+)\/([^/]+)/);

        let weekRange = '', classroom = '', teacher = '';
        if (detailMatch) {
          weekRange = detailMatch[3].trim();
          classroom = detailMatch[4].trim();
          teacher = detailMatch[5].trim();
        }

        courses.push({
          name: courseName,
          period: currentPeriod,
          weekRange,
          classroom,
          teacher
        });

        console.log(`  ${courseName} | ${weekRange.substring(0, 20)} | ${classroom} | ${teacher}`);
      });
    }
  }

  console.log(`\n\n共解析 ${courses.length} 门课程`);

  // 输出有效课程（有教室和教师的）
  const validCourses = courses.filter(c => c.classroom && c.teacher);
  console.log(`有效课程：${validCourses.length} 门`);

  return validCourses;
}

parseByColumnWidth().catch(console.error);

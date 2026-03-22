// 真正的按列解析器 - 横向表格格式
const { exec } = require('child_process');

async function parseRealColumns() {
  const command = `python extract-pdf-json.py`;

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

  console.log('=== 真正的按列解析器 ===\n');

  const courses = [];
  let currentPeriod = null;
  let courseNamesLine = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 检测节次行
    if (/^\d+$/.test(line.trim())) {
      currentPeriod = parseInt(line.trim());
      courseNamesLine = null;
      continue;
    }

    // 检测课程名行（包含☆，但不是详情行）
    if (line.includes('☆') && currentPeriod && !line.trim().startsWith('(')) {
      courseNamesLine = line;
      continue;
    }

    // 检测详情块开始（包含 (X-Y 节) 的行）
    if (line.includes('(') && line.includes('节)') && currentPeriod && courseNamesLine) {
      // 收集后续 5 行详情
      const detailLines = [];
      for (let j = 0; j < 6 && i + j < lines.length; j++) {
        const nextLine = lines[i + j];
        if (/^\d+$/.test(nextLine.trim())) break;
        if (nextLine.includes('☆') && !nextLine.trim().startsWith('(')) break;
        detailLines.push(nextLine);
      }

      // 解析课程名
      const courseNames = courseNamesLine.split('☆').filter(p => p.trim() && p.length >= 2 && p.length <= 40);
      const numCols = courseNames.length;

      console.log(`\n节次${currentPeriod}: ${numCols} 门课程`);
      console.log(`  课程名：${courseNames.join(', ')}`);

      // 拼接所有详情行
      const fullDetail = detailLines.join(' ');
      const totalLength = fullDetail.length;
      const colWidth = Math.ceil(totalLength / numCols);

      // 对每列提取详情
      for (let colIdx = 0; colIdx < numCols; colIdx++) {
        const start = colIdx * colWidth;
        const end = Math.min(start + colWidth, totalLength);
        const colText = fullDetail.substring(start, end);

        // 从列文本中提取课程信息
        // 格式：(X-Y 节) 周次/教室/教师
        const match = colText.match(/\((\d+)-(\d+) 节\)([\d\-周，,双单()]+?)\/([Kk]\d+[^/]*?)\/([^/;\n]+)/);

        if (match) {
          const weekRange = match[3].trim();
          const classroom = match[4].trim().replace(/(教室 | 合堂 | 公共 | 中心 | 微机室 | 网络空间)/g, '').trim();
          const teacher = match[5].trim().split(/[;/]/)[0].trim();

          courses.push({
            name: courseNames[colIdx],
            period: currentPeriod,
            dayOfWeek: colIdx + 1,
            startPeriod: match[1],
            endPeriod: match[2],
            weekRange: weekRange.substring(0, 50),
            classroom: classroom.substring(0, 30),
            teacher: teacher.substring(0, 20)
          });

          console.log(`  ✓ [星期${colIdx + 1}] ${courseNames[colIdx]}: (${match[1]}-${match[2]}节) ${classroom} ${teacher}`);
        } else {
          console.log(`  ✗ [星期${colIdx + 1}] ${courseNames[colIdx]}: 未解析`);
        }
      }

      // 跳过已处理的详情行
      i += detailLines.length - 1;
    }
  }

  console.log(`\n\n=== 结果 ===`);
  console.log(`共解析 ${courses.length} 门课程`);

  const validCourses = courses.filter(c => c.classroom && c.teacher);
  console.log(`有效课程：${validCourses.length} 门`);

  if (validCourses.length > 0) {
    console.log('\n课程列表:');
    validCourses.forEach((c, i) => {
      console.log(`${i + 1}. ${c.name} | 星期${c.dayOfWeek} 节${c.startPeriod}-${c.endPeriod} | ${c.weekRange.substring(0, 20)} | ${c.classroom} | ${c.teacher}`);
    });
  }

  return courses;
}

parseRealColumns().catch(console.error);

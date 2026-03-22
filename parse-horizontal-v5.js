// 横向表格解析器 - V5 最终版
const { exec } = require('child_process');

async function parseHorizontalTableV5() {
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

  console.log('=== 横向表格解析器 V5 ===\n');

  const courses = [];
  let currentPeriod = null;
  let pendingCourseNames = [];
  let processedForPeriod = false;

  // Unicode 安全的正则
  const periodPattern = /\((\d+)-(\d+)\s*\u8282\)/;
  const periodPatternGlobal = /\((\d+)-(\d+)\s*\u8282\)/g;

  // 详情解析正则：(X-Y 节) 周次 (可选/) 教室/教师
  const detailPattern = /\((\d+)-(\d+)\s*\u8282\)([^/]+?)\s*\/?(K\d+[^/]*?)\/([^/\s]+)/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 检测节次行
    if (/^\d+$/.test(line.trim())) {
      currentPeriod = parseInt(line.trim());
      pendingCourseNames = [];
      processedForPeriod = false;
      console.log(`\n=== 节次 ${currentPeriod} ===`);
      continue;
    }

    // 检测课程名行
    if (line.includes('\u2606') && currentPeriod && !periodPattern.test(line)) {
      const names = line.split('\u2606').filter(p => p.trim() && p.length >= 2 && p.length <= 40);
      const validNames = names.filter(n => !n.includes('(') && !n.includes('/') && !n.includes('\u5468'));

      if (validNames.length > 0) {
        pendingCourseNames = validNames;
        console.log(`课程名：${validNames.join(', ')}`);
      }
      continue;
    }

    // 检测详情行开始
    if (currentPeriod && pendingCourseNames.length > 0 && !processedForPeriod && periodPattern.test(line)) {
      // 找到所有节次模式的位置
      const firstMatches = [...line.matchAll(periodPatternGlobal)];
      const positions = firstMatches.map(m => m.index);
      const numCols = positions.length;

      console.log(`详情列数：${numCols}`);

      if (numCols === pendingCourseNames.length) {
        // 收集后续 5 行详情
        const detailLines = [];
        for (let j = 0; j < 6 && i + j < lines.length; j++) {
          const nextLine = lines[i + j];
          if (/^\d+$/.test(nextLine.trim())) break;
          if (nextLine.includes('\u2606') && !periodPattern.test(nextLine)) break;
          detailLines.push(nextLine);
        }

        // 计算每列的宽度（从第一行详情）
        const colWidths = [];
        for (let col = 0; col < numCols; col++) {
          const start = positions[col];
          const end = (col < numCols - 1) ? positions[col + 1] : line.length;
          colWidths.push(end - start);
        }

        // 按列拼接详情
        const colContents = new Array(numCols).fill('');
        for (const dl of detailLines) {
          for (let col = 0; col < numCols; col++) {
            const start = positions[col];
            const end = Math.min(start + colWidths[col], dl.length);
            if (start < dl.length) {
              colContents[col] += dl.substring(start, end);
            }
          }
        }

        // 对每列解析详情
        for (let colIdx = 0; colIdx < numCols; colIdx++) {
          const colText = colContents[colIdx];
          const match = colText.match(detailPattern);

          if (match) {
            const weekRange = match[3].trim();
            const classroom = match[4].trim().replace(/(教室 | 合堂 | 公共 | 中心 | 微机室 | 网络空间)/g, '').trim();
            // 教师名字：只提取中文字符，忽略后面的数字和字母
            const teacherMatch = match[5].trim().match(/^([\\u4e00-\\u9fa5]{2,4})/);
            const teacher = teacherMatch ? teacherMatch[1] : match[5].trim().split(/[;/]/)[0];

            courses.push({
              name: pendingCourseNames[colIdx],
              period: currentPeriod,
              dayOfWeek: colIdx + 1,
              startPeriod: match[1],
              endPeriod: match[2],
              weekRange: weekRange.substring(0, 50),
              classroom: classroom.substring(0, 30),
              teacher: teacher.substring(0, 20)
            });

            console.log(`  ✓ ${pendingCourseNames[colIdx]}: (${match[1]}-${match[2]}节) ${classroom} ${teacher}`);
          } else {
            console.log(`  ✗ ${pendingCourseNames[colIdx]}: 未解析`);
          }
        }

        processedForPeriod = true;
        i += detailLines.length - 1;
      }
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

parseHorizontalTableV5().catch(console.error);

// 按列位置解析 - 分析课表结构
const { exec } = require('child_process');

async function parseByColumnPosition() {
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

  console.log('=== 按列位置解析 ===\n');

  // 观察：每行大约 97 字符，7 列（星期一到日），每列约 13-14 字符
  // 行 4: 课程名行
  // 行 5-10: 详情行（跨 6 行）

  const courses = [];

  // 第一步：找到所有"时间段"行（数字 1,2,3...）
  const periods = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^\d+$/.test(line) && parseInt(line) <= 12) {
      periods.push({ period: parseInt(line), lineIndex: i });
    }
  }

  console.log(`找到 ${periods.length} 个节次标记\n`);

  // 对每个节次，解析后面的课程
  for (const periodInfo of periods) {
    const periodNum = periodInfo.period;
    const startIndex = periodInfo.lineIndex + 1;

    console.log(`\n=== 节次 ${periodNum} ===`);

    // 找到课程名行（包含☆）
    let courseNameLine = null;
    let courseNameLineIdx = -1;
    for (let i = startIndex; i < Math.min(startIndex + 3, lines.length); i++) {
      if (lines[i].includes('☆')) {
        courseNameLine = lines[i];
        courseNameLineIdx = i;
        break;
      }
    }

    if (!courseNameLine) {
      console.log('  未找到课程名行');
      continue;
    }

    console.log(`课程名行：${courseNameLine.substring(0, 80)}...`);

    // 分割课程名，记录每个课程的列位置
    const starPositions = [];
    for (let i = 0; i < courseNameLine.length; i++) {
      if (courseNameLine[i] === '☆') {
        starPositions.push(i);
      }
    }

    const courseNames = [];
    let lastPos = 0;
    for (const starPos of starPositions) {
      const name = courseNameLine.substring(lastPos, starPos).trim();
      if (name.length >= 2 && name.length <= 40) {
        courseNames.push({
          name,
          start: lastPos,
          end: starPos
        });
      }
      lastPos = starPos + 1;
    }

    console.log(`  找到 ${courseNames.length} 门课程:`);
    courseNames.forEach(c => {
      console.log(`    - "${c.name}" (位置 ${c.start}-${c.end})`);
    });

    // 收集后续详情行（最多 10 行）
    const detailLines = [];
    for (let i = courseNameLineIdx + 1; i < Math.min(courseNameLineIdx + 12, lines.length); i++) {
      const nextLine = lines[i];
      // 遇到下一个节次或课程名行就停止
      if (/^\d+$/.test(nextLine.trim())) break;
      if (nextLine.includes('☆') && !nextLine.trim().startsWith('(')) break;
      detailLines.push(nextLine);
    }

    console.log(`  收集到 ${detailLines.length} 行详情`);

    // 对每个课程，从详情行中提取对应列的内容
    const totalCols = courseNames.length;
    if (totalCols === 0) continue;

    // 计算每列的宽度
    const lineLength = courseNameLine.length;
    const colWidth = lineLength / totalCols;

    for (let colIdx = 0; colIdx < totalCols; colIdx++) {
      const course = courseNames[colIdx];

      // 从详情行中提取这个列的内容
      let colDetail = '';
      for (const dl of detailLines) {
        const start = Math.floor(course.start);
        const end = Math.min(Math.floor(course.start + colWidth), dl.length);
        if (start < dl.length) {
          colDetail += dl.substring(start, end) + ' ';
        }
      }

      // 解析详情：(X-Y 节) 周次/教室/教师
      const match = colDetail.match(/\((\d+)-(\d+) 节\)([^/]+?)\/([^/]+?)\/([^/\n]+)/);

      if (match) {
        const weekRange = match[3].trim();
        const classroom = match[4].trim().replace(/(教室 | 合堂 | 公共 | 中心 | 微机室 | 网络空间)/g, '');
        const teacher = match[5].trim().split(/[;/]/)[0];

        courses.push({
          name: course.name,
          period: periodNum,
          dayOfWeek: colIdx + 1,
          startPeriod: match[1],
          endPeriod: match[2],
          weekRange: weekRange.substring(0, 50),
          classroom: classroom.substring(0, 30),
          teacher: teacher.substring(0, 20)
        });

        console.log(`  ✓ [星期${colIdx + 1}] ${course.name}: 节${match[1]}-${match[2]} ${classroom} ${teacher}`);
      } else {
        // 尝试更宽松的正则
        const looseMatch = colDetail.match(/\((\d+)-(\d+) 节\)/);
        if (looseMatch) {
          console.log(`  ~ [星期${colIdx + 1}] ${course.name}: 找到节次但详情不完整`);
        } else {
          console.log(`  ✗ [星期${colIdx + 1}] ${course.name}: 未解析`);
        }
      }
    }
  }

  console.log(`\n\n=== 结果 ===`);
  console.log(`共解析 ${courses.length} 门课程`);

  // 显示有效课程
  const validCourses = courses.filter(c => c.classroom && c.teacher);
  console.log(`有效课程（有教室和教师）：${validCourses.length} 门`);

  if (validCourses.length > 0) {
    console.log('\n课程列表:');
    validCourses.forEach((c, i) => {
      console.log(`${i + 1}. ${c.name} | 星期${c.dayOfWeek} 节${c.startPeriod}-${c.endPeriod} | ${c.weekRange.substring(0, 20)} | ${c.classroom} | ${c.teacher}`);
    });
  }

  return courses;
}

parseByColumnPosition().catch(console.error);

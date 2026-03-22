// 横向表格解析器 - 按列位置分割
const { exec } = require('child_process');
const path = require('path');

async function parseHorizontalTable() {
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

  console.log('=== 横向表格解析器 ===\n');

  const courses = [];
  let currentPeriod = null;
  let pendingCourseNames = null;
  let pendingPeriod = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLen = line.length;

    // 检测节次行（单独的数字）
    if (/^\s*\d+\s*$/.test(line)) {
      currentPeriod = line.trim();
      continue;
    }

    // 检测课程名行：包含☆，☆数量<=7，不是详情行
    if (line.includes('☆') && currentPeriod && !line.trim().startsWith('(')) {
      const starCount = (line.match(/☆/g) || []).length;
      if (starCount > 7) continue;

      // 分割课程名
      const parts = line.split('☆');
      const courseNames = [];

      // 计算每个课程的列位置（起始和结束索引）
      let lastIdx = 0;
      for (let j = 0; j < Math.min(starCount, parts.length); j++) {
        const starIdx = line.indexOf('☆', lastIdx);
        if (starIdx < 0) break;

        // 找到这个☆对应的课程名（☆前面的内容）
        let nameStart = lastIdx;
        while (nameStart < starIdx && line[nameStart] === ' ') nameStart++;

        const name = line.substring(nameStart, starIdx).trim();
        if (name.length >= 2 && name.length <= 30) {
          courseNames.push({
            name: name,
            colStart: nameStart / lineLen, // 归一化到 0-1
            colEnd: starIdx / lineLen
          });
        }
        lastIdx = starIdx + 1;
      }

      console.log(`\n节次${currentPeriod}: ${courseNames.length} 门课程`);
      courseNames.forEach(c => console.log(`  - ${c.name} (位置${c.colStart.toFixed(2)}-${c.colEnd.toFixed(2)})`));

      // 保存待处理的课程名，用于匹配后续详情
      pendingCourseNames = courseNames;
      pendingPeriod = currentPeriod;

      // 收集后续 3-5 行详情
      const detailLines = [];
      for (let j = 1; j <= 5 && i + j < lines.length; j++) {
        const nextLine = lines[i + j];
        if (/^\s*\d+\s*$/.test(nextLine)) break;
        if (nextLine.includes('☆') && !nextLine.trim().startsWith('(')) break;
        detailLines.push(nextLine);
      }

      // 对每个课程，从详情行中提取对应列的内容
      courseNames.forEach((course, colIdx) => {
        let detailText = '';
        const totalCols = courseNames.length;
        const colWidth = 1 / totalCols;

        for (const dl of detailLines) {
          const start = Math.floor(course.colStart * dl.length);
          const end = Math.min(Math.floor((course.colStart + colWidth) * dl.length), dl.length);
          detailText += dl.substring(start, end) + ' ';
        }

        // 解析详情：(节次) 周次/教室/教师
        const detailMatch = detailText.match(/\((\d+)-(\d+) 节\)([^/\n]+?)\/([^/\n]+?)\/([^\n/]+)/);

        if (detailMatch) {
          const weekRange = detailMatch[3].trim();
          const classroom = detailMatch[4].trim().replace(/(教室 | 合堂 | 公共 | 中心 | 微机室)/g, '');
          const teacher = detailMatch[5].trim();

          courses.push({
            name: course.name,
            dayOfWeek: colIdx + 1, // 简化：假设从星期一开始
            startPeriod: detailMatch[1],
            endPeriod: detailMatch[2],
            weekRange: weekRange.substring(0, 40),
            classroom: classroom.substring(0, 20),
            teacher: teacher.substring(0, 20)
          });

          console.log(`  ✓ ${course.name}: 节${detailMatch[1]}-${detailMatch[2]} ${classroom} ${teacher}`);
        } else {
          console.log(`  ✗ ${course.name}: 未解析到详情`);
        }
      });
    }
  }

  console.log(`\n\n共解析 ${courses.length} 门课程`);
  return courses;
}

parseHorizontalTable().catch(console.error);

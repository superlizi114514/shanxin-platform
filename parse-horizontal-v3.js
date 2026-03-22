// 横向表格解析器 - V3 改进课程名检测
const { exec } = require('child_process');

async function parseHorizontalTableV3() {
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

  console.log('=== 横向表格解析器 V3 ===\n');

  const courses = [];
  let currentPeriod = null;
  let pendingCourseNames = [];
  let processedForPeriod = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 检测节次行
    if (/^\d+$/.test(line.trim())) {
      // 处理上一个节次未处理的情况
      if (currentPeriod && pendingCourseNames.length > 0 && !processedForPeriod) {
        console.log(`  节次${currentPeriod} 没有详情行`);
      }

      currentPeriod = parseInt(line.trim());
      pendingCourseNames = [];
      processedForPeriod = false;
      console.log(`\n=== 节次 ${currentPeriod} ===`);
      continue;
    }

    // 检测课程名行
    // 条件：包含☆，不包含 (X-Y 节) 模式，不是详情行
    if (line.includes('☆') && currentPeriod && !processedForPeriod &&
        !line.trim().startsWith('(') && !/\(\d+-\d+ 节\)/.test(line)) {

      const names = line.split('☆').filter(p => p.trim() && p.length >= 2 && p.length <= 40);
      // 验证课程名：不应该包含 (或) 或/或"周"
      const validNames = names.filter(n =>
        !n.includes('(') && !n.includes(')') && !n.includes('/') && !n.includes('周')
      );

      if (validNames.length > 0) {
        pendingCourseNames = validNames;
        console.log(`课程名：${validNames.join(', ')}`);
      }
      continue;
    }

    // 检测详情行开始
    if (currentPeriod && pendingCourseNames.length > 0 && !processedForPeriod && /\(\d+-\d+ 节\)/.test(line)) {
      // 找到所有 (X-Y 节) 的位置
      const positions = [];
      let idx = 0;
      while ((idx = line.indexOf('(', idx)) !== -1) {
        const match = line.substring(idx).match(/^\(\d+-\d+ 节\)/);
        if (match) {
          positions.push(idx);
        }
        idx++;
      }

      console.log(`详情列数：${positions.length}`);

      if (positions.length === pendingCourseNames.length) {
        // 收集后续 5 行详情
        const detailLines = [];
        for (let j = 0; j < 6 && i + j < lines.length; j++) {
          const nextLine = lines[i + j];
          if (/^\d+$/.test(nextLine.trim())) break;
          if (nextLine.includes('☆') && !nextLine.trim().startsWith('(')) break;
          detailLines.push(nextLine);
        }

        // 拼接所有详情行
        const fullDetail = detailLines.join(' ');

        // 对每个课程提取详情
        for (let colIdx = 0; colIdx < positions.length; colIdx++) {
          const start = positions[colIdx];
          const end = (colIdx < positions.length - 1) ? positions[colIdx + 1] : fullDetail.length;
          const colText = fullDetail.substring(start, end);

          // 解析详情 - 使用更宽松的正则
          // 格式：(X-Y 节) 周次/教室/教师
          const match = colText.match(/\((\d+)-(\d+) 节\)([\d\-周，,双单()]+?)\/([Kk]\d+[^\/\n;]+?)\/([^\/\n;]+)/);

          if (match) {
            const weekRange = match[3].trim();
            const classroom = match[4].trim().replace(/(教室 | 合堂 | 公共 | 中心 | 微机室 | 网络空间)/g, '').trim();
            const teacher = match[5].trim().split(/[;/]/)[0].trim();

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
            console.log(`  ✗ ${pendingCourseNames[colIdx]}: 未解析 (列文本：${colText.substring(0, 30)}...)`);
          }
        }

        processedForPeriod = true;
        i += detailLines.length - 1;
      } else if (positions.length > 0) {
        console.log(`  课程名数量 (${pendingCourseNames.length}) 与详情列数 (${positions.length}) 不匹配`);
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

parseHorizontalTableV3().catch(console.error);

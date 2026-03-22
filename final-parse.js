// 最终解析器 - 拼接详情后按列分割
const { exec } = require('child_process');
const path = require('path');

async function finalParser() {
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

  console.log('=== 最终解析器 ===\n');

  const courses = [];
  let currentPeriod = null;

  // 第一步：找到所有课程名行和对应的详情块
  const courseBlocks = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 检测节次行
    if (/^\s*\d+\s*$/.test(line)) {
      currentPeriod = line.trim();
      continue;
    }

    // 课程名行
    if (line.includes('☆') && currentPeriod && !line.trim().startsWith('(')) {
      const starCount = (line.match(/☆/g) || []).length;
      if (starCount > 7) continue;

      // 分割课程名
      const courseNames = line.split('☆').filter(p => p.trim() && p.length >= 2 && p.length <= 30);

      // 收集详情行（直到下一个节次或课程名行）
      const detailLines = [];
      for (let j = 1; j <= 6 && i + j < lines.length; j++) {
        const nextLine = lines[i + j];
        if (/^\s*\d+\s*$/.test(nextLine)) break;
        if (nextLine.includes('☆') && !nextLine.trim().startsWith('(')) break;
        detailLines.push(nextLine);
      }

      courseBlocks.push({
        period: currentPeriod,
        courseNames,
        detailLines,
        startLine: i
      });
    }
  }

  console.log(`找到 ${courseBlocks.length} 个课程块\n`);

  // 第二步：对每个块，拼接详情并按课程数分割
  courseBlocks.forEach((block, blockIdx) => {
    console.log(`块${blockIdx + 1} (节次${block.period}): ${block.courseNames.length} 门课程`);

    // 拼接所有详情行
    const fullDetail = block.detailLines.join(' ');

    // 按课程数分割详情
    const numCols = block.courseNames.length;
    if (numCols === 0) return;

    const chunkSize = Math.ceil(fullDetail.length / numCols);

    block.courseNames.forEach((name, colIdx) => {
      // 从这个课程的列位置提取详情
      const start = colIdx * chunkSize;
      const end = Math.min(start + chunkSize, fullDetail.length);
      const colDetail = fullDetail.substring(start, end);

      // 解析详情
      const match = colDetail.match(/\((\d+)-(\d+) 节\)([^/]+?)\/([^/]+?)\/([^\n/]+)/);

      if (match) {
        const weekRange = match[3].trim();
        const classroom = match[4].trim().replace(/(教室 | 合堂 | 公共 | 中心 | 微机室|网络空间安全培养中心与考试认证中心)/g, '');
        const teacher = match[5].trim();

        courses.push({
          name,
          period: block.period,
          dayOfWeek: colIdx + 1,
          startPeriod: match[1],
          endPeriod: match[2],
          weekRange: weekRange.substring(0, 40),
          classroom: classroom.substring(0, 20),
          teacher: teacher.split(/[-/]/)[0].substring(0, 15)
        });

        console.log(`  ✓ ${name}: 节${match[1]}-${match[2]} ${classroom} ${teacher}`);
      } else {
        console.log(`  ✗ ${name}: 未解析`);
      }
    });
  });

  console.log(`\n\n共解析 ${courses.length} 门课程`);

  // 显示结果
  if (courses.length > 0) {
    console.log('\n=== 课程列表 ===');
    courses.forEach((c, i) => {
      console.log(`${i + 1}. ${c.name} | 星期${c.dayOfWeek} 节${c.startPeriod}-${c.endPeriod} | ${c.classroom} | ${c.teacher}`);
    });
  }

  return courses;
}

finalParser().catch(console.error);

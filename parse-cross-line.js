// 跨行解析器 - 处理详情跨多行的情况
const { exec } = require('child_process');

async function parseCrossLine() {
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

  console.log('=== 跨行解析器 ===\n');

  const courses = [];
  let currentPeriod = null;
  let pendingCourseNames = [];
  let inDetailBlock = false;
  let detailBlockLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 检测节次行（单独的数字）
    if (/^\d+$/.test(line.trim())) {
      // 处理之前的详情块
      if (detailBlockLines.length > 0 && pendingCourseNames.length > 0) {
        parseDetailBlock(detailBlockLines, currentPeriod, pendingCourseNames, courses);
      }

      currentPeriod = parseInt(line.trim());
      pendingCourseNames = [];
      detailBlockLines = [];
      inDetailBlock = false;
      continue;
    }

    // 检测课程名行
    if (line.includes('☆') && currentPeriod && !line.trim().startsWith('(')) {
      // 处理之前的详情块
      if (detailBlockLines.length > 0 && pendingCourseNames.length > 0) {
        parseDetailBlock(detailBlockLines, currentPeriod, pendingCourseNames, courses);
      }
      detailBlockLines = [];

      const names = line.split('☆').filter(p => p.trim() && p.length >= 2 && p.length <= 40);
      pendingCourseNames = names;
      inDetailBlock = true;
      continue;
    }

    // 收集详情行
    if (inDetailBlock && line.length > 10) {
      detailBlockLines.push(line);
    }
  }

  // 处理最后一个详情块
  if (detailBlockLines.length > 0 && pendingCourseNames.length > 0) {
    parseDetailBlock(detailBlockLines, currentPeriod, pendingCourseNames, courses);
  }

  console.log(`\n\n=== 结果 ===`);
  console.log(`共解析 ${courses.length} 门课程`);

  const validCourses = courses.filter(c => c.classroom && c.teacher && c.name !== '未知');
  console.log(`有效课程：${validCourses.length} 门`);

  if (validCourses.length > 0) {
    console.log('\n课程列表:');
    validCourses.forEach((c, i) => {
      console.log(`${i + 1}. ${c.name} | 节${c.startPeriod}-${c.endPeriod} | ${c.weekRange.substring(0, 25)} | ${c.classroom} | ${c.teacher}`);
    });
  }

  return courses;
}

function parseDetailBlock(detailLines, period, courseNames, courses) {
  if (detailLines.length === 0 || courseNames.length === 0) return;

  // 拼接所有详情行
  const fullText = detailLines.join(' ');

  console.log(`\n节次${period}: ${courseNames.length} 门课程，${detailLines.length} 行详情`);

  // 使用正则匹配所有课程详情
  // 格式：(X-Y 节) 周次/教室/教师
  // 周次可能包含：1-2 周，4-6 周 (双),7-8 周
  const regex = /\((\d+)-(\d+) 节\)([\d\-周，,双单()]+?)\/([^/]+?)\/([^/;\n]+)/g;

  const matches = [...fullText.matchAll(regex)];
  console.log(`  正则匹配到 ${matches.length} 条详情`);

  for (let idx = 0; idx < matches.length; idx++) {
    const m = matches[idx];
    const courseName = courseNames[idx] || '未知';

    const weekRange = m[3].trim();
    const classroom = m[4].trim().replace(/(教室 | 合堂 | 公共 | 中心 | 微机室 | 网络空间)/g, '').trim();
    const teacher = m[5].trim().split(/[;/]/)[0].trim();

    courses.push({
      name: courseName,
      period: period,
      startPeriod: m[1],
      endPeriod: m[2],
      weekRange: weekRange.substring(0, 50),
      classroom: classroom.substring(0, 30),
      teacher: teacher.substring(0, 20)
    });

    console.log(`  ✓ ${courseName}: (${m[1]}-${m[2]}节) ${weekRange.substring(0, 20)} | ${classroom} | ${teacher}`);
  }
}

parseCrossLine().catch(console.error);

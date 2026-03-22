// 正则提取解析器 - 直接从文本中提取所有课程详情
const { exec } = require('child_process');

async function parseWithRegex() {
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

  console.log('=== 正则提取解析器 ===\n');

  // 策略：
  // 1. 找到所有课程名行（包含☆），提取课程名列表
  // 2. 找到所有详情块（节次行后的 6 行）
  // 3. 从详情块中用正则提取所有 (X-Y 节) 周次/教室/教师 模式
  // 4. 按顺序匹配课程名和详情

  const courses = [];
  let currentPeriod = null;
  let pendingCourseNames = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 检测节次行（单独的数字）
    if (/^\d+$/.test(line.trim())) {
      currentPeriod = parseInt(line.trim());
      pendingCourseNames = [];
      continue;
    }

    // 检测课程名行（包含☆，但详情行不以 ( 开头）
    if (line.includes('☆') && currentPeriod && !line.trim().startsWith('(')) {
      const names = line.split('☆').filter(p => p.trim() && p.length >= 2 && p.length <= 40);
      pendingCourseNames = names;
      console.log(`\n节次${currentPeriod}: 找到${names.length}门课程 - ${names.join(', ')}`);
      continue;
    }

    // 从详情行中提取课程信息
    if (line.includes('(') && line.includes('节)')) {
      // 使用正则匹配所有 (X-Y 节) 周次/教室/教师 模式
      // 放宽匹配条件
      const matches = [...line.matchAll(/\((\d+)-(\d+) 节\)([^/]+?)\/([^/]+?)\/([^/;\n]+)/g)];

      for (const m of matches) {
        const startPeriod = m[1];
        const endPeriod = m[2];
        let weekRange = m[3].trim();
        let classroom = m[4].trim();
        let teacher = m[5].trim();

        // 清理教室名
        classroom = classroom.replace(/(教室 | 合堂 | 公共 | 中心 | 微机室 | 网络空间)/g, '').trim();

        // 清理教师名（移除斜杠后的内容）
        teacher = teacher.split(/[;/]/)[0].trim();

        // 尝试匹配课程名
        let courseName = '未知';
        if (pendingCourseNames.length > 0) {
          // 按顺序分配课程名
          courseName = pendingCourseNames.shift();
        }

        courses.push({
          name: courseName,
          period: currentPeriod,
          startPeriod,
          endPeriod,
          weekRange: weekRange.substring(0, 50),
          classroom: classroom.substring(0, 30),
          teacher: teacher.substring(0, 20)
        });

        console.log(`  ✓ ${courseName}: (${startPeriod}-${endPeriod}节) ${weekRange.substring(0, 20)} | ${classroom} | ${teacher}`);
      }
    }
  }

  console.log(`\n\n=== 结果 ===`);
  console.log(`共解析 ${courses.length} 门课程`);

  // 显示有效课程
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

parseWithRegex().catch(console.error);

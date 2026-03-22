// 最佳努力解析器 - 使用所有可用信息
const { exec } = require('child_process');
const path = require('path');

async function bestEffortParser() {
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

  console.log('=== 最佳努力解析器 ===\n');
  console.log('文本总长度:', text.length);
  console.log('总行数:', lines.length);

  // 方法：扫描所有行，找到包含 (节次) 和/的行，这些是课程详情
  const courses = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 查找课程详情行模式：(X-Y 节) 周次/教室/教师
    // 放宽匹配条件
    const matches = [...line.matchAll(/\((\d+)-(\d+) 节\)([^/\n]+?)\/([^/\n]+?)\/([^\n/]+)/g)];

    for (const m of matches) {
      const startPeriod = m[1];
      const endPeriod = m[2];
      const weekRange = m[3].trim();
      const classroom = m[4].trim();
      const teacher = m[5].trim();

      // 清理教室（移除"教室"、"合堂"等后缀）
      const cleanClassroom = classroom.replace(/(教室 | 合堂 | 公共 | 中心 | 微机室)/g, '').trim();

      // 尝试从前面的行找到课程名
      let courseName = '未知';
      for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
        const prevLine = lines[j];
        if (prevLine.includes('☆')) {
          // 找到最近的☆行
          const names = prevLine.split('☆').filter(p => p.trim());
          if (names.length > 0) {
            courseName = names[0].trim();
          }
          break;
        }
      }

      courses.push({
        name: courseName,
        startPeriod,
        endPeriod,
        weekRange: weekRange.substring(0, 50),
        classroom: cleanClassroom,
        teacher: teacher.substring(0, 30)
      });

      console.log(`${courses.length}. ${courseName} | 节${startPeriod}-${endPeriod} | ${weekRange.substring(0, 20)} | ${cleanClassroom} | ${teacher}`);
    }
  }

  console.log(`\n共找到 ${courses.length} 条课程详情`);

  // 现在尝试将课程名和详情配对
  console.log('\n=== 课程名 + 详情配对 ===\n');

  // 收集所有课程名
  const courseNames = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('☆') && !line.trim().startsWith('(')) {
      const names = line.split('☆').filter(p => p.trim() && p.length >= 2 && p.length <= 30);
      courseNames.push(...names);
    }
  }

  console.log(`找到 ${courseNames.length} 个课程名`);
  console.log('课程名列表:');
  courseNames.slice(0, 20).forEach((n, i) => console.log(`  ${i + 1}. ${n}`));
  if (courseNames.length > 20) console.log(`  ... 还有 ${courseNames.length - 20} 个`);

  return { courses, courseNames };
}

bestEffortParser().catch(console.error);

// 全局正则解析器 - 直接从全文提取所有课程
const { exec } = require('child_process');

async function parseWithGlobalRegex() {
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

  console.log('=== 全局正则解析器 ===\n');

  const courses = [];

  // 策略：从全文中直接提取所有 (X-Y 节)...Kxxx.../教师 模式
  // 然后尝试找到对应的课程名

  // 首先，收集所有课程名及其位置
  const courseNameMap = new Map();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('\u2606')) { // ☆
      const names = line.split('\u2606').filter(p => p.trim() && p.length >= 2 && p.length <= 40);
      names.forEach((name, idx) => {
        const cleanName = name.trim();
        if (cleanName.length >= 2 && !cleanName.includes('(') && !cleanName.includes('/')) {
          courseNameMap.set(i * 100 + idx, cleanName);
        }
      });
    }
  }

  console.log(`找到 ${courseNameMap.size} 个课程名候选`);

  // 然后，从全文中提取所有课程详情
  // 格式：(X-Y 节) 周次 (可选/)Kxxx/教师
  const detailPattern = /\((\d+)-(\d+)\s*\u8282\)([^/]+?)\s*\/?(K\d+[^/\n]*?)\/([^/\n]+)/g;

  let match;
  const details = [];
  while ((match = detailPattern.exec(text)) !== null) {
    details.push({
      startPeriod: match[1],
      endPeriod: match[2],
      weekRange: match[3].trim(),
      classroom: match[4].trim(),
      teacherRaw: match[5].trim(),
      index: match.index
    });
  }

  console.log(`找到 ${details.length} 条课程详情\n`);

  // 现在，对每个详情，找到最近的课程名
  details.forEach((detail, idx) => {
    // 从详情位置向前找最近的课程名
    const detailLineNum = text.substring(0, detail.index).split('\n').length;

    // 向前找最多 5 行
    let courseName = '未知';
    for (let offset = 1; offset <= 5; offset++) {
      const checkLineNum = detailLineNum - offset;
      if (checkLineNum < 0) break;

      // 检查这行是否有课程名
      for (const [key, name] of courseNameMap.entries()) {
        const lineNum = Math.floor(key / 100);
        if (lineNum === checkLineNum) {
          courseName = name;
          break;
        }
      }
      if (courseName !== '未知') break;
    }

    // 清理教室和教师
    const classroom = detail.classroom.replace(/(教室 | 合堂 | 公共 | 中心 | 微机室 | 网络空间)/g, '').trim();
    const teacherMatch = detail.teacherRaw.match(/^([\u4e00-\u9fa5]{2,4})/);
    const teacher = teacherMatch ? teacherMatch[1] : detail.teacherRaw.split(/[\s;/]/)[0];

    // 只保留有效的课程
    if (teacher.length >= 2 && /[\u4e00-\u9fa5]/.test(teacher)) {
      courses.push({
        name: courseName,
        startPeriod: detail.startPeriod,
        endPeriod: detail.endPeriod,
        weekRange: detail.weekRange.substring(0, 50),
        classroom: classroom.substring(0, 30),
        teacher: teacher.substring(0, 20)
      });

      console.log(`${courses.length}. ${courseName}: (${detail.startPeriod}-${detail.endPeriod}节) ${classroom} ${teacher}`);
    }
  });

  console.log(`\n\n=== 结果 ===`);
  console.log(`共解析 ${courses.length} 门有效课程`);

  if (courses.length > 0) {
    console.log('\n课程列表:');
    courses.forEach((c, i) => {
      console.log(`${i + 1}. ${c.name} | 节${c.startPeriod}-${c.endPeriod} | ${c.weekRange.substring(0, 20)} | ${c.classroom} | ${c.teacher}`);
    });
  }

  return courses;
}

parseWithGlobalRegex().catch(console.error);

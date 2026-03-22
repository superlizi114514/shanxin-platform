// 课表解析器 - V6 简单直接版
const { exec } = require('child_process');

async function parseScheduleV6() {
  const command = `python extract-pdf-json.py`;

  const textResult = await new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve(JSON.parse(stdout.trim()));
    });
  });

  if (!textResult.success) {
    console.log('Python 提取失败:', textResult.error);
    return [];
  }

  const text = textResult.text;
  const lines = text.split('\n');

  console.log('=== 课表解析器 V6 ===\n');

  const courses = [];

  // 策略：直接搜索 /Kxxx/教师 模式，然后向前找 (X-Y 节) 和课程名
  const pattern = /\/(K\d+[^/]*?)\/([\u4e00-\u9fa5]{2,4})/g;
  const matches = [...text.matchAll(pattern)];

  console.log(`找到 ${matches.length} 个/K/教师 模式\n`);

  matches.forEach((m, idx) => {
    const classroomRaw = m[1].trim();
    const teacher = m[2];
    const matchIndex = m.index;

    // 清理教室
    const classroom = classroomRaw.replace(/(教室 | 合堂 | 公共 | 中心 | 微机室 | 网络空间)/g, '').trim();

    // 向前找 (X-Y 节)
    const textBefore = text.substring(0, matchIndex);
    const lastPeriodMatch = [...textBefore.matchAll(/\((\d+)-(\d+)\s*\u8282\)/g)].pop();

    let startPeriod = '?';
    let endPeriod = '?';
    if (lastPeriodMatch) {
      startPeriod = lastPeriodMatch[1];
      endPeriod = lastPeriodMatch[2];
    }

    // 计算行号，找课程名
    const lineNum = (textBefore.match(/\n/g) || []).length;

    // 向前找课程名（最多 10 行）
    let courseName = '未知';
    for (let i = lineNum - 1; i >= Math.max(0, lineNum - 10); i--) {
      const line = lines[i];
      if (line.includes('\u2606') && !line.trim().startsWith('(')) {
        const names = line.split('\u2606').filter(p => p.trim() && p.length >= 2 && p.length <= 40);
        const validNames = names.filter(n => !n.includes('(') && !n.includes('/') && !n.includes('周'));
        if (validNames.length > 0) {
          courseName = validNames[0].trim();
          break;
        }
      }
    }

    // 提取周次（从 (X-Y 节) 到/K 之间的内容）
    let weekRange = '';
    if (lastPeriodMatch) {
      const periodEnd = lastPeriodMatch.index + lastPeriodMatch[0].length;
      weekRange = text.substring(periodEnd, matchIndex).trim().replace(/\n/g, ' ').substring(0, 50);
      // 清理周次：移除首尾的/或空格
      weekRange = weekRange.replace(/^[\/\s]+|[\/\s]+$/g, '');
    }

    courses.push({
      name: courseName,
      startPeriod,
      endPeriod,
      weekRange,
      classroom,
      teacher
    });

    console.log(`${courses.length}. ${courseName}: (${startPeriod}-${endPeriod}节) ${weekRange.substring(0, 25)} | ${classroom} | ${teacher}`);
  });

  console.log(`\n\n=== 结果 ===`);
  console.log(`共解析 ${courses.length} 门课程`);

  // 去重
  const uniqueCourses = [];
  const seen = new Set();
  courses.forEach(c => {
    const key = `${c.name}-${c.startPeriod}-${c.endPeriod}-${c.classroom}-${c.teacher}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueCourses.push(c);
    }
  });

  console.log(`去重后 ${uniqueCourses.length} 门唯一课程`);

  if (uniqueCourses.length > 0) {
    console.log('\n完整课程列表:');
    uniqueCourses.forEach((c, i) => {
      console.log(`${i + 1}. ${c.name} | 节${c.startPeriod}-${c.endPeriod} | ${c.weekRange.substring(0, 30)} | ${c.classroom} | ${c.teacher}`);
    });
  }

  return uniqueCourses;
}

parseScheduleV6().catch(console.error);

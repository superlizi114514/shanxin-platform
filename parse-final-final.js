// 课表解析器 - 最终版
const { exec } = require('child_process');

async function parseSchedule() {
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

  console.log('=== 课表解析器 ===\n');

  const courses = [];

  // 从全文中提取所有 (X-Y 节) 模式及其位置
  const periodPattern = /\((\d+)-(\d+)\s*\u8282\)/g;
  const periodMatches = [...text.matchAll(periodPattern)];

  console.log(`找到 ${periodMatches.length} 个节次模式\n`);

  // 对每个节次模式，提取后续内容直到下一个/
  periodMatches.forEach((pm, idx) => {
    const startPeriod = pm[1];
    const endPeriod = pm[2];
    const matchIndex = pm.index;

    // 从匹配位置开始，找到后续的/K 或 K
    const remaining = text.substring(matchIndex);

    // 查找周次：从节次后到第一个 K 或/K
    const weekEndMatch = remaining.match(/^[^)]*?\)\s*([\d\-,\u5468\u53cc\u5355()\s]+?)\s*\/?(K\d+)/);
    if (!weekEndMatch) return;

    const weekRange = weekEndMatch[1].trim().replace(/\\n/g, ' ').substring(0, 50);
    let classroomStart = weekEndMatch.index + weekEndMatch[0].length - weekEndMatch[2].length;

    // 查找教室：Kxxx 到下一个/
    const classroomMatch = remaining.substring(classroomStart).match(/^(K\d+[^/\s]*)/);
    if (!classroomMatch) return;

    const classroom = classroomMatch[1].trim().replace(/(教室 | 合堂 | 公共 | 中心 | 微机室 | 网络空间)/g, '').substring(0, 30);

    // 查找教师：教室后的/后面的内容（可以是中文、字母等）
    const afterClassroom = remaining.substring(classroomStart + classroomMatch[0].length);
    const teacherMatch = afterClassroom.match(/^\/([^/\n;]{2,8})/);
    const teacher = teacherMatch ? teacherMatch[1].trim().match(/^([\u4e00-\u9fa5]{2,4})/)?.[1] || teacherMatch[1].trim().substring(0, 4) : '未知';

    // 计算这个课程在文本中的行号，用于查找课程名
    const lineNum = (text.substring(0, matchIndex).match(/\n/g) || []).length;

    // 向前查找课程名（最多 10 行）
    let courseName = '未知';
    for (let i = lineNum - 1; i >= Math.max(0, lineNum - 10); i--) {
      const line = lines[i];
      if (line.includes('\u2606') && !line.trim().startsWith('(')) {
        const names = line.split('\u2606').filter(p => p.trim() && p.length >= 2 && p.length <= 40);
        if (names.length > 0) {
          // 取第一个有效的课程名
          courseName = names[0].trim();
          break;
        }
      }
    }

    courses.push({
      name: courseName,
      startPeriod,
      endPeriod,
      weekRange,
      classroom,
      teacher
    });

    console.log(`${courses.length}. ${courseName}: (${startPeriod}-${endPeriod}节) ${weekRange.substring(0, 20)} | ${classroom} | ${teacher}`);
  });

  console.log(`\n\n=== 结果 ===`);
  console.log(`共解析 ${courses.length} 门课程`);

  // 去重（同一课程可能有多个时间段）
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

  return uniqueCourses;
}

parseSchedule().catch(console.error);

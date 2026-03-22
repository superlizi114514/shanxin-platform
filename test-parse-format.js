// 测试解析逻辑

const dayMap = {
  '星期一': 1, '周一': 1,
  '星期二': 2, '周二': 2,
  '星期三': 3, '周三': 3,
  '星期四': 4, '周四': 4,
  '星期五': 5, '周五': 5,
  '星期六': 6, '周六': 6,
  '星期日': 7, '周日': 7
};

const periodTimeMap = {
  1: { start: '08:00', end: '08:45' },
  2: { start: '08:55', end: '09:40' },
  3: { start: '10:00', end: '10:45' },
  4: { start: '10:55', end: '11:40' },
  5: { start: '14:00', end: '14:45' },
  6: { start: '14:55', end: '15:40' },
  7: { start: '16:00', end: '16:45' },
  8: { start: '16:55', end: '17:40' },
  9: { start: '18:30', end: '19:15' },
  10: { start: '19:25', end: '20:10' },
};

function parseFormat4(text) {
  const courses = [];
  const courseBlockRegex = /([^\n(]+) ☆\s*\n\((\d+)-(\d+) 节\)([\d,\-周 () 双单/]+?)\/([^/\n]+?)\/([^/\n]+?)\//g;

  let match;
  while ((match = courseBlockRegex.exec(text)) !== null) {
    console.log('匹配到:', match[0].substring(0, 100));

    const courseName = match[1].trim();
    const startPeriod = parseInt(match[2]);
    const endPeriod = parseInt(match[3]);
    const weekText = match[4];
    const classroomRaw = match[5];
    const teacherRaw = match[6];

    const classroom = classroomRaw.replace(/(?:教室 | 合堂教室 | 公共微机室)/g, '').trim();
    const teacher = teacherRaw.trim();

    if (!courseName || courseName.length < 2) {
      console.log('跳过：课程名无效');
      continue;
    }

    // 解析周次
    const weeks = new Set();
    const rangeRegex = /(\d+)-(\d+) 周/g;
    let weekMatch;
    while ((weekMatch = rangeRegex.exec(weekText)) !== null) {
      const start = parseInt(weekMatch[1]);
      const end = parseInt(weekMatch[2]);
      for (let i = start; i <= end; i++) weeks.add(i);
    }

    const weekList = Array.from(weeks);
    const weekStart = weekList.length > 0 ? Math.min(...weekList) : 1;
    const weekEnd = weekList.length > 0 ? Math.max(...weekList) : 16;

    const startTime = periodTimeMap[startPeriod]?.start || '';
    const endTime = periodTimeMap[endPeriod]?.end || '';

    // 确定星期
    const beforeText = text.substring(0, match.index);
    const dayMatches = [...beforeText.matchAll(/星期 ([一二三四五六日])/g)];
    const lastDayMatch = dayMatches.length > 0 ? dayMatches[dayMatches.length - 1][0] : null;
    const dayOfWeek = lastDayMatch ? dayMap[lastDayMatch] || 0 : 0;

    if (dayOfWeek === 0) {
      console.log('跳过：无法确定星期');
      continue;
    }

    courses.push({
      courseName,
      teacher,
      classroom,
      dayOfWeek,
      startTime,
      endTime,
      period: `${startPeriod}-${endPeriod}节`,
      weekStart,
      weekEnd,
    });

    console.log(`✓ 解析到：${courseName} | 周${dayOfWeek} | ${classroom} | ${teacher}`);
  }

  return courses;
}

// 测试数据
const testText = `2025-2026 学年第 2 学期 李涵课表 学号：2025010437
时间段 节次 星期一 星期二 星期三 星期四 星期五 星期六 星期日
上午
1 大学英语 D2☆
(1-2 节)1-2 周，4-6 周 (双),7-8 周，10-14 周/K4405 教室/赵海清/大学英语 D2-2025 级网络 1 班/2025 级网络 1 班/考试/无/讲授:56/周学时:4/总学时:56/学分:3.5
数据库应用技术☆
(1-2 节)15-17 周/K1217 合堂教室/匈牙利外教 1/数据库应用技术 -0008/2025 级网络 1 班;2025 级网络 2 班/考试/无/讲授:32，实验:32/周学时:4/总学时:64/学分:4.0
高等数学 C2☆
(1-2 节)1-2 周，4-13 周/K4407 教室/张馨镭/高等数学 C2-2025 级网络 1 班/2025 级网络 1 班/考试/无/讲授:48/周学时:4/总学时:48/学分:3.0
`;

console.log('========== 测试解析 ==========');
const result = parseFormat4(testText);
console.log('\n========== 结果 ==========');
console.log('解析到', result.length, '门课程');
result.forEach(c => {
  console.log(`- ${c.courseName} | 周${c.dayOfWeek} | ${c.classroom} | ${c.teacher} | ${c.period} | 第${c.weekStart}-${c.weekEnd}周`);
});

// 测试解析器是否能正确处理山信教务系统格式
const testText = `2025-2026 学年第 2 学期 李涵课表 学号：2025010437
时间段 节次 星期一 星期二 星期三 星期四 星期五 星期六 星期日
上午
1 大学英语 D2☆
(1-2 节)1-2 周，4-6 周 (双),7-8 周，10-14 周/K4405 教室/赵海清/大学英语 D2-2025 级网络 1 班
数据库应用技术☆
(1-2 节)15-17 周/K1217 合堂教室/匈牙利外教 1/数据库应用技术 -0008
`;

const lines = testText.split(/\r?\n/);
console.log('总行数:', lines.length);
console.log('内容预览:');
lines.forEach((line, i) => {
  console.log(`行${i}: "${line}"`);
});

// 测试☆匹配
const starIndex = testText.indexOf('☆');
console.log('\n☆位置:', starIndex);
console.log('☆周围:', testText.substring(Math.max(0, starIndex - 10), starIndex + 10));

// 测试行解析
const dayMap = {
  '星期一': 1, '周一': 1,
  '星期二': 2, '周二': 2,
  '星期三': 3, '周三': 3,
  '星期四': 4, '周四': 4,
  '星期五': 5, '周五': 5,
  '星期六': 6, '周六': 6,
  '星期日': 7, '周日': 7
};

let currentDay = 0;
const courses = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // 检测星期
  for (const [dayText, dayNum] of Object.entries(dayMap)) {
    if (line.includes(dayText)) {
      currentDay = dayNum;
      break;
    }
  }

  // 检测课程（带☆）
  if (line.includes('☆') && currentDay > 0) {
    const courseName = line.replace('☆', '').trim().replace(/^[0-9\s]+/, '');
    console.log(`\n找到课程：${courseName} (星期${currentDay})`);

    // 下一行应该是课程详情
    const nextLine = lines[i + 1];
    console.log(`详情行：${nextLine?.substring(0, 50)}`);

    if (nextLine && nextLine.startsWith('(')) {
      const detailMatch = nextLine.match(/\((\d+)-(\d+) 节\)([^/]+)\/([^/]+)\/([^/]+)/);
      if (detailMatch) {
        console.log(`✓ 解析成功：节${detailMatch[1]}-${detailMatch[2]} | ${detailMatch[4]} | ${detailMatch[5]}`);
        courses.push({
          courseName,
          dayOfWeek: currentDay,
          startPeriod: detailMatch[1],
          endPeriod: detailMatch[2],
          weekText: detailMatch[3],
          classroom: detailMatch[4],
          teacher: detailMatch[5],
        });
      } else {
        console.log(`✗ 详情解析失败`);
      }
    }
  }
}

console.log('\n========== 结果 ==========');
console.log('解析到', courses.length, '门课程');
courses.forEach(c => {
  console.log(`- ${c.courseName} | 周${c.dayOfWeek} | 节${c.startPeriod}-${c.endPeriod} | ${c.classroom} | ${c.teacher}`);
});

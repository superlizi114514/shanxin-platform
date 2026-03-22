const { parseSchedule } = require('./dist/schedule-parser');

const text = `2025-2026 学年第 2 学期 李涵课表 学号：2025010437
时间段 节次 星期一 星期二 星期三 星期四 星期五 星期六 星期日
上午
1 大学英语 D2☆
(1-2 节)1-2 周，4-6 周 (双),7-8 周，10-14 周/K4405 教室/赵海清
数据库应用技术☆
(1-2 节)15-17 周/K1217 合堂教室/匈牙利外教 1
`;

const result = parseSchedule(text, 'test-user');
console.log('解析结果:');
console.log('课程数:', result.courses.length);
console.log('元数据:', result.metadata);
result.courses.forEach(c => {
  console.log('课程:', c.courseName, '| 教师:', c.teacher, '| 教室:', c.classroom, '| 星期:', c.dayOfWeek, '| 节次:', c.period);
});

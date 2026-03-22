// 测试正确的正则

const testText = `2025-2026 学年第 2 学期 李涵课表 学号：2025010437
时间段 节次 星期一 星期二 星期三 星期四 星期五 星期六 星期日
上午
1 大学英语 D2☆
(1-2 节)1-2 周，4-6 周 (双),7-8 周，10-14 周/K4405 教室/赵海清/大学英语 D2-2025 级网络 1 班/2025 级网络 1 班/考试/无/讲授:56/周学时:4/总学时:56/学分:3.5
数据库应用技术☆
(1-2 节)15-17 周/K1217 合堂教室/匈牙利外教 1/数据库应用技术 -0008/2025 级网络 1 班;2025 级网络 2 班/考试/无/讲授:32，实验:32/周学时:4/总学时:64/学分:4.0
`;

// 归一化换行符
const normalizedText = testText.replace(/\r\n/g, '\n');

// 正确的正则 - \r\n 或 \n
const courseBlockRegex = /([^\n(]+) ☆\r?\n\((\d+)-(\d+) 节\)([\d,\-周 () 双单/]+?)\/([^/\n]+?)\/([^/\n]+?)\//g;

let match;
let count = 0;
while ((match = courseBlockRegex.exec(normalizedText)) !== null) {
  count++;
  console.log(`\n===== 课程 ${count} =====`);
  console.log('课程名:', match[1].trim());
  console.log('节次:', match[2], '-', match[3]);
  console.log('周次:', match[4]);
  console.log('教室:', match[5]);
  console.log('教师:', match[6]);
}

console.log('\n总共解析到:', count, '条课程');

// 如果还是 0，手动测试
if (count === 0) {
  console.log('\n手动测试:');
  const simpleRegex = /大学英语 D2☆/g;
  console.log('简单匹配:', simpleRegex.test(normalizedText));

  const newlineRegex = /D2☆\r?\n\(/g;
  console.log('换行匹配:', newlineRegex.test(normalizedText));
}

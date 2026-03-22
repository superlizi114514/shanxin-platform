// 调试正则

const testText = `2025-2026 学年第 2 学期 李涵课表 学号：2025010437
时间段 节次 星期一 星期二 星期三 星期四 星期五 星期六 星期日
上午
1 大学英语 D2☆
(1-2 节)1-2 周，4-6 周 (双),7-8 周，10-14 周/K4405 教室/赵海清/大学英语 D2-2025 级网络 1 班/2025 级网络 1 班/考试/无/讲授:56/周学时:4/总学时:56/学分:3.5
`;

console.log('测试文本包含☆:', testText.includes('☆'));

// 原始正则
const regex1 = /([^\n(]+) ☆\s*\n\((\d+)-(\d+) 节\)([\d,\-周 () 双单/]+?)\/([^/\n]+?)\/([^/\n]+?)\//g;
console.log('正则 1 匹配:', regex1.test(testText));

// 简化正则 - 去掉 \s*
const regex2 = /([^\n(]+) ☆\n\((\d+)-(\d+) 节\)([\d,\-周 () 双单/]+?)\/([^/\n]+?)\/([^/\n]+?)\//g;
console.log('正则 2 匹配:', regex2.test(testText));

// 更宽松的正则
const regex3 = /([^\n]+) ☆\n\((\d+)-(\d+) 节\)/g;
const match = testText.match(regex3);
console.log('正则 3 匹配:', match);

// 测试换行符
console.log('\\n 的数量:', (testText.match(/\n/g) || []).length);
console.log('文本预览:', JSON.stringify(testText.substring(0, 150)));

// 逐行检查
const lines = testText.split('\n');
lines.forEach((l, i) => {
  console.log(`行${i}:`, JSON.stringify(l.substring(0, 50)));
});

// 手动查找☆
const starIndex = testText.indexOf('☆');
console.log('\n☆位置:', starIndex);
console.log('☆前后:', JSON.stringify(testText.substring(starIndex - 10, starIndex + 30)));

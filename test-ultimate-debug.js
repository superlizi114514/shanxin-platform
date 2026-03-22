// 终极调试

const testText = `2025-2026 学年第 2 学期 李涵课表 学号：2025010437
时间段 节次 星期一 星期二 星期三 星期四 星期五 星期六 星期日
上午
1 大学英语 D2☆
(1-2 节)1-2 周，4-6 周 (双),7-8 周，10-14 周/K4405 教室/赵海清/大学英语 D2-2025 级网络 1 班/2025 级网络 1 班/考试/无/讲授:56/周学时:4/总学时:56/学分:3.5
`;

const normalizedText = testText.replace(/\r\n/g, '\n');

// 分步测试
console.log('步骤 1: 找☆');
const starRegex = /([^\n]+) ☆/g;
let m1 = starRegex.exec(normalizedText);
console.log('☆匹配:', m1 ? m1[0] : 'null');

if (m1) {
  console.log('\n步骤 2: 找节次');
  const afterStar = normalizedText.substring(m1.index + m1[0].length);
  console.log('☆后面:', JSON.stringify(afterStar.substring(0, 50)));

  const periodRegex = /\r?\n\((\d+)-(\d+) 节\)/g;
  let m2 = periodRegex.exec(afterStar);
  console.log('节次匹配:', m2 ? `(${m2[1]}-${m2[2]}节)` : 'null');

  if (m2) {
    console.log('\n步骤 3: 找完整课程块');
    const afterPeriod = afterStar.substring(m2.index + m2[0].length);
    console.log('节次后面:', JSON.stringify(afterPeriod.substring(0, 80)));

    // 完整匹配
    const fullRegex = /([^\n]+) ☆\r?\n\((\d+)-(\d+) 节\)([^/]+)\/([^/]+)\/([^/]+)/g;
    let m3 = fullRegex.exec(normalizedText);
    console.log('完整匹配:', m3 ? '成功' : '失败');
    if (m3) {
      console.log('组 1 (课程):', m3[1]);
      console.log('组 2 (开始节次):', m3[2]);
      console.log('组 3 (结束节次):', m3[3]);
      console.log('组 4 (周次):', m3[4]);
      console.log('组 5 (教室):', m3[5]);
      console.log('组 6 (教师):', m3[6]);
    }
  }
}

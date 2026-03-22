// 新课程表解析器 V3 - 按列位置解析横向表格
const { exec } = require('child_process');
const path = require('path');

async function parseScheduleV3() {
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
  const lines = text.split('\n').filter(l => l.trim());

  console.log('=== 解析山东信息职业技术学院课表 (V3 - 按列解析) ===\n');

  const courses = [];

  // 关键观察：
  // 行 2: 时间段 节次 星期一 星期二 星期三 星期四 星期五 星期六 星期日
  // 行 4: 大学英语 D2☆ 高等数学 C2☆ Web前端开发☆ 形势与政策 2☆ 高等数学 C2☆
  // 行 5-10: 详情（也是横向排列，每列对应上面的课程）

  // 策略：
  // 1. 找到课程名行（包含多个☆）
  // 2. 用☆分割得到课程名数组
  // 3. 收集后续若干行详情
  // 4. 将详情按列分割，匹配到对应课程

  let periodSection = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 检测节次行
    const periodMatch = line.match(/^\s*(\d+)\s*$/);
    if (periodMatch) {
      periodSection = periodMatch[1];
      continue;
    }

    // 检测课程名行（多个☆）
    if (line.includes('☆') && periodSection && !line.startsWith('(')) {
      const starCount = (line.match(/☆/g) || []).length;
      if (starCount < 1 || starCount > 7) continue; // 最多 7 天

      // 分割课程名 - 关键：按☆分割后取☆前面的内容
      const courseParts = line.split('☆').filter(p => p.trim()).slice(0, starCount);

      // 收集后续详情行（直到下一个节次或空行）
      let detailLines = [];
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        if (lines[j].match(/^\s*\d+\s*$/)) break; // 下一个节次
        if (lines[j].trim() === '') break;
        detailLines.push(lines[j]);
      }
      const fullDetail = detailLines.join('\n');

      console.log(`\n节次 ${periodSection}: ${courseParts.length} 门课程`);

      // 现在需要按列分割详情
      // 简单方法：查找每个课程的详情模式
      courseParts.forEach((namePart, idx) => {
        const courseName = namePart.trim();
        if (courseName.length < 2) return;

        // 尝试从详情中提取这个列的信息
        // 详情格式：(节次) 周次/教室/教师/...
        // 按空白分割详情，然后取对应位置
        const detailChunks = fullDetail.split(/\s+/).filter(c => c.length > 5);

        // 取第 idx 个详情块
        if (detailChunks[idx]) {
          // 解析详情块
          const detail = detailChunks[idx];
          const infoMatch = detail.match(/\((\d+)-(\d+) 节\)([^/]+)\/([^/]+)\/([^/]+)/);

          if (infoMatch) {
            console.log(`  ${idx + 1}. ${courseName}`);
            console.log(`     节次：${infoMatch[1]}-${infoMatch[2]}, 周次：${infoMatch[3]}, 教室：${infoMatch[4]}, 教师：${infoMatch[5]}`);
          } else {
            // 尝试另一个模式：直接/分隔
            const parts = detail.split('/').filter(p => p);
            if (parts.length >= 2) {
              console.log(`  ${idx + 1}. ${courseName} | ${parts[0]} | ${parts[1]}`);
            }
          }
        }
      });
    }
  }

  // 方法 2：整体解析 - 查找所有(节次) 周次/教室/教师模式
  console.log('\n\n=== 方法 2: 查找所有课程详情 ===\n');

  const detailPattern = /\((\d+)-(\d+) 节\)([^/\n]+?)\/([^/\n]+?)\/([^\n/]+)/g;
  const allDetails = [...text.matchAll(detailPattern)];

  console.log(`找到 ${allDetails.length} 个课程详情:`);
  allDetails.forEach((m, idx) => {
    console.log(`${idx + 1}. 节${m[1]}-${m[2]} | 周次：${m[3].trim().substring(0, 30)} | 教室：${m[4].trim()} | 教师：${m[5].trim()}`);
  });

  // 方法 3：结合课程名和详情
  console.log('\n\n=== 方法 3: 课程名 + 详情配对 ===\n');

  // 找到所有课程名（☆前面）
  const courseNamePattern = /([^\s☆(]+(?:\s*[^\s☆(]+)*)\s*☆/g;
  const courseNames = [...text.matchAll(courseNamePattern)]
    .map(m => m[1].trim())
    .filter(n => n.length >= 2 && !n.match(/^\d+$/));

  console.log(`找到 ${courseNames.length} 个课程名:`);
  courseNames.forEach((name, idx) => {
    if (idx < allDetails.length) {
      const d = allDetails[idx];
      console.log(`${idx + 1}. ${name} | 节${d[1]}-${d[2]} | ${d[4].trim()} | ${d[5].trim()}`);
    } else {
      console.log(`${idx + 1}. ${name} | (无详情)`);
    }
  });
}

parseScheduleV3().catch(console.error);

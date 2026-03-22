// 新课程表解析器 V2 - 按列解析
const { exec } = require('child_process');
const path = require('path');

async function parseScheduleV2() {
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
  const lines = text.split('\n');

  console.log('=== 解析山东信息职业技术学院课表 (V2) ===\n');

  const courses = [];

  // 方法：找到每个☆的位置，然后提取课程信息和详情
  // 课程格式：课程名☆ 后面跟多行详情

  let currentDay = 0;
  const dayPattern = /星期 [一二三四五六日]/;

  // 逐行扫描
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 检测星期行更新当前星期
    if (dayPattern.test(line)) {
      console.log(`行${i}: 星期表头`);
      continue;
    }

    // 检测节次数字
    if (/^\s*\d+\s*$/.test(line)) {
      console.log(`行${i}: 节次 ${line.trim()}`);
      continue;
    }

    // 找到包含☆的课程行
    if (line.includes('☆')) {
      // 用☆分割，每个部分是一个课程
      const parts = line.split('☆').filter(p => p.trim());
      console.log(`\n行${i}: 找到 ${parts.length} 个课程`);

      parts.forEach((part, idx) => {
        const courseName = part.trim();
        if (courseName.length < 2) return;

        // 从后续行提取详情
        // 详情格式：(节次) 周次/教室/教师/...
        let detailFound = null;
        for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
          const detailLine = lines[j];
          // 查找这个课程的详情（在同一列位置）
          const detailMatch = detailLine.match(new RegExp(
            `\\((\\d+)-(\\d+) 节\\)([{0,60}])([${courseName[0]}\\w/]+)`, 'g'
          ));
          if (detailMatch && detailMatch.length > idx) {
            detailFound = detailMatch[idx];
            break;
          }
        }

        console.log(`  ${idx + 1}. "${courseName}" ${detailFound ? '→ ' + detailFound.substring(0, 40) : ''}`);
      });
    }
  }

  // 更好的方法：直接用正则匹配所有课程块
  console.log('\n\n=== 方法 2: 正则匹配 ===\n');

  // 匹配模式：课程名☆后跟 (节次) 周次/教室/教师
  const fullText = text;
  const coursePattern = /([^\s(]+?) ☆\s*\n?\((\d+)-(\d+) 节\)([^/\n]+)\/([^/\n]+)\/([^/\n]+)/g;

  let match;
  let count = 0;
  while ((match = coursePattern.exec(fullText)) !== null) {
    count++;
    console.log(`${count}. ${match[1]} | 节${match[2]}-${match[3]} | ${match[4].trim()} | ${match[5].trim()} | ${match[6].trim()}`);
  }

  console.log(`\n共找到 ${count} 门课程`);
}

parseScheduleV2().catch(console.error);
